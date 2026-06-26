package com.truxy

import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log

/**
 * Starts the GeoDataForegroundService after a device reboot so that ELD data
 * collection resumes automatically without the user opening the app.
 *
 * - If Bluetooth is already on at boot: start the service immediately.
 * - If Bluetooth is still off at boot: register a one-shot listener for
 *   ACTION_STATE_CHANGED and start the service once BT turns on.
 *   The listener unregisters itself after the first successful start.
 *
 * No action is taken if no device address was previously saved in prefs.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON") return

        val prefs = context.getSharedPreferences(
            GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE
        )
        val deviceAddress = prefs.getString(GeoDataPrefs.KEY_DEVICE, null)
        val apiUrl        = prefs.getString(GeoDataPrefs.KEY_API_URL, null)

        if (deviceAddress.isNullOrEmpty() || apiUrl.isNullOrEmpty()) {
            Log.d("BootReceiver", "No saved ELD credentials – skipping auto-start")
            return
        }

        val btAdapter = BluetoothAdapter.getDefaultAdapter()

        if (btAdapter != null && btAdapter.isEnabled) {
            // Bluetooth is already on – start right away
            startService(context, deviceAddress, apiUrl,
                prefs.getString(GeoDataPrefs.KEY_TOKEN, "") ?: "")
        } else {
            // Bluetooth not yet on – wait for it
            Log.d("BootReceiver", "BT off at boot – waiting for BT to turn on")
            val btReceiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context?, stateIntent: Intent?) {
                    val state = stateIntent?.getIntExtra(
                        BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR
                    )
                    if (state == BluetoothAdapter.STATE_ON) {
                        Log.d("BootReceiver", "BT turned on – starting ELD service")
                        ctx?.unregisterReceiver(this)
                        val freshPrefs = ctx?.getSharedPreferences(
                            GeoDataPrefs.PREFS_NAME, Context.MODE_PRIVATE
                        ) ?: return
                        val addr  = freshPrefs.getString(GeoDataPrefs.KEY_DEVICE,  null) ?: return
                        val url   = freshPrefs.getString(GeoDataPrefs.KEY_API_URL, null) ?: return
                        val tok   = freshPrefs.getString(GeoDataPrefs.KEY_TOKEN,   "") ?: ""
                        startService(ctx, addr, url, tok)
                    }
                }
            }
            context.registerReceiver(
                btReceiver,
                IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
            )
        }
    }

    private fun startService(context: Context, deviceAddress: String, apiUrl: String, token: String) {
        Log.d("BootReceiver", "Starting GeoDataForegroundService for $deviceAddress")
        val serviceIntent = Intent(context, GeoDataForegroundService::class.java).apply {
            this.action = GeoDataForegroundService.ACTION_START
            putExtra(GeoDataForegroundService.EXTRA_DEVICE_ADDRESS, deviceAddress)
            putExtra(GeoDataForegroundService.EXTRA_API_URL,        apiUrl)
            putExtra(GeoDataForegroundService.EXTRA_TOKEN,          token)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
