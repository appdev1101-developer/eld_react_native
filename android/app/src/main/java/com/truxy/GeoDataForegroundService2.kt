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
import kotlin.math.round
import android.content.pm.ServiceInfo
import java.util.concurrent.RejectedExecutionException

/**
 * A foreground service that maintains the Geometris/ELD connection in the background,
 * uploads GeoData readings to the server, and queues failed uploads in SQLite so they
 * are retried automatically when connectivity is restored.
 */
/*enum class ELDConnectionStatus {
    CONNECTED,
    CONNECTING,
    RECONNECTING,
    DISCONNECTED,
    STALE
}

class GeoDataForegroundService : Service() {

    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private lateinit var db: GeoDataDatabase
    private var apiUrl: String = ""
    private var token: String = ""
    private var savedDeviceAddress: String = ""
    private val isoFormat  = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.US)
    private var sessionStartTime: String = ""
    private val mainHandler = Handler(Looper.getMainLooper())

    private val crashlytics get() = CrashlyticsHelper.crashlytics

    // Reconnect state
    private var reconnectAttempts = 0
    private val reconnectBaseDelayMs = 2_000L
    private val reconnectMaxDelayMs = 30_000L
    private var reconnectRunnable: Runnable? = null
    @Volatile private var reconnectScheduled = false
    @Volatile private var sessionActive = false
    @Volatile private var isShuttingDown = false
    @Volatile private var isConnecting = false

    private var lastKnownStatus: ELDConnectionStatus? = null
    @Volatile private var lastDataReceivedAt: Long = 0L
    @Volatile private var isDataStale = true

    private val dataStallThresholdMs = 45_000L
    private val watchdogIntervalMs = 10_000L
    private var watchdogRunnable: Runnable? = null

    // FIX: After this many consecutive failed reconnects we force a full hard reset
    private val maxSoftReconnectAttempts = 5

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            executor.execute { flushQueue() }
        }
    }
    // Add this helper near the top of the class
    private fun safeExecute(block: () -> Unit) {
        try {
            if (!executor.isShutdown && !executor.isTerminated) {
                executor.execute(block)
            }
        } catch (e: RejectedExecutionException) {
            // Service is shutting down or executor already closed — ignore late work
            Log.w(TAG, "RejectedExecutionException ignored (service shutting down)")
            FileLogger.append(this, "RejectedExecutionException ignored: ${e.message}")
        }
    }

    private val bluetoothReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return

            if (action == BluetoothAdapter.ACTION_STATE_CHANGED) {
                when (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)) {
                    BluetoothAdapter.STATE_TURNING_OFF,
                    BluetoothAdapter.STATE_OFF -> {
                        Log.w(TAG, "Bluetooth is off")
                        notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
                        updateNotification("Bluetooth off – waiting")
                        cancelReconnect()
                    }
                    BluetoothAdapter.STATE_ON -> {
                        if (sessionActive && savedDeviceAddress.isNotBlank()) {
                            Log.i(TAG, "Bluetooth enabled; scheduling ELD reconnect")
                            scheduleReconnect(force = true)
                        }
                    }
                }
                return
            }

            if (action != BluetoothDevice.ACTION_ACL_CONNECTED &&
                action != BluetoothDevice.ACTION_ACL_DISCONNECTED) return

            val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            }
            if (device?.address != savedDeviceAddress) return

            when (action) {
                BluetoothDevice.ACTION_ACL_DISCONNECTED -> {
                    Log.w(TAG, "BT device disconnected – scheduling reconnect")
                    crashlytics.log("BT device disconnected: $savedDeviceAddress")
                    FileLogger.append(this@GeoDataForegroundService, "BT device disconnected: $savedDeviceAddress")
                    isDataStale = true
                    notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
                    updateNotification("ELD disconnected – reconnecting...")
                    scheduleReconnect(force = true)
                }
                BluetoothDevice.ACTION_ACL_CONNECTED -> {
                    Log.d(TAG, "BT link connected; re-establishing for ELD measurements")
                    crashlytics.log("BT link connected: $savedDeviceAddress")
                    FileLogger.append(this@GeoDataForegroundService, "BT link connected: $savedDeviceAddress")
                    notifyConnectionStatus(ELDConnectionStatus.CONNECTING)
                    cancelReconnect()
                    safeExecute {
                        if (!sessionActive || isShuttingDown) return@safeExecute
                        hardResetAndConnect()
                    }
                    updateNotification("Bluetooth linked – establishing ELD session")
                }
            }
        }
    }

    companion object {
        const val ACTION_START = "com.truxy.GeoDataForegroundService.START"
        const val ACTION_STOP  = "com.truxy.GeoDataForegroundService.STOP"
        // FIX: Explicit restart action used by notification tap
        const val ACTION_FORCE_RESTART = "com.truxy.GeoDataForegroundService.FORCE_RESTART"
        const val EXTRA_API_URL        = "API_URL"
        const val EXTRA_TOKEN          = "TOKEN"
        const val EXTRA_DEVICE_ADDRESS = "DEVICE_ADDRESS"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID      = "geo_data_channel"
        private const val TAG = "GeoDataService"
        private const val RESTART_REQUEST_CODE = 4001
        private const val NOTIFICATION_REQUEST_CODE = 4002

        var onGeoData: ((String) -> Unit)? = null
        var onConnectionStatusChanged: ((String) -> Unit)? = null
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

    private fun startForegroundCompat(text: String) {
        val notification = buildNotification(text)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            crashlytics.log("GeoDataForegroundService stop requested")
            FileLogger.append(this, "onStartCommand() — ACTION_STOP received")
            sessionActive = false
            isShuttingDown = true
            cancelReconnect()
            stopWatchdog()
            notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
            clearSavedPrefs()
            stopSelf()
            return START_NOT_STICKY
        }

        // FIX: Notification tap or explicit force-restart always clears stuck state
        val forceRestart = intent?.action == ACTION_FORCE_RESTART ||
                intent?.getBooleanExtra("FORCE_RESTART", false) == true

        crashlytics.log("GeoDataForegroundService onStartCommand() forceRestart=$forceRestart")
        FileLogger.append(this, "GeoDataForegroundService onStartCommand() forceRestart=$forceRestart")

        val freshDevice = intent?.getStringExtra(EXTRA_DEVICE_ADDRESS)
        if (!forceRestart && sessionActive && !isShuttingDown &&
            savedDeviceAddress.isNotBlank() && freshDevice.isNullOrEmpty() &&
            lastKnownStatus != ELDConnectionStatus.STALE &&
            lastKnownStatus != ELDConnectionStatus.DISCONNECTED) {
            startForegroundCompat("ELD data collection active")
            return START_STICKY
        }

        val prefs = getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)

        val deviceAddress: String
        if (intent != null && !intent.getStringExtra(EXTRA_DEVICE_ADDRESS).isNullOrEmpty()) {
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
            FileLogger.append(this, "onStartCommand() — resumed from saved prefs, device=$deviceAddress")
        }

        crashlytics.setCustomKey("eld_device_address", deviceAddress)
        crashlytics.setCustomKey("eld_api_url", apiUrl)

        if (apiUrl.isBlank()) {
            Log.e(TAG, "Cannot start – apiUrl is empty")
            notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
            stopSelf()
            return START_NOT_STICKY
        }

        startForegroundCompat("ELD data collection active")

        sessionActive = deviceAddress.isNotBlank()
        isShuttingDown = false
        savedDeviceAddress = deviceAddress

        // FIX: Always clear stuck flags on any restart path
        reconnectAttempts = 0
        reconnectScheduled = false
        isConnecting = false
        isDataStale = false
        lastDataReceivedAt = System.currentTimeMillis()

        val btAdapter = BluetoothAdapter.getDefaultAdapter()
        if (btAdapter == null || !btAdapter.isEnabled) {
            Log.w(TAG, "Bluetooth unavailable – waiting for Bluetooth to turn on")
            notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
            updateNotification("Bluetooth off – waiting")
        } else if (deviceAddress.isNotEmpty()) {
            notifyConnectionStatus(ELDConnectionStatus.CONNECTING)
            executor.execute { hardResetAndConnect() }
        }

        executor.execute { flushQueue() }
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.w(TAG, "onTaskRemoved() — scheduling restart")
        crashlytics.log("GeoDataForegroundService onTaskRemoved() — scheduling restart")
        FileLogger.append(this, "GeoDataForegroundService onTaskRemoved() — scheduling restart")

        val restartIntent = Intent(applicationContext, GeoDataForegroundService::class.java).apply {
            action = ACTION_FORCE_RESTART
        }
        val pendingIntent = PendingIntent.getService(
            applicationContext,
            RESTART_REQUEST_CODE,
            restartIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
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
        isShuttingDown = true
        sessionActive = false
        stopWatchdog()
        notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
        cancelReconnect()
        try { unregisterReceiver(bluetoothReceiver) } catch (_: Exception) {}
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            cm.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
        try {
            executor.execute {
                try { WherequbeService.getInstance().disconnect() } catch (_: Exception) {}
            }
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

    /**
     * FIX: Full hard reset of the Geometris SDK before connecting.
     * This is what the notification-tap path effectively does.
     */
    @SuppressLint("MissingPermission")
    private fun hardResetAndConnect() {
        if (!sessionActive || isShuttingDown) return
        isConnecting = true
        try {
            try { WherequbeService.getInstance().disconnect() } catch (_: Exception) {}
            Thread.sleep(800) // give the SDK a moment to fully release the BT socket
            WherequbeService.getInstance().initialize(applicationContext)
            startOBDSession(savedDeviceAddress, reconnecting = false)
        } catch (e: Exception) {
            Log.e(TAG, "hardResetAndConnect failed", e)
            crashlytics.recordException(e)
            FileLogger.append(this, "hardResetAndConnect failed: ${e.message}")
            scheduleReconnect(force = true)
        } finally {
            isConnecting = false
        }
    }

    @SuppressLint("MissingPermission")
    private fun startOBDSession(deviceAddress: String, reconnecting: Boolean = false) {
        if (!sessionActive || isShuttingDown) return
        isConnecting = true
        lastDataReceivedAt = System.currentTimeMillis()
        notifyConnectionStatus(
            if (reconnecting || reconnectAttempts > 0) ELDConnectionStatus.RECONNECTING
            else ELDConnectionStatus.CONNECTING
        )
        try {
            WherequbeService.getInstance().initialize(applicationContext)
            if (!reconnecting) {
                val connected = WherequbeService.getInstance().connect(deviceAddress)
                if (!connected) {
                    crashlytics.log("connect() returned false for $deviceAddress")
                    FileLogger.append(this, "connect() returned false for $deviceAddress")
                    Log.w(TAG, "connect() returned false for $deviceAddress")
                    notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
                    scheduleReconnect(force = true)
                    return
                }
            }
            sessionStartTime = isoFormat.format(Date())
            WherequbeService.getInstance().setReqHandler(
                BaseRequest.OBD_MEASUREMENT,
                object : RequestHandler {
                    override fun onRecv(ctx: Context, request: BaseRequest) {
                        val geoData = request.getObject() as? GeoData ?: return
                        lastDataReceivedAt = System.currentTimeMillis()
                        isDataStale = false
                        reconnectAttempts = 0
                        cancelReconnect()
                        notifyConnectionStatus(ELDConnectionStatus.CONNECTED)
                        safeExecute { handleGeoData(geoData) }
                    }
                }
            )
            Log.d(TAG, "OBD session handler registered for $deviceAddress")
            FileLogger.append(this, "OBD session handler registered for $deviceAddress")
        } catch (e: Exception) {
            Log.e(TAG, "OBD session error: ${e.message}", e)
            crashlytics.recordException(e)
            notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
            FileLogger.append(this, "OBD session error: ${e.message}")
            scheduleReconnect(force = true)
        } finally {
            isConnecting = false
        }
    }

    // FIX: Added force flag so watchdog / ACL events can break a stuck schedule
    private fun scheduleReconnect(force: Boolean = false) {
        if (!sessionActive || isShuttingDown) return
        if (reconnectScheduled && !force) return
        reconnectScheduled = true

        // FIX: After too many soft attempts, force a full service restart via AlarmManager
        if (reconnectAttempts >= maxSoftReconnectAttempts) {
            FileLogger.append(this, "Max soft reconnect attempts reached – forcing service restart")
            crashlytics.log("Max soft reconnect attempts reached – forcing service restart")
            reconnectAttempts = 0
            reconnectScheduled = false
            val restartIntent = Intent(applicationContext, GeoDataForegroundService::class.java).apply {
                action = ACTION_FORCE_RESTART
            }
            val pi = PendingIntent.getService(
                applicationContext, RESTART_REQUEST_CODE + 1, restartIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
            am.set(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime() + 1500, pi)
            return
        }

        val exponent = reconnectAttempts.coerceAtMost(4)
        val delayMs = minOf(reconnectBaseDelayMs * (1L shl exponent), reconnectMaxDelayMs)
        reconnectAttempts++

        updateNotification("ELD reconnecting – attempt $reconnectAttempts")
        FileLogger.append(this, "Reconnect scheduled in ${delayMs}ms; attempt=$reconnectAttempts")

        reconnectRunnable = Runnable {
            reconnectScheduled = false
            reconnectRunnable = null
            if (!sessionActive || isShuttingDown) return@Runnable

            val adapter = BluetoothAdapter.getDefaultAdapter()
            if (adapter == null || !adapter.isEnabled) {
                notifyConnectionStatus(ELDConnectionStatus.DISCONNECTED)
                updateNotification("Bluetooth off – waiting")
                return@Runnable
            }

            executor.execute {
                if (!sessionActive || isShuttingDown) return@execute
                if (isConnecting) {
                    // still busy – reschedule shortly
                    scheduleReconnect(force = true)
                    return@execute
                }
                try {
                    notifyConnectionStatus(ELDConnectionStatus.RECONNECTING)
                    hardResetAndConnect()
                } catch (e: Exception) {
                    Log.e(TAG, "Reconnect attempt failed", e)
                    crashlytics.recordException(e)
                    scheduleReconnect(force = true)
                }
            }
        }.also { mainHandler.postDelayed(it, delayMs) }
    }

    private fun cancelReconnect() {
        reconnectRunnable?.let { mainHandler.removeCallbacks(it) }
        reconnectRunnable = null
        reconnectScheduled = false
    }

    private fun notifyConnectionStatus(status: ELDConnectionStatus) {
        if (lastKnownStatus == status) return
        lastKnownStatus = status
        mainHandler.post {
            onConnectionStatusChanged?.invoke(status.name.lowercase(Locale.US))
        }
    }

    private fun startWatchdog() {
        stopWatchdog()
        watchdogRunnable = object : Runnable {
            override fun run() {
                if (sessionActive && !isShuttingDown) {
                    val lastDataAt = lastDataReceivedAt
                    val silentFor = if (lastDataAt > 0L) {
                        System.currentTimeMillis() - lastDataAt
                    } else Long.MAX_VALUE

                    if (!isDataStale && silentFor > dataStallThresholdMs) {
                        isDataStale = true
                        Log.w(TAG, "No valid OBD data for ${silentFor / 1000}s")
                        crashlytics.log("ELD data stale (${silentFor / 1000}s)")
                        FileLogger.append(this@GeoDataForegroundService,
                            "ELD data stale (${silentFor / 1000}s without valid GeoData)")
                        notifyConnectionStatus(ELDConnectionStatus.STALE)
                        updateNotification("ELD data stale – reconnecting")
                        // FIX: Force the reconnect so we break any stuck schedule
                        scheduleReconnect(force = true)
                    }
                }
                mainHandler.postDelayed(this, watchdogIntervalMs)
            }
        }
        mainHandler.postDelayed(watchdogRunnable!!, watchdogIntervalMs)
    }

    private fun stopWatchdog() {
        watchdogRunnable?.let { mainHandler.removeCallbacks(it) }
        watchdogRunnable = null
    }

    // -------------------------------------------------------------------------
    // Data handling (unchanged logic, kept for completeness)
    // -------------------------------------------------------------------------

    private fun handleGeoData(data: GeoData) {
        handlePayload(geoDataToJson(data))
    }

    private fun handlePayload(json: String) {
        onGeoData?.invoke(json)
        FileLogger.append(this, "Last data: ${timeFormat.format(Date())}")
    }

    private fun flushQueue() {
        if (!isNetworkAvailable()) return
        val pending = db.getAll()
        if (pending.isEmpty()) return
        Log.d(TAG, "Flushing ${pending.size} queued record(s)")
        FileLogger.append(this, "Flushing ${pending.size} queued record(s)")
        for ((id, payload) in pending) {
            if (uploadPayload(payload)) {
                db.delete(id)
            } else {
                Log.w(TAG, "Flush failed at record $id – will retry later")
                FileLogger.append(this, "Flush failed at record $id – will retry later")
                break
            }
        }
        val remaining = db.count()
        if (remaining == 0) {
            updateNotification("All records uploaded – ${timeFormat.format(Date())}")
        } else {
            updateNotification("$remaining record(s) still pending")
        }
    }

    private fun uploadPayload(json: String): Boolean {
        val result = GeoDataUploader.upload(apiUrl, token, json, sessionStartTime)
        if (result.success) {
            sessionStartTime = result.endLogTime.ifBlank { sessionStartTime }
        }
        return result.success
    }

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
            addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(bluetoothReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(bluetoothReceiver, filter)
        }
    }

    private fun clearSavedPrefs() {
        FileLogger.append(this, "clearSavedPrefs() called")
        getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().clear().apply()
    }

    private fun kmhToMph(speedKmh: Double): Int = speedKmh.toInt()

    private fun geoDataToJson(data: GeoData): String {
        val issues = CrashlyticsHelper.FieldIssues()
        val json = JSONObject().apply {
            try {
                put("dataSet", data.isDataSet)
                data.protocol?.let { put("protocolId", it) } ?: issues.nullFields.add("protocolId")
                put("vin", data.vin ?: "")
                if (data.vin.isNullOrBlank()) issues.nullFields.add("vin")
                if (data.odometer == null) issues.nullFields.add("odometer")
                put("odometer", kmhToMph(data.odometer ?: 0.0))
                put("odometerTimestamp", data.odometerTimestamp?.toString() ?: "")
                if (data.engTotalHours == null) issues.nullFields.add("engineHours")
                put("engineHours", data.engTotalHours ?: 0.0)
                put("engineHoursTimestamp", data.engTotalHoursTimestamp?.toString() ?: "")
                var finalSpeed = data.vehicleSpeed
                if (finalSpeed == null) issues.nullFields.add("speed")
                put("speed", kmhToMph(finalSpeed ?: 0.0))
                put("speedTimestamp", data.vehicleSpeedTimestamp?.toString() ?: "")
                if (data.engineRPM == null) issues.nullFields.add("engineRpm")
                put("engineRpm", data.engineRPM ?: 0.0)
                put("engineRpmTimestamp", data.engineRpmTimestamp?.toString() ?: "")
                if (data.fuelLevel == null) issues.nullFields.add("fuelLevel")
                put("fuelLevel", data.fuelLevel ?: 0.0)
                put("fuelLevelTimestamp", data.fuelLevelTimestamp?.toString() ?: "")
                CrashlyticsHelper.UNSUPPORTED_FIELDS.forEach { issues.nullFields.add(it) }
                put("coolantTemp", 0.0); put("coolantTempTimestamp", "")
                put("ecuVoltage", 0.0); put("ecuVoltageTimestamp", "")
                put("throttlePos", 0.0); put("throttlePosTimestamp", "")
                put("ambientTemp", 0.0); put("ambientTempTimestamp", "")
                put("obdMpg", 0.0); put("obdTripMpg", 0.0); put("obdInstantMpg", 0.0)
                put("milStatus", false); put("dtcCount", 0); put("regenSwitchStatus", false)
                if (data.latitude == null) issues.nullFields.add("latitude")
                if (data.longitude == null) issues.nullFields.add("longitude")
                put("latitude", data.latitude ?: 0.0)
                put("longitude", data.longitude ?: 0.0)
                put("gpsHeading", data.gpsHeading ?: 0.0)
                data.gpsTime?.let { put("gpsTime", it) } ?: issues.nullFields.add("gpsTime")
                put("timestamp", data.timeStamp?.toString() ?: "")
                if (data.timeStamp == null) issues.nullFields.add("timestamp")
                data.totalUdrvEvents?.let { put("totalUdrvEvents", it) }
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
        CrashlyticsHelper.reportFieldIssues(this, issues, json.toString(), savedDeviceAddress, "service")
        FileLogger.append(this, "<<< GDFS Data>>>> ${json}")
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

    // FIX: Notification tap now sends ACTION_FORCE_RESTART to the service itself.
    // This is the same clean path that previously only happened via the Activity.
    private fun buildNotification(text: String): Notification {
        val restartIntent = Intent(this, GeoDataForegroundService::class.java).apply {
            action = ACTION_FORCE_RESTART
        }
        val pendingIntent = PendingIntent.getService(
            this,
            NOTIFICATION_REQUEST_CODE,
            restartIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
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
}*/