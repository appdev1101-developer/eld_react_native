package com.truxy

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.geometris.wqlib.BaseRequest
import com.geometris.wqlib.GeoData
import com.geometris.wqlib.RequestHandler
import com.geometris.wqlib.WherequbeService
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * A foreground service that maintains the Geometris/ELD connection in the background,
 * uploads GeoData readings to the server, and queues failed uploads in SQLite so they
 * are retried automatically when connectivity is restored.
 */
class GeoDataForegroundService : Service() {

    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private lateinit var db: GeoDataDatabase
    private var apiUrl: String = ""
    private var token: String = ""
    private var savedDeviceAddress: String = ""
    private val isoFormat  = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.US)
    // Timestamp of when the current OBD reading "started" (first recv after session open)
    private var sessionStartTime: String = ""
    private val mainHandler = Handler(Looper.getMainLooper())

    // Crashlytics — shared instance/helpers, kept consistent with GeometrisModule
    private val crashlytics get() = CrashlyticsHelper.crashlytics

    // Reconnect state
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 5
    private val reconnectDelayMs = 10_000L   // 10 s between attempts
    private var reconnectRunnable: Runnable? = null

    // Connection-state tracking — separate from reconnectAttempts, this is
    // specifically "what should JS currently show for the red/green dot",
    // updated only on genuine transitions so onRecv() firing many times a
    // second doesn't spam the JS bridge with redundant events.
    private var lastKnownConnected: Boolean? = null
    private var lastDataReceivedAt: Long = 0L

    // Watchdog: ACTION_ACL_DISCONNECTED only fires for an actual radio-level
    // Bluetooth disconnect. It does NOT fire if the link stays up but the
    // OBD device silently stops sending measurements (a protocol-level
    // stall, not a radio-level one) — nothing previously detected that
    // case at all. This periodically checks how long it's been since the
    // last onRecv() and treats a long silence as a disconnect worth acting
    // on, not just something the UI happens to notice.
    private val dataStallThresholdMs = 45_000L
    private val watchdogIntervalMs = 20_000L
    private var watchdogRunnable: Runnable? = null

    // Modern network callback (API 21+)
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            executor.execute { flushQueue() }
        }
    }
    
    // Bluetooth ACL state receiver
    private val bluetoothReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent?.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent?.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            }
            // Only react to events for our connected device
            if (device?.address != savedDeviceAddress) return

            when (intent?.action) {
                BluetoothDevice.ACTION_ACL_DISCONNECTED -> {
                    Log.w(TAG, "BT device disconnected – scheduling reconnect")
                    crashlytics.log("BT device disconnected: $savedDeviceAddress")
                    FileLogger.append(this@GeoDataForegroundService, "BT device disconnected: $savedDeviceAddress")
                    notifyConnectionState(false)
                    updateNotification("ELD disconnected – reconnecting...")
                    scheduleReconnect()
                }
                BluetoothDevice.ACTION_ACL_CONNECTED -> {
                    Log.d(TAG, "BT device reconnected")
                    crashlytics.log("BT device reconnected: $savedDeviceAddress")
                    FileLogger.append(this@GeoDataForegroundService, "BT device reconnected: $savedDeviceAddress")
                    notifyConnectionState(true)
                    lastDataReceivedAt = System.currentTimeMillis()
                    cancelReconnect()
                    reconnectAttempts = 0
                    // Re-register the OBD handler so data keeps flowing
                    executor.execute { startOBDSession(savedDeviceAddress, reconnecting = true) }
                    updateNotification("ELD data collection active")
                }
            }
        }
    }

    companion object {
        const val ACTION_START = "com.truxy.GeoDataForegroundService.START"
        const val ACTION_STOP  = "com.truxy.GeoDataForegroundService.STOP"
        const val EXTRA_API_URL        = "API_URL"
        const val EXTRA_TOKEN          = "TOKEN"
        const val EXTRA_DEVICE_ADDRESS = "DEVICE_ADDRESS"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID      = "geo_data_channel"
        private const val TAG = "GeoDataService"
        private const val RESTART_REQUEST_CODE = 4001

        /**
         * Registered by GeoDataServiceModule so that the RN JS thread
         * receives live GeoData events while the app is in the foreground.
         */
        var onGeoData: ((String) -> Unit)? = null

        /**
         * Registered by GeoDataServiceModule, mirroring onGeoData exactly —
         * fires only on genuine connect/disconnect transitions (see
         * notifyConnectionState below), not on every data packet.
         */
        var onConnectionStateChanged: ((Boolean) -> Unit)? = null
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    override fun onCreate() {
        super.onCreate()
        crashlytics.log("GeoDataForegroundService created")
        FileLogger.append(this, "onCreate() — service instance created")
        db = GeoDataDatabase(this)
        createNotificationChannel()
        registerNetworkCallback()
        registerBluetoothReceiver()
        startWatchdog()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            crashlytics.log("GeoDataForegroundService stop requested")
            FileLogger.append(this, "onStartCommand() — ACTION_STOP received")
            clearSavedPrefs()
            stopSelf()
            return START_NOT_STICKY
        }
        crashlytics.log("GeoDataForegroundService onStartCommand()")
        FileLogger.append(this, "GeoDataForegroundService onStartCommand()")
        val prefs = getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)

        val deviceAddress: String
        if (intent != null &&
            !intent.getStringExtra(EXTRA_DEVICE_ADDRESS).isNullOrEmpty()) {
            crashlytics.log("GeoDataForegroundService if condition")
            FileLogger.append(this, "onStartCommand() — fresh start with device info from intent")
            apiUrl        = intent.getStringExtra(EXTRA_API_URL)        ?: ""
            token         = intent.getStringExtra(EXTRA_TOKEN)          ?: ""
            deviceAddress = intent.getStringExtra(EXTRA_DEVICE_ADDRESS) ?: ""
            prefs.edit()
                .putString(GeoDataPrefs.KEY_DEVICE,  deviceAddress)
                .putString(GeoDataPrefs.KEY_API_URL, apiUrl)
                .putString(GeoDataPrefs.KEY_TOKEN,   token)
                .apply()
        } else {
            deviceAddress = prefs.getString(GeoDataPrefs.KEY_DEVICE,  "") ?: ""
            apiUrl        = prefs.getString(GeoDataPrefs.KEY_API_URL, "") ?: ""
            token         = prefs.getString(GeoDataPrefs.KEY_TOKEN,   "") ?: ""
            FileLogger.append(
                this,
                "onStartCommand() — resumed from saved prefs (no intent extras), device=$deviceAddress"
            )
        }
        crashlytics.setCustomKey("eld_device_address", deviceAddress)
        crashlytics.setCustomKey("eld_api_url", apiUrl)
        crashlytics.log("GeoDataForegroundService -> data "+deviceAddress+"  "+ apiUrl)
        FileLogger.append(this, "GeoDataForegroundService -> data "+deviceAddress+"  "+ apiUrl)

        if (apiUrl.isBlank()) {
            Log.e(TAG, "Cannot start – apiUrl is empty")
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification("ELD data collection active"))

        // Guard: if Bluetooth is off entirely, stop immediately (nothing to connect to)
        val btAdapter = BluetoothAdapter.getDefaultAdapter()
        if (btAdapter == null || !btAdapter.isEnabled) {
            Log.w(TAG, "Bluetooth unavailable – stopping service")
            crashlytics.log("onStartCommand -> stopping: Bluetooth unavailable")
            FileLogger.append(this, "onStartCommand() — stopping: Bluetooth unavailable")
            clearSavedPrefs()
            stopSelf()
            return START_NOT_STICKY
        }

        // Start Geometris OBD session on background thread
        if (deviceAddress.isNotEmpty()) {
            savedDeviceAddress = deviceAddress
            reconnectAttempts = 0
            executor.execute { startOBDSession(deviceAddress) }
        }

        // Retry any records left over from a previous session
        executor.execute { flushQueue() }

        return START_STICKY
    }

    /**
     * Called when the user swipes the app away from the recent-apps task
     * switcher — a very common action drivers take believing it "closes"
     * the app, without realizing it can also kill an associated foreground
     * service on plenty of Android versions/OEM skins if nothing explicitly
     * handles it. Rather than trying to keep running from within a process
     * that may be torn down moments after this returns, this schedules a
     * restart via AlarmManager — onStartCommand's existing fallback (reading
     * device/API/token back out of SharedPreferences when no intent extras
     * are present) means the restarted service resumes correctly with no
     * further changes needed there.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.w(TAG, "onTaskRemoved() — app swiped from recents, scheduling restart")
        crashlytics.log("GeoDataForegroundService onTaskRemoved() — scheduling restart")
        FileLogger.append(this, "GeoDataForegroundService onTaskRemoved() — scheduling restart")

        val restartIntent = Intent(applicationContext, GeoDataForegroundService::class.java)
        val pendingIntent = PendingIntent.getService(
            applicationContext,
            RESTART_REQUEST_CODE,
            restartIntent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.set(
            AlarmManager.ELAPSED_REALTIME,
            SystemClock.elapsedRealtime() + 1000,
            pendingIntent
        )
    }

    override fun onDestroy() {

        super.onDestroy()
        crashlytics.log("GeoDataForegroundService onDestroy()")
        FileLogger.append(this, "GeoDataForegroundService onDestroy()")
        stopWatchdog()
        notifyConnectionState(false)
        cancelReconnect()
        try { unregisterReceiver(bluetoothReceiver) } catch (_: Exception) {}
        try { WherequbeService.getInstance().disconnect() } catch (_: Exception) {}
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            cm.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
        executor.shutdown()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // -------------------------------------------------------------------------
    // OBD session management
    // -------------------------------------------------------------------------

    @SuppressLint("MissingPermission")
    private fun startOBDSession(deviceAddress: String, reconnecting: Boolean = false) {
        try {
            WherequbeService.getInstance().initialize(applicationContext)
            if (!reconnecting) {
                val connected = WherequbeService.getInstance().connect(deviceAddress)
                if (!connected) {
                    crashlytics.log("connect() returned false for $deviceAddress")
                    FileLogger.append(this@GeoDataForegroundService, "connect() returned false for $deviceAddress")
                    Log.w(TAG, "connect() returned false for $deviceAddress")
                    notifyConnectionState(false)
                    scheduleReconnect()
                    return
                }
            }
            sessionStartTime = isoFormat.format(Date())
            lastDataReceivedAt = System.currentTimeMillis()
            WherequbeService.getInstance().setReqHandler(
                BaseRequest.OBD_MEASUREMENT,
                object : RequestHandler {
                    override fun onRecv(ctx: android.content.Context, request: BaseRequest) {
                        crashlytics.log("GeoDataForegroundService  onRecv()")
                        lastDataReceivedAt = System.currentTimeMillis()
                        notifyConnectionState(true)
                        FileLogger.append(this@GeoDataForegroundService, "GeoDataForegroundService  onRecv()")
                        val geoData = request.getObject() as? GeoData ?: return
                        executor.execute { handleGeoData(geoData) }
                    }
                }
            )
            Log.d(TAG, "OBD session started for $deviceAddress")
            crashlytics.log("OBD session started for $deviceAddress")
            FileLogger.append(this@GeoDataForegroundService, "OBD session started for $deviceAddress")
        } catch (e: Exception) {
            Log.e(TAG, "OBD session error: ${e.message}")
            crashlytics.log("OBD session error for $deviceAddress")
            crashlytics.recordException(e)
            notifyConnectionState(false)
            FileLogger.append(this@GeoDataForegroundService, "OBD session error for $deviceAddress: ${e.message}")
            scheduleReconnect()
        }
    }

    private fun scheduleReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.e(TAG, "Max reconnect attempts reached – stopping service")
            crashlytics.recordException(
            Exception("ELD max reconnect attempts reached for $savedDeviceAddress, stopping service")
            )
            FileLogger.append(
                this@GeoDataForegroundService,
                "Max reconnect attempts reached for $savedDeviceAddress — stopping service"
            )
            notifyConnectionState(false)
            clearSavedPrefs()
            mainHandler.post { stopSelf() }
            return
        }
        cancelReconnect()
        reconnectAttempts++
        Log.d(TAG, "Reconnect attempt $reconnectAttempts in ${reconnectDelayMs / 1000}s")
        FileLogger.append(
                this@GeoDataForegroundService,
                "Reconnect attempt $reconnectAttempts in ${reconnectDelayMs / 1000}s"
            )
        updateNotification("ELD disconnected – reconnecting ($reconnectAttempts/$maxReconnectAttempts)")
        reconnectRunnable = Runnable {
            val btAdapter = BluetoothAdapter.getDefaultAdapter()
            if (btAdapter == null || !btAdapter.isEnabled) {
                Log.w(TAG, "Bluetooth off during reconnect – stopping")
                clearSavedPrefs()
                stopSelf()
                return@Runnable
            }
            executor.execute { startOBDSession(savedDeviceAddress) }
        }.also { mainHandler.postDelayed(it, reconnectDelayMs) }
    }

    private fun cancelReconnect() {
        FileLogger.append(
                this@GeoDataForegroundService,
                "cancelReconnect()"
            )
        reconnectRunnable?.let { mainHandler.removeCallbacks(it) }
        reconnectRunnable = null
    }

    /** Only invokes the callback on an actual state transition — never spams JS. */
    private fun notifyConnectionState(connected: Boolean) {
        if (lastKnownConnected == connected) return
        lastKnownConnected = connected
        mainHandler.post { onConnectionStateChanged?.invoke(connected) }
    }

    private fun startWatchdog() {
        stopWatchdog()
        lastDataReceivedAt = System.currentTimeMillis()
        watchdogRunnable = object : Runnable {
            override fun run() {
                val connected = lastKnownConnected == true
                val silentFor = System.currentTimeMillis() - lastDataReceivedAt
                if (connected && silentFor > dataStallThresholdMs) {
                    Log.w(TAG, "No OBD data for ${silentFor / 1000}s while connected – forcing reconnect")
                    crashlytics.log("GeoData stall detected (${silentFor / 1000}s silent) – forcing reconnect")
                    FileLogger.append(
                        this@GeoDataForegroundService,
                        "GeoData stall detected (${silentFor / 1000}s silent) – forcing reconnect"
                    )
                    notifyConnectionState(false)
                    scheduleReconnect()
                }
                mainHandler.postDelayed(this, watchdogIntervalMs)
            }
        }
        mainHandler.postDelayed(watchdogRunnable!!, watchdogIntervalMs)
    }

    private fun stopWatchdog() {
        crashlytics.log("stopWatchdog() called")
        FileLogger.append(
            this@GeoDataForegroundService,
            "stopWatchdog() called"
        )
        watchdogRunnable?.let { mainHandler.removeCallbacks(it) }
        watchdogRunnable = null
    }

    // -------------------------------------------------------------------------
    // Data handling
    // -------------------------------------------------------------------------

    private fun handleGeoData(data: GeoData) {
        handlePayload(geoDataToJson(data))
    }

    private fun handlePayload(json: String) {
        onGeoData?.invoke(json)
        if (isNetworkAvailable()) {
            if (!uploadPayload(json)) {
                db.insert(json)
                Log.w(TAG, "Upload failed – queued (pending: ${db.count()})")
                crashlytics.log("GeoData upload failed, queued (pending=${db.count()})")
                FileLogger.append(
                        this@GeoDataForegroundService,
                        "GeoData upload failed, queued (pending=${db.count()})"
                    )
                updateNotification("Upload failed – ${db.count()} queued")
            } else {
                FileLogger.append(
                        this@GeoDataForegroundService,
                        "Last upload: ${timeFormat.format(Date())}"
                    )
                updateNotification("Last upload: ${timeFormat.format(Date())}")
            }
        } else {
            db.insert(json)
            Log.d(TAG, "Offline – queued (pending: ${db.count()})")
            crashlytics.log("GeoData queued offline (pending=${db.count()})")
            FileLogger.append(
                        this@GeoDataForegroundService,
                        "GeoData queued offline (pending=${db.count()})"
                    )
            updateNotification("Offline – ${db.count()} record(s) queued")
        }
    }

    /** Flush all queued records, oldest first. Stops on first failure to preserve order. */
    private fun flushQueue() {
        if (!isNetworkAvailable()) return
        val pending = db.getAll()
        if (pending.isEmpty()) return
        Log.d(TAG, "Flushing ${pending.size} queued record(s)")
        crashlytics.log("Flushing ${pending.size} queued record(s)")
        FileLogger.append(
                        this@GeoDataForegroundService,
                        "Flushing ${pending.size} queued record(s)"
                    )
        for ((id, payload) in pending) {
            if (uploadPayload(payload)) {
                db.delete(id)
            } else {
                Log.w(TAG, "Flush failed at record $id – will retry later")
                FileLogger.append(
                        this@GeoDataForegroundService,
                        "Flush failed at record $id – will retry later"
                    )
                crashlytics.log("GeoData flush failed at record $id, will retry")
                break
            }
        }
        val remaining = db.count()
        FileLogger.append(
                        this@GeoDataForegroundService,
                        "Remaining DB record - $remaining"
                    )
        if (remaining == 0) {
            updateNotification("All records uploaded – ${timeFormat.format(Date())}")
        } else {
            updateNotification("$remaining record(s) still pending")
        }
    }

    /** POST GeoData as multipart form-data to the ELD endpoint. Returns true on HTTP 2xx. */
    private fun uploadPayload(json: String): Boolean {
        val result = GeoDataUploader.upload(apiUrl, token, json, sessionStartTime)
        sessionStartTime = result.endLogTime
        return result.success
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val net  = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(net) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        cm.registerNetworkCallback(request, networkCallback)
    }

    private fun registerBluetoothReceiver() {
        val filter = IntentFilter().apply {
            addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED)
            addAction(BluetoothDevice.ACTION_ACL_CONNECTED)
        }
        registerReceiver(bluetoothReceiver, filter)
    }

    /** Erase persisted credentials – called only when JS explicitly stops the service. */
    private fun clearSavedPrefs() {
        FileLogger.append(
                        this@GeoDataForegroundService,
                        "clearSavedPrefs () called"
                    )
        getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().clear().apply()
    }

    private fun geoDataToJson(data: GeoData): String {
        val issues = CrashlyticsHelper.FieldIssues()
        val json = JSONObject().apply {
            try {
                // Basic status
                put("dataSet", data.isDataSet)
                data.protocol?.let { put("protocolId", it) } ?: issues.nullFields.add("protocolId")

                // Vehicle identification
                put("vin", data.vin ?: "")
                if (data.vin.isNullOrBlank()) issues.nullFields.add("vin")

                // Odometer
                if (data.odometer == null) issues.nullFields.add("odometer")
                put("odometer", data.odometer ?: 0.0)
                put("odometerTimestamp", data.odometerTimestamp?.toString() ?: "")

                // Engine hours
                if (data.engTotalHours == null) issues.nullFields.add("engineHours")
                put("engineHours", data.engTotalHours ?: 0.0)
                put("engineHoursTimestamp", data.engTotalHoursTimestamp?.toString() ?: "")

                // Speed - merge with unidentified events speed if normal speed is 0.0
                var finalSpeed = data.vehicleSpeed
                if (finalSpeed == null) issues.nullFields.add("speed")
                //if ((finalSpeed ?: 0.0) == 0.0) {
                //    try {
                //        data.unidentifiedEventArrayList?.lastOrNull()?.vehicleSpeed?.let { eventSpeed ->
                //            if (eventSpeed > 0.0) {
                //                finalSpeed = eventSpeed
                //            }
                //        }
                //    } catch (e: Exception) {
                //        issues.exceptions.add("speed_fallback" to e)
                //    }
                //    if ((finalSpeed ?: 0.0) == 0.0) issues.nullFields.add("speed_fallback_exhausted")
                //}
                put("speed", finalSpeed ?: 0.0)
                put("speedTimestamp", data.vehicleSpeedTimestamp?.toString() ?: "")

                // Engine RPM
                if (data.engineRPM == null) issues.nullFields.add("engineRpm")
                put("engineRpm", data.engineRPM ?: 0.0)
                put("engineRpmTimestamp", data.engineRpmTimestamp?.toString() ?: "")

                // Fuel level
                if (data.fuelLevel == null) issues.nullFields.add("fuelLevel")
                put("fuelLevel", data.fuelLevel ?: 0.0)
                put("fuelLevelTimestamp", data.fuelLevelTimestamp?.toString() ?: "")

                // Additional OBD parameters (from protocol 1+ data)
                // Note: These properties are not available in the current geometris library version.
                // Marked in CrashlyticsHelper.UNSUPPORTED_FIELDS so they're excluded from anomaly
                // reporting (they're expected-missing, not a bug) — uncomment per-field when the
                // library adds support.
                try {
                    CrashlyticsHelper.UNSUPPORTED_FIELDS.forEach { issues.nullFields.add(it) }

                    // data.coolantTemp?.let { put("coolantTemp", it) }
                    put("coolantTemp", 0.0)
                    put("coolantTempTimestamp", "")

                    // data.ecuVoltage?.let { put("ecuVoltage", it) }
                    put("ecuVoltage", 0.0)
                    put("ecuVoltageTimestamp", "")

                    // data.throttlePos?.let { put("throttlePos", it) }
                    put("throttlePos", 0.0)
                    put("throttlePosTimestamp", "")

                    // data.ambientTemp?.let { put("ambientTemp", it) }
                    put("ambientTemp", 0.0)
                    put("ambientTempTimestamp", "")

                    // data.obdMpg?.let { put("obdMpg", it) }
                    put("obdMpg", 0.0)
                    put("obdTripMpg", 0.0)
                    put("obdInstantMpg", 0.0)

                    // data.milStatus?.let { put("milStatus", it) }
                    put("milStatus", false)

                    // data.dtcCount?.let { put("dtcCount", it) }
                    put("dtcCount", 0)

                    // data.regenSwitchStatus?.let { put("regenSwitchStatus", it) }
                    put("regenSwitchStatus", false)
                } catch (e: Exception) {
                    issues.exceptions.add("unsupported_fields" to e)
                }

                // GPS location
                if (data.latitude == null) issues.nullFields.add("latitude")
                if (data.longitude == null) issues.nullFields.add("longitude")
                put("latitude", data.latitude ?: 0.0)
                put("longitude", data.longitude ?: 0.0)
                put("gpsHeading", data.gpsHeading ?: 0.0)
                data.gpsTime?.let { put("gpsTime", it) } ?: issues.nullFields.add("gpsTime")

                // General timestamp
                put("timestamp", data.timeStamp?.toString() ?: "")
                if (data.timeStamp == null) issues.nullFields.add("timestamp")

                // Unidentified events
                data.totalUdrvEvents?.let { put("totalUdrvEvents", it) }

                // Unidentified events array (if available)
                try {
                    data.unidentifiedEventArrayList?.let { eventList ->
                        val eventsArray = org.json.JSONArray()
                        eventList.forEach { event ->
                            val eventObj = JSONObject()
                            event.timestamp?.let { eventObj.put("timestamp", it) }
                            event.reason?.let { eventObj.put("reason", it) }
                            event.engTotalHours?.let { eventObj.put("engineHours", it) }
                            event.vehicleSpeed?.let { eventObj.put("speed", it) }
                            event.odometer?.let { eventObj.put("odometer", it) }
                            event.latitude?.let { eventObj.put("latitude", it) }
                            event.longitude?.let { eventObj.put("longitude", it) }
                            event.gpsTimestamp?.let { eventObj.put("gpsTimestamp", it) }
                            eventsArray.put(eventObj)
                        }
                        put("unidentifiedEvents", eventsArray)
                    }
                } catch (e: Exception) {
                    issues.exceptions.add("unidentifiedEvents" to e)
                }
            } catch (e: Exception) {
                issues.exceptions.add("geoDataToJson_top_level" to e)
            }
        }

        CrashlyticsHelper.reportFieldIssues(this@GeoDataForegroundService,issues, json.toString(), savedDeviceAddress, "service")
        crashlytics.log("<<< GDFS Data>>>> "+json.toString())
        FileLogger.append(this@GeoDataForegroundService, "<<< GDFS Data>>>> "+json.toString())
        return json.toString()
    }

    // -------------------------------------------------------------------------
    // Notification
    // -------------------------------------------------------------------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ELD Data Collection",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Collects and uploads ELD vehicle data in the background" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Truxy ELD")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Truxy ELD")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }
    }

    private fun updateNotification(text: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification(text))
    }
}