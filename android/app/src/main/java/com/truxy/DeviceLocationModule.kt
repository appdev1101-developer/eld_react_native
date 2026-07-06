package com.truxy

import android.Manifest
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale
import java.util.concurrent.Executors

class DeviceLocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "DeviceLocation"

    private val mainHandler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        if (!hasLocationPermission()) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        val locationManager =
            reactContext.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager

        if (!isLocationEnabled(locationManager)) {
            promise.reject("LOCATION_DISABLED", "Device GPS is disabled")
            return
        }

        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            .filter { locationManager.isProviderEnabled(it) }

        if (providers.isEmpty()) {
            promise.reject("NO_PROVIDER", "No location provider available")
            return
        }

        var bestLocation: Location? = null
        for (provider in providers) {
            try {
                val last = locationManager.getLastKnownLocation(provider)
                if (last != null && isBetterLocation(last, bestLocation)) {
                    bestLocation = last
                }
            } catch (_: SecurityException) {
            }
        }

        if (bestLocation != null && isRecentEnough(bestLocation)) {
            resolveLocationAsync(promise, bestLocation)
            return
        }

        var resolved = false
        var activeListener: LocationListener? = null

        val timeoutRunnable = Runnable {
            if (resolved) return@Runnable
            resolved = true
            activeListener?.let {
                try {
                    locationManager.removeUpdates(it)
                } catch (_: Exception) {
                }
            }
            if (bestLocation != null) {
                resolveLocationAsync(promise, bestLocation)
            } else {
                promise.reject("TIMEOUT", "Unable to get current location")
            }
        }

        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (resolved) return
                resolved = true
                mainHandler.removeCallbacks(timeoutRunnable)
                for (provider in providers) {
                    try {
                        locationManager.removeUpdates(this)
                    } catch (_: Exception) {
                    }
                }
                resolveLocationAsync(promise, location)
            }

            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}

            override fun onProviderEnabled(provider: String) {}

            override fun onProviderDisabled(provider: String) {}
        }
        activeListener = listener

        mainHandler.postDelayed(timeoutRunnable, 12_000L)

        try {
            for (provider in providers) {
                locationManager.requestLocationUpdates(
                    provider,
                    0L,
                    0f,
                    listener,
                    Looper.getMainLooper()
                )
            }
        } catch (e: SecurityException) {
            resolved = true
            mainHandler.removeCallbacks(timeoutRunnable)
            promise.reject("PERMISSION_DENIED", e.message)
        } catch (e: Exception) {
            resolved = true
            mainHandler.removeCallbacks(timeoutRunnable)
            promise.reject("LOCATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun reverseGeocode(lat: Double, lng: Double, promise: Promise) {
        executor.execute {
            val address = reverseGeocodeInternal(lat, lng)
            mainHandler.post {
                promise.resolve(address ?: "")
            }
        }
    }

    private fun resolveLocationAsync(promise: Promise, location: Location) {
        executor.execute {
            val address = reverseGeocodeInternal(location.latitude, location.longitude)
            mainHandler.post {
                val result = Arguments.createMap().apply {
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putString("address", address ?: "")
                }
                promise.resolve(result)
            }
        }
    }

    private fun reverseGeocodeInternal(lat: Double, lng: Double): String? {
        if (!Geocoder.isPresent()) return null
        return try {
            val geocoder = Geocoder(reactContext, Locale.getDefault())
            @Suppress("DEPRECATION")
            val addresses = geocoder.getFromLocation(lat, lng, 1)
            if (!addresses.isNullOrEmpty()) {
                formatAddress(addresses[0])
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun formatAddress(address: Address): String {
        val line = address.getAddressLine(0)?.trim()
        if (!line.isNullOrBlank()) {
            return line
        }

        val parts = mutableListOf<String>()
        listOf(
            address.subThoroughfare,
            address.thoroughfare,
            address.locality,
            address.adminArea,
            address.postalCode,
            address.countryName
        ).forEach { value ->
            if (!value.isNullOrBlank()) {
                parts.add(value)
            }
        }
        return parts.joinToString(", ")
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun isLocationEnabled(locationManager: LocationManager): Boolean {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    private fun isRecentEnough(location: Location): Boolean {
        val ageMs = System.currentTimeMillis() - location.time
        return ageMs < 2 * 60 * 1000
    }

    private fun isBetterLocation(location: Location, currentBest: Location?): Boolean {
        if (currentBest == null) return true
        val timeDelta = location.time - currentBest.time
        if (timeDelta > 60_000) return true
        if (timeDelta < -60_000) return false
        return location.accuracy < currentBest.accuracy
    }
}