package com.truxy

import android.annotation.SuppressLint
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

    // Reconnect state
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 5
    private val reconnectDelayMs = 10_000L   // 10 s between attempts
    private var reconnectRunnable: Runnable? = null

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
                    updateNotification("ELD disconnected – reconnecting...")
                    scheduleReconnect()
                }
                BluetoothDevice.ACTION_ACL_CONNECTED -> {
                    Log.d(TAG, "BT device reconnected")
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

        /**
         * Registered by GeoDataServiceModule so that the RN JS thread
         * receives live GeoData events while the app is in the foreground.
         */
        var onGeoData: ((String) -> Unit)? = null
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    override fun onCreate() {
        super.onCreate()
        db = GeoDataDatabase(this)
        createNotificationChannel()
        registerNetworkCallback()
        registerBluetoothReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            clearSavedPrefs()
            stopSelf()
            return START_NOT_STICKY
        }

        val prefs = getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)

        val deviceAddress: String
        if (intent != null &&
            !intent.getStringExtra(EXTRA_DEVICE_ADDRESS).isNullOrEmpty()) {
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
        }

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

    override fun onDestroy() {
        super.onDestroy()
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
                    Log.w(TAG, "connect() returned false for $deviceAddress")
                    scheduleReconnect()
                    return
                }
            }
            sessionStartTime = isoFormat.format(Date())
            WherequbeService.getInstance().setReqHandler(
                BaseRequest.OBD_MEASUREMENT,
                object : RequestHandler {
                    override fun onRecv(ctx: android.content.Context, request: BaseRequest) {
                        val geoData = request.getObject() as? GeoData ?: return
                        executor.execute { handleGeoData(geoData) }
                    }
                }
            )
            Log.d(TAG, "OBD session started for $deviceAddress")
        } catch (e: Exception) {
            Log.e(TAG, "OBD session error: ${e.message}")
            scheduleReconnect()
        }
    }

    private fun scheduleReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.e(TAG, "Max reconnect attempts reached – stopping service")
            clearSavedPrefs()
            mainHandler.post { stopSelf() }
            return
        }
        cancelReconnect()
        reconnectAttempts++
        Log.d(TAG, "Reconnect attempt $reconnectAttempts in ${reconnectDelayMs / 1000}s")
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
        reconnectRunnable?.let { mainHandler.removeCallbacks(it) }
        reconnectRunnable = null
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
                updateNotification("Upload failed – ${db.count()} queued")
            } else {
                updateNotification("Last upload: ${timeFormat.format(Date())}")
            }
        } else {
            db.insert(json)
            Log.d(TAG, "Offline – queued (pending: ${db.count()})")
            updateNotification("Offline – ${db.count()} record(s) queued")
        }
    }

    /** Flush all queued records, oldest first. Stops on first failure to preserve order. */
    private fun flushQueue() {
        if (!isNetworkAvailable()) return
        val pending = db.getAll()
        if (pending.isEmpty()) return
        Log.d(TAG, "Flushing ${pending.size} queued record(s)")
        for ((id, payload) in pending) {
            if (uploadPayload(payload)) {
                db.delete(id)
            } else {
                Log.w(TAG, "Flush failed at record $id – will retry later")
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
        getSharedPreferences(GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().clear().apply()
    }

    private fun geoDataToJson(data: GeoData): String {
        return JSONObject().apply {
            // Basic status
            put("dataSet", data.isDataSet)
            data.protocol?.let { put("protocolId", it) }
            
            // Vehicle identification
            put("vin", data.vin ?: "")
            
            // Odometer
            put("odometer", data.odometer ?: 0.0)
            put("odometerTimestamp", data.odometerTimestamp?.toString() ?: "")
            
            // Engine hours
            put("engineHours", data.engTotalHours ?: 0.0)
            put("engineHoursTimestamp", data.engTotalHoursTimestamp?.toString() ?: "")
            
            // Speed - merge with unidentified events speed if normal speed is 0.0
            var finalSpeed = data.vehicleSpeed ?: 0.0
            if (finalSpeed == 0.0) {
                try {
                    data.unidentifiedEventArrayList?.lastOrNull()?.vehicleSpeed?.let { eventSpeed ->
                        if (eventSpeed > 0.0) {
                            finalSpeed = eventSpeed
                        }
                    }
                } catch (e: Exception) {
                    // Ignore if unidentified events not available
                }
            }
            put("speed", finalSpeed)
            put("speedTimestamp", data.vehicleSpeedTimestamp?.toString() ?: "")
            
            // Engine RPM
            put("engineRpm", data.engineRPM ?: 0.0)
            put("engineRpmTimestamp", data.engineRpmTimestamp?.toString() ?: "")
            
            // Fuel level
            put("fuelLevel", data.fuelLevel ?: 0.0)
            put("fuelLevelTimestamp", data.fuelLevelTimestamp?.toString() ?: "")
            
            // Additional OBD parameters (from protocol 1+ data)
            // Note: These properties are not available in the current geometris library version
            // Uncomment when library is updated with these properties
            try {
                // Coolant temperature
                // data.coolantTemp?.let { put("coolantTemp", it) }
                // data.coolantTempTimestamp?.let { put("coolantTempTimestamp", it.toString()) }
                put("coolantTemp", 0.0)  // Placeholder - will be populated when library supports it
                put("coolantTempTimestamp", "")
                
                // ECU voltage
                // data.ecuVoltage?.let { put("ecuVoltage", it) }
                // data.ecuVoltageTimestamp?.let { put("ecuVoltageTimestamp", it.toString()) }
                put("ecuVoltage", 0.0)  // Placeholder
                put("ecuVoltageTimestamp", "")
                
                // Throttle position
                // data.throttlePos?.let { put("throttlePos", it) }
                // data.throttlePosTimestamp?.let { put("throttlePosTimestamp", it.toString()) }
                put("throttlePos", 0.0)  // Placeholder
                put("throttlePosTimestamp", "")
                
                // Ambient temperature
                // data.ambientTemp?.let { put("ambientTemp", it) }
                // data.ambientTempTimestamp?.let { put("ambientTempTimestamp", it.toString()) }
                put("ambientTemp", 0.0)  // Placeholder
                put("ambientTempTimestamp", "")
                
                // MPG data
                // data.obdMpg?.let { put("obdMpg", it) }
                // data.obdTripMpg?.let { put("obdTripMpg", it) }
                // data.obdInstantMpg?.let { put("obdInstantMpg", it) }
                put("obdMpg", 0.0)  // Placeholder
                put("obdTripMpg", 0.0)  // Placeholder
                put("obdInstantMpg", 0.0)  // Placeholder
                
                // MIL (Malfunction Indicator Lamp) status
                // data.milStatus?.let { put("milStatus", it) }
                put("milStatus", false)  // Placeholder
                
                // DTC (Diagnostic Trouble Code) count
                // data.dtcCount?.let { put("dtcCount", it) }
                put("dtcCount", 0)  // Placeholder
                
                // Regeneration switch status
                // data.regenSwitchStatus?.let { put("regenSwitchStatus", it) }
                put("regenSwitchStatus", false)  // Placeholder
            } catch (e: Exception) {
                // Some fields may not be available in older protocol versions
            }
            
            // GPS location
            put("latitude", data.latitude ?: 0.0)
            put("longitude", data.longitude ?: 0.0)
            put("gpsHeading", data.gpsHeading ?: 0.0)
            data.gpsTime?.let { put("gpsTime", it) }
            
            // General timestamp
            put("timestamp", data.timeStamp?.toString() ?: "")
            
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
                // Unidentified events may not be available in all protocol versions
            }
        }.toString()
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
