package com.truxy

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.geometris.wqlib.*


class GeometrisModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    
    // Crashlytics — shared instance/helpers, kept consistent with GeometrisModule
    private val crashlytics get() = CrashlyticsHelper.crashlytics

    // --- Bluetooth scan globals ---
    private var scanPromise: Promise? = null
    private val foundDevices = mutableMapOf<String, BluetoothDevice>()
    private val handler = Handler(Looper.getMainLooper())
    private var scanTimeoutRunnable: Runnable? = null

    // Set once a device connects successfully; used to tag Crashlytics reports.
    private var connectedDeviceAddress: String = ""

    // --- Bluetooth BroadcastReceiver ---
    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (BluetoothDevice.ACTION_FOUND == intent?.action) {
                val device: BluetoothDevice? = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                device?.let {
                    foundDevices[it.address] = it
                }
            }
        }
    }

    // --- Module name ---
    override fun getName() = "GeometrisBridge"

    // --- 1. Init Geometris on app startup ---
    init {
        crashlytics.log("GeometrisModule initializing")
        try {
            Wqa.getInstance().initialize(reactContext)
            WherequbeService.getInstance().initialize(reactContext)
        } catch (e: Exception) {
            crashlytics.recordException(e)
        }
    }

    // --- 2. Scan for Bluetooth Devices ---
    @SuppressLint("MissingPermission")
    @ReactMethod
    fun findBluetoothDevices(promise: Promise) {
        crashlytics.log("findBluetoothDevices called")
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            crashlytics.log("findBluetoothDevices: Bluetooth unavailable/disabled")
            promise.reject("BT_NOT_AVAILABLE", "Bluetooth is not available or not enabled")
            return
        }

        // Permissions check: Make sure JS side handles runtime permission for BLUETOOTH_SCAN/LOCATION

        foundDevices.clear()
        scanPromise = promise

        // Register receiver for found devices
        try {
            reactContext.registerReceiver(receiver, IntentFilter(BluetoothDevice.ACTION_FOUND))
        } catch (e: Exception) {
            // Ignore if already registered
        }

        // Start discovery
        bluetoothAdapter.startDiscovery()

        // Timeout after 10 seconds
        scanTimeoutRunnable = Runnable { stopDiscovery() }
        handler.postDelayed(scanTimeoutRunnable!!, 10000)
    }

    // --- Stop Bluetooth Discovery, Return Results ---
    @SuppressLint("MissingPermission")
    private fun stopDiscovery() {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        bluetoothAdapter?.cancelDiscovery()
        try {
            reactContext.unregisterReceiver(receiver)
        } catch (e: Exception) {
            // Ignore if not registered
        }

        handler.removeCallbacks(scanTimeoutRunnable ?: Runnable {})
        scanTimeoutRunnable = null

        scanPromise?.let { promise ->
            val devicesArray = Arguments.createArray()
            foundDevices.values.forEach { device ->
                val devMap = Arguments.createMap()
                devMap.putString("name", device.name ?: "Unknown")
                devMap.putString("address", device.address)
                devicesArray.pushMap(devMap)
            }
            crashlytics.log("Bluetooth scan finished, found ${foundDevices.size} device(s)")
            promise.resolve(devicesArray)
            scanPromise = null
        }
    }

    // (Optional) Expose a stopBluetoothScan for manual cancel from JS
    @ReactMethod
    fun stopBluetoothScan() {
        stopDiscovery()
    }

    // --- 3. Connect to device by address ---
    @ReactMethod
    fun connectToDevice(address: String, promise: Promise) {
        crashlytics.log("connectToDevice: $address")
        crashlytics.setCustomKey("eld_device_address", address)
        try {
            val result = WherequbeService.getInstance().connect(address)
            if (result) {
                connectedDeviceAddress = address
                promise.resolve(true)
            } else {
                crashlytics.log("connectToDevice failed (returned false): $address")
                promise.reject("CONNECT_ERROR", "Failed to connect")
            }
        } catch (e: Exception) {
            crashlytics.recordException(e)
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    // --- 4. Listen for OBD measurement data (GeoData) ---
    @ReactMethod
    fun startSession(promise: Promise) {
        crashlytics.log("startSession called")
        try {
            WherequbeService.getInstance().setReqHandler(
                BaseRequest.OBD_MEASUREMENT,
                object : RequestHandler {
                    override fun onRecv(context: android.content.Context, request: BaseRequest) {
                        val geoData = request.getObject() as? GeoData ?: return
                        sendEvent("GeometrisData", geoDataToMap(geoData))
                    }
                }
            )
            promise.resolve(true)
        } catch (e: Exception) {
            crashlytics.recordException(e)
            promise.reject("SESSION_ERROR", e.message)
        }
    }

    // --- 5. Disconnect ---
    @ReactMethod
    fun disconnect(promise: Promise) {
        crashlytics.log("disconnect called")
        try {
            WherequbeService.getInstance().disconnect()
            connectedDeviceAddress = ""
            promise.resolve(true)
        } catch (e: Exception) {
            crashlytics.recordException(e)
            promise.reject("DISCONNECT_ERROR", e.message)
        }
    }

    // --- Helper: Send events to JS ---
    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // --- Helper: Convert GeoData to JS object ---
    private fun geoDataToMap(data: GeoData): WritableMap {
        val map = Arguments.createMap()
        val issues = CrashlyticsHelper.FieldIssues()
        
        try {
        map.putBoolean("dataSet", data.isDataSet)
        data.protocol?.let { map.putInt("protocolId", it) } ?: issues.nullFields.add("protocolId")

        map.putString("vin", data.vin ?: "")
        if (data.vin.isNullOrBlank()) issues.nullFields.add("vin")

        if (data.odometer == null) issues.nullFields.add("odometer")
        map.putDouble("odometer", data.odometer ?: 0.0)
        map.putString("odometerTimestamp", data.odometerTimestamp?.toString() ?: "")

        if (data.engTotalHours == null) issues.nullFields.add("engineHours")
        map.putDouble("engineHours", data.engTotalHours ?: 0.0)
        map.putString("engineHoursTimestamp", data.engTotalHoursTimestamp?.toString() ?: "")

        // Speed - merge with unidentified events speed if normal speed is 0.0
        var finalSpeed = data.vehicleSpeed
        if (finalSpeed == null) issues.nullFields.add("speed")
        if ((finalSpeed ?: 0.0) == 0.0) {
            try {
                data.unidentifiedEventArrayList?.lastOrNull()?.vehicleSpeed?.let { eventSpeed ->
                    if (eventSpeed > 0.0) finalSpeed = eventSpeed
                }
            } catch (e: Exception) {
                issues.exceptions.add("speed_fallback" to e)
            }
            if ((finalSpeed ?: 0.0) == 0.0) issues.nullFields.add("speed_fallback_exhausted")
        }
        map.putDouble("speed", finalSpeed ?: 0.0)
        map.putString("speedTimestamp", data.vehicleSpeedTimestamp?.toString() ?: "")

        if (data.engineRPM == null) issues.nullFields.add("engineRpm")
        map.putDouble("engineRpm", data.engineRPM ?: 0.0)
        map.putString("engineRpmTimestamp", data.engineRpmTimestamp?.toString() ?: "")

        if (data.fuelLevel == null) issues.nullFields.add("fuelLevel")
        map.putDouble("fuelLevel", data.fuelLevel ?: 0.0)
        map.putString("fuelLevelTimestamp", data.fuelLevelTimestamp?.toString() ?: "")

        // Not yet exposed by the current geometris library version.
        CrashlyticsHelper.UNSUPPORTED_FIELDS.forEach { issues.nullFields.add(it) }
        map.putDouble("coolantTemp", 0.0); map.putString("coolantTempTimestamp", "")
        map.putDouble("ecuVoltage", 0.0); map.putString("ecuVoltageTimestamp", "")
        map.putDouble("throttlePos", 0.0); map.putString("throttlePosTimestamp", "")
        map.putDouble("ambientTemp", 0.0); map.putString("ambientTempTimestamp", "")
        map.putDouble("obdMpg", 0.0)
        map.putDouble("obdTripMpg", 0.0)
        map.putDouble("obdInstantMpg", 0.0)
        map.putBoolean("milStatus", false)
        map.putInt("dtcCount", 0)
        map.putBoolean("regenSwitchStatus", false)

        if (data.latitude == null) issues.nullFields.add("latitude")
        if (data.longitude == null) issues.nullFields.add("longitude")
        map.putDouble("latitude", data.latitude ?: 0.0)
        map.putDouble("longitude", data.longitude ?: 0.0)
        map.putDouble("gpsHeading", data.gpsHeading ?: 0.0)
        data.gpsTime?.let { map.putDouble("gpsTime", it.toDouble()) } ?: issues.nullFields.add("gpsTime")

        map.putString("timestamp", data.timeStamp?.toString() ?: "")
        if (data.timeStamp == null) issues.nullFields.add("timestamp")

        data.totalUdrvEvents?.let { map.putInt("totalUdrvEvents", it) }

        try {
            data.unidentifiedEventArrayList?.let { eventList ->
                val eventsArray = Arguments.createArray()
                eventList.forEach { event ->
                    val eventMap = Arguments.createMap()
                    event.timestamp?.let { eventMap.putDouble("timestamp", it.toDouble()) }
                    event.reason?.let { eventMap.putInt("reason", it) }
                    event.engTotalHours?.let { eventMap.putDouble("engineHours", it) }
                    event.vehicleSpeed?.let { eventMap.putDouble("speed", it) }
                    event.odometer?.let { eventMap.putDouble("odometer", it) }
                    event.latitude?.let { eventMap.putDouble("latitude", it) }
                    event.longitude?.let { eventMap.putDouble("longitude", it) }
                    event.gpsTimestamp?.let { eventMap.putDouble("gpsTimestamp", it.toDouble()) }
                    eventsArray.pushMap(eventMap)
                }
                map.putArray("unidentifiedEvents", eventsArray)
            }
        } catch (e: Exception) {
            issues.exceptions.add("unidentifiedEvents" to e)
        }
    } catch (e: Exception) {
        issues.exceptions.add("geoDataToMap_top_level" to e)
    }

    // Build a lightweight JSON snapshot purely for the Crashlytics report —
    // WritableMap can't be re-read back out, so we track raw values separately.
    val snapshot = "vin=${data.vin}, speed=${data.vehicleSpeed}, odometer=${data.odometer}, " +
        "lat=${data.latitude}, lng=${data.longitude}, rpm=${data.engineRPM}"
    CrashlyticsHelper.reportFieldIssues(issues, snapshot, deviceAddress = connectedDeviceAddress, source = "module")

    return map
    }

    @ReactMethod
    fun testNativeCrash() {
        if (!BuildConfig.DEBUG) return
        crashlytics.log("Deliberate test crash triggered from JS")
        throw RuntimeException("Test native crash via GeometrisModule")
    }
}
