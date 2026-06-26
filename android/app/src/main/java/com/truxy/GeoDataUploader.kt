package com.truxy

import android.util.Log
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Shared HTTP uploader for ELD GeoData payloads.
 * Used by GeoDataForegroundService for live ELD uploads.
 */
object GeoDataUploader {

    private const val TAG = "GeoDataUploader"
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)

    data class UploadResult(
        val success: Boolean,
        val statusCode: Int,
        val responseBody: String,
        val endLogTime: String
    )

    fun upload(apiUrl: String, token: String, json: String, sessionStartTime: String): UploadResult {
        if (apiUrl.isBlank()) {
            Log.e(TAG, "Upload skipped – apiUrl is empty")
            return UploadResult(false, 0, "apiUrl is empty", isoFormat.format(Date()))
        }

        return try {
            val fields = buildFormFields(json, sessionStartTime)

            val boundary = "----TruxyFormBoundary${System.currentTimeMillis()}"
            val conn = (URL(apiUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty(
                    "Content-Type",
                    "multipart/form-data; boundary=$boundary"
                )
                setRequestProperty("Accept", "*/*")
                if (token.isNotEmpty()) setRequestProperty("Authorization", "Bearer $token")
                doOutput = true
                connectTimeout = 10_000
                readTimeout = 10_000
            }

            conn.outputStream.bufferedWriter(Charsets.UTF_8).use { writer ->
                for ((key, value) in fields) {
                    writer.append("--$boundary\r\n")
                    writer.append("Content-Disposition: form-data; name=\"$key\"\r\n")
                    writer.append("\r\n")
                    writer.append(value)
                    writer.append("\r\n")
                }
                writer.append("--$boundary--\r\n")
                writer.flush()
            }

            val code = conn.responseCode
            val responseBody = try {
                (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.readText() ?: ""
            } catch (_: Exception) { "" }
            conn.disconnect()

            if (code in 200..299) {
                Log.d(TAG, "API Response [$code]: $responseBody")
            } else {
                Log.w(TAG, "API Error [$code]: $responseBody | url=$apiUrl")
            }

            val endLogTime = fields["end_log_time"] ?: isoFormat.format(Date())
            UploadResult(code in 200..299, code, responseBody, endLogTime)
        } catch (e: Exception) {
            Log.w(TAG, "Upload exception: ${e.message}")
            UploadResult(false, 0, e.message ?: "unknown error", isoFormat.format(Date()))
        }
    }

    private fun buildFormFields(json: String, sessionStartTime: String): LinkedHashMap<String, String> {
        val obj = JSONObject(json)
        val (startLogTime, endLogTime) = resolveLogTimes(sessionStartTime)
        return linkedMapOf(
            "vin"            to obj.optString("vin"),
            "speed"          to obj.optDouble("speed", 0.0).toString(),
            "odometer"       to obj.optDouble("odometer", 0.0).toString(),
            "engineHours"    to obj.optDouble("engineHours", 0.0).toString(),
            "latitude"       to obj.optDouble("latitude", 0.0).toString(),
            "longitude"      to obj.optDouble("longitude", 0.0).toString(),
            "start_log_time" to startLogTime,
            "end_log_time"   to endLogTime,
            "request_json"   to obj.toString()
        )
    }

    /**
     * API requires end_log_time to be strictly after start_log_time.
     * When both would fall in the same second (first upload or rapid retries),
     * end is bumped forward by 1 second.
     */
    private fun resolveLogTimes(sessionStartTime: String): Pair<String, String> {
        val endDate = Date()
        var startDate: Date? = null
        if (sessionStartTime.isNotEmpty()) {
            try {
                startDate = isoFormat.parse(sessionStartTime)
            } catch (_: Exception) {
                startDate = null
            }
        }
        if (startDate == null) {
            startDate = Date(endDate.time - 1000L)
        }
        val resolvedEnd = if (startDate.before(endDate)) {
            endDate
        } else {
            Date(startDate.time + 1000L)
        }
        return Pair(isoFormat.format(startDate), isoFormat.format(resolvedEnd))
    }
}
