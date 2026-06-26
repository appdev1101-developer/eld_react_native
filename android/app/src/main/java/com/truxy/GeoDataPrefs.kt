package com.truxy

/**
 * SharedPreferences key constants shared between GeoDataForegroundService,
 * GeoDataServiceModule, and BootReceiver.
 */
object GeoDataPrefs {
    const val PREFS_NAME  = "geo_data_service_prefs"
    const val KEY_DEVICE  = "device_address"
    const val KEY_API_URL = "api_url"
    const val KEY_TOKEN   = "token"
}
