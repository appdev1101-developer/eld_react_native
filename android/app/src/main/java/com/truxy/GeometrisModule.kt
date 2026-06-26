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

    // --- Bluetooth scan globals ---
    private var scanPromise: Promise? = null
    private val foundDevices = mutableMapOf<String, BluetoothDevice>()
    private val handler = Handler(Looper.getMainLooper())
    private var scanTimeoutRunnable: Runnable? = null

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
        Wqa.getInstance().initialize(reactContext)
        WherequbeService.getInstance().initialize(reactContext)
    }

    // --- 2. Scan for Bluetooth Devices ---
    @SuppressLint("MissingPermission")
    @ReactMethod
    fun findBluetoothDevices(promise: Promise) {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
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
        try {
            val result = WherequbeService.getInstance().connect(address)
            if (result) {
                promise.resolve(true)
            } else {
                promise.reject("CONNECT_ERROR", "Failed to connect")
            }
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    // --- 4. Listen for OBD measurement data (GeoData) ---
    @ReactMethod
    fun startSession(promise: Promise) {
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
            promise.reject("SESSION_ERROR", e.message)
        }
    }

    // --- 5. Disconnect ---
    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            WherequbeService.getInstance().disconnect()
            promise.resolve(true)
        } catch (e: Exception) {
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
        
        // Basic status
        map.putBoolean("dataSet", data.isDataSet)
        data.protocol?.let { map.putInt("protocolId", it) }
        
        // Vehicle identification
        map.putString("vin", data.vin ?: "")
        
        // Odometer
        map.putDouble("odometer", data.odometer ?: 0.0)
        map.putString("odometerTimestamp", data.odometerTimestamp?.toString() ?: "")
        
        // Engine hours
        map.putDouble("engineHours", data.engTotalHours ?: 0.0)
        map.putString("engineHoursTimestamp", data.engTotalHoursTimestamp?.toString() ?: "")
        
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
        map.putDouble("speed", finalSpeed)
        map.putString("speedTimestamp", data.vehicleSpeedTimestamp?.toString() ?: "")
        
        // Engine RPM
        map.putDouble("engineRpm", data.engineRPM ?: 0.0)
        map.putString("engineRpmTimestamp", data.engineRpmTimestamp?.toString() ?: "")
        
        // Fuel level
        map.putDouble("fuelLevel", data.fuelLevel ?: 0.0)
        map.putString("fuelLevelTimestamp", data.fuelLevelTimestamp?.toString() ?: "")
        
        // Additional OBD parameters (from protocol 1+ data)
        // Note: These properties are not available in the current geometris library version
        // Uncomment when library is updated with these properties
        try {
            // Coolant temperature
            // data.coolantTemp?.let { map.putDouble("coolantTemp", it) }
            // data.coolantTempTimestamp?.let { map.putString("coolantTempTimestamp", it.toString()) }
            map.putDouble("coolantTemp", 0.0)  // Placeholder - will be populated when library supports it
            map.putString("coolantTempTimestamp", "")
            
            // ECU voltage
            // data.ecuVoltage?.let { map.putDouble("ecuVoltage", it) }
            // data.ecuVoltageTimestamp?.let { map.putString("ecuVoltageTimestamp", it.toString()) }
            map.putDouble("ecuVoltage", 0.0)  // Placeholder
            map.putString("ecuVoltageTimestamp", "")
            
            // Throttle position
            // data.throttlePos?.let { map.putDouble("throttlePos", it) }
            // data.throttlePosTimestamp?.let { map.putString("throttlePosTimestamp", it.toString()) }
            map.putDouble("throttlePos", 0.0)  // Placeholder
            map.putString("throttlePosTimestamp", "")
            
            // Ambient temperature
            // data.ambientTemp?.let { map.putDouble("ambientTemp", it) }
            // data.ambientTempTimestamp?.let { map.putString("ambientTempTimestamp", it.toString()) }
            map.putDouble("ambientTemp", 0.0)  // Placeholder
            map.putString("ambientTempTimestamp", "")
            
            // MPG data
            // data.obdMpg?.let { map.putDouble("obdMpg", it) }
            // data.obdTripMpg?.let { map.putDouble("obdTripMpg", it) }
            // data.obdInstantMpg?.let { map.putDouble("obdInstantMpg", it) }
            map.putDouble("obdMpg", 0.0)  // Placeholder
            map.putDouble("obdTripMpg", 0.0)  // Placeholder
            map.putDouble("obdInstantMpg", 0.0)  // Placeholder
            
            // MIL (Malfunction Indicator Lamp) status
            // data.milStatus?.let { map.putBoolean("milStatus", it) }
            map.putBoolean("milStatus", false)  // Placeholder
            
            // DTC (Diagnostic Trouble Code) count
            // data.dtcCount?.let { map.putInt("dtcCount", it) }
            map.putInt("dtcCount", 0)  // Placeholder
            
            // Regeneration switch status
            // data.regenSwitchStatus?.let { map.putBoolean("regenSwitchStatus", it) }
            map.putBoolean("regenSwitchStatus", false)  // Placeholder
        } catch (e: Exception) {
            // Some fields may not be available in older protocol versions
        }
        
        // GPS location
        map.putDouble("latitude", data.latitude ?: 0.0)
        map.putDouble("longitude", data.longitude ?: 0.0)
        map.putDouble("gpsHeading", data.gpsHeading ?: 0.0)
        data.gpsTime?.let { map.putDouble("gpsTime", it.toDouble()) }
        
        // General timestamp
        map.putString("timestamp", data.timeStamp?.toString() ?: "")
        
        // Unidentified events
        data.totalUdrvEvents?.let { map.putInt("totalUdrvEvents", it) }
        
        // Unidentified events array (if available)
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
            // Unidentified events may not be available in all protocol versions
        }
        
        return map
    }
}
