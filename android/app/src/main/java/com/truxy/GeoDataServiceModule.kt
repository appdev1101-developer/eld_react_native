package com.truxy

import android.content.Intent
import android.media.AudioManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import android.util.Log

/**
 * React Native bridge that starts/stops the GeoData foreground service,
 * exposes the pending upload count, and forwards ELD data/connection events.
 */
class GeoDataServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "GeoDataServiceModule"
    }

    init {
        // Event names must match the constants used by the React Native app.
        // Forward live GeoData events to JS.
        GeoDataForegroundService.onGeoData = { jsonString ->
            FileLogger.append(reactContext, "GeoDataForegroundService onGeoData() ")
            if (reactContext.hasActiveReactInstance()) {
                try {
                    Log.d(TAG, " #### onGeoData()")
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("GeometrisData", jsonToWritableMap(JSONObject(jsonString)))
                    FileLogger.append(reactContext, "GeoDataForegroundService onGeoData() emitted")
                } catch (e: Exception) {
                    // Do not allow a JS bridge error to interrupt the native service.
                    Log.e(TAG, "onGeoData error: ${e.message}", e)
                }
            }
        }

        // New detailed status event: connected, connecting, reconnecting,
        // disconnected, or stale. Keep this separate from the legacy event above.
        GeoDataForegroundService.onConnectionStatusChanged = { status ->
            if (reactContext.hasActiveReactInstance()) {
                try {
                    Log.d(TAG, "####  onConnectionStatusChanged() Status: ${status}")
                    val map = Arguments.createMap()
                    map.putString("status", status)
                    //map.putBoolean("connected", status == "connected")
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("ELD_CONNECTION_STATE_CHANGED", map)
                } catch (e: Exception) {
                    // Keep native connection handling independent of JS listener errors.
                    Log.e(TAG, "onConnectionStatusChanged error: ${e.message}", e)
                }
            }
        }
    }

    override fun getName() = "GeoDataService"

    // Required stubs so React Native does not warn about missing listener methods.
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun jsonToWritableMap(json: JSONObject): WritableMap {
        val map = Arguments.createMap()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            when (val v = json.get(key)) {
                is Boolean -> map.putBoolean(key, v)
                is Int -> map.putInt(key, v)
                is Long -> map.putDouble(key, v.toDouble())
                is Double -> map.putDouble(key, v)
                is String -> map.putString(key, v)
                else -> map.putString(key, v.toString())
            }
        }
        return map
    }

    /** Start the foreground service and save credentials for native restarts. */
    @ReactMethod
    fun startService(apiUrl: String, token: String, deviceAddress: String, promise: Promise) {
        try {
            reactContext.getSharedPreferences(
                GeoDataPrefs.PREFS_NAME,
                android.content.Context.MODE_PRIVATE
            ).edit()
                .putString(GeoDataPrefs.KEY_DEVICE, deviceAddress)
                .putString(GeoDataPrefs.KEY_API_URL, apiUrl)
                .putString(GeoDataPrefs.KEY_TOKEN, token)
                .apply()
            Log.d(TAG, "#### startService()")
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
            promise.reject("SERVICE_START_ERROR", e.message, e)
        }
    }

    /** Stop the foreground service gracefully. */
    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            Log.d(TAG, "#### stopService()")
            val intent = Intent(reactContext, GeoDataForegroundService::class.java).apply {
                action = GeoDataForegroundService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_STOP_ERROR", e.message, e)
        }
    }

    /** Returns how many GeoData records are currently queued for upload. */
    @ReactMethod
    fun getPendingCount(promise: Promise) {
        try {
            val count = GeoDataDatabase(reactContext).count()
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message, e)
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
            promise.reject("BEEP_ERROR", e.message, e)
        }
    }

    /** Checks whether the app is exempt from Android battery optimization. */
    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            val powerManager =
                reactContext.getSystemService(android.content.Context.POWER_SERVICE) as PowerManager
            promise.resolve(powerManager.isIgnoringBatteryOptimizations(reactContext.packageName))
        } catch (e: Exception) {
            promise.reject("BATTERY_OPT_CHECK_ERROR", e.message, e)
        }
    }

    /** Opens the system prompt requesting battery-optimization exemption. */
    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
        } catch (_: Exception) {
            // Fall back to app settings on devices that do not implement the prompt.
            try {
                val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${reactContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(fallback)
            } catch (_: Exception) {
            }
        }
    }
}
