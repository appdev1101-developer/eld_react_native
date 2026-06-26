package com.truxy

import android.content.Intent
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

/**
 * React Native bridge that lets JS start/stop the background GeoData foreground service
 * and query how many records are currently queued waiting to be uploaded.
 *
 * Also forwards live GeoData events to JS via the "GeometrisData" DeviceEventEmitter
 * so the UI updates in real time while the app is in the foreground.
 */
class GeoDataServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        // Forward native service data events to the RN JS thread
        GeoDataForegroundService.onGeoData = { jsonString ->
            if (reactContext.hasActiveReactInstance()) {
                try {
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("GeometrisData", jsonToWritableMap(JSONObject(jsonString)))
                } catch (_: Exception) {}
            }
        }
    }

    override fun getName() = "GeoDataService"

    // Required stubs so RN does not warn about missing addListener / removeListeners
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    private fun jsonToWritableMap(json: JSONObject): WritableMap {
        val map = Arguments.createMap()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            when (val v = json.get(key)) {
                is Boolean -> map.putBoolean(key, v)
                is Int     -> map.putInt(key, v)
                is Long    -> map.putDouble(key, v.toDouble())
                is Double  -> map.putDouble(key, v)
                is String  -> map.putString(key, v)
                else       -> map.putString(key, v.toString())
            }
        }
        return map
    }

    /**
     * Start the foreground service.
     * Credentials are also saved to SharedPreferences here so that
     * BootReceiver and START_STICKY restarts can recover without a JS context.
     */
    @ReactMethod
    fun startService(apiUrl: String, token: String, deviceAddress: String, promise: Promise) {
        try {
            reactContext.getSharedPreferences(GeoDataPrefs.PREFS_NAME, android.content.Context.MODE_PRIVATE)
                .edit()
                .putString(GeoDataPrefs.KEY_DEVICE,  deviceAddress)
                .putString(GeoDataPrefs.KEY_API_URL, apiUrl)
                .putString(GeoDataPrefs.KEY_TOKEN,   token)
                .apply()

            val intent = Intent(reactContext, GeoDataForegroundService::class.java).apply {
                action = GeoDataForegroundService.ACTION_START
                putExtra(GeoDataForegroundService.EXTRA_API_URL, apiUrl)
                putExtra(GeoDataForegroundService.EXTRA_TOKEN, token)
                putExtra(GeoDataForegroundService.EXTRA_DEVICE_ADDRESS, deviceAddress)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_START_ERROR", e.message)
        }
    }

    /** Stop the foreground service gracefully. */
    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val intent = Intent(reactContext, GeoDataForegroundService::class.java).apply {
                action = GeoDataForegroundService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_STOP_ERROR", e.message)
        }
    }

    /** Returns how many GeoData records are currently queued (not yet uploaded). */
    @ReactMethod
    fun getPendingCount(promise: Promise) {
        try {
            val count = GeoDataDatabase(reactContext).count()
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message)
        }
    }

    /** Plays a short system beep when the ELD device connects. */
    @ReactMethod
    fun playConnectionBeep(promise: Promise) {
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
            Handler(Looper.getMainLooper()).postDelayed({ toneGen.release() }, 250)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("BEEP_ERROR", e.message)
        }
    }
}
