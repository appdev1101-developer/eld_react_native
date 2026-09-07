package com.truxy

import android.content.Context
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Native counterpart to App/core/logger/fileLogger.ts — writes to the
 * exact same file so JS-side breadcrumbs and native diagnostics (from
 * GeoDataForegroundService, GeoDataUploader, CrashlyticsHelper, etc.) end
 * up in one combined log, not two separate ones.
 *
 * File location: context.filesDir — this is what RNFS.DocumentDirectoryPath
 * resolves to on Android, so both sides are genuinely writing to the same
 * path, not just similarly-named files.
 *
 * This exists specifically because the foreground service keeps running
 * even when JS isn't active (app backgrounded, JS thread torn down) — the
 * most valuable diagnostic moments (a dropped ELD connection, a failed
 * upload while the app wasn't in the foreground) happen in exactly the
 * window where only native code is running at all.
 */
object FileLogger {

    private const val FILE_NAME = "app-diagnostic-logs-"
    private const val MAX_BYTES = 2 * 1024 * 1024L // 2MB
    private const val TRIM_TO_BYTES = 1 * 1024 * 1024L

    // Single background thread — serializes writes from this process the
    // same way the JS side serializes its own writes with a promise queue.
    // Does not coordinate with the JS side's own queue (separate
    // threads/processes); see fileLogger.ts's concurrency note for why
    // that's an accepted, reasonable limitation for a diagnostic log.
    private val executor = Executors.newSingleThreadExecutor()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    private fun getLogFile(context: Context): File {
        val dateFormat1 = SimpleDateFormat("dd-MM", Locale.US)
        val formattedDate= dateFormat1.format(Date())
        return File(context.filesDir, FILE_NAME+formattedDate+".txt")
    }

    fun append(context: Context, message: String) {
        executor.execute {
            try {
                val file = getLogFile(context)
                val timestamp = dateFormat.format(Date())
                val line = "[$timestamp] [native] $message\n"
                file.appendText(line)
                trimIfNeeded(file)
            } catch (e: Exception) {
                // Deliberately not recorded to Crashlytics from here — a
                // failure writing the diagnostic log shouldn't itself
                // become a source of crash-report noise.
            }
        }
    }

    private fun trimIfNeeded(file: File) {
        if (file.length() <= MAX_BYTES) return
        try {
            val content = file.readText()
            val trimmed = content.takeLast(TRIM_TO_BYTES.toInt())
            val firstNewline = trimmed.indexOf('\n')
            val clean = if (firstNewline >= 0) trimmed.substring(firstNewline + 1) else trimmed
            file.writeText(clean)
        } catch (e: Exception) {
            // Best-effort trim — if it fails, the next append's check will retry.
        }
    }
}