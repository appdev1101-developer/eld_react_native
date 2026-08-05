package com.truxy

import com.google.firebase.crashlytics.FirebaseCrashlytics
import org.json.JSONObject

/**
 * Shared Crashlytics helpers used by both GeoDataForegroundService and
 * GeometrisModule, so field-issue tracking and throttling logic lives in
 * one place instead of drifting between the two GeoData conversion paths.
 */
object CrashlyticsHelper {

    val crashlytics: FirebaseCrashlytics by lazy { FirebaseCrashlytics.getInstance() }

    /** Fields known to be permanently unsupported by the current geometris library version. */
    val UNSUPPORTED_FIELDS = setOf(
        "coolantTemp", "ecuVoltage", "throttlePos", "ambientTemp",
        "obdMpg", "obdTripMpg", "obdInstantMpg", "milStatus", "dtcCount", "regenSwitchStatus"
    )

    class FieldIssues {
        val nullFields = mutableListOf<String>()
        val exceptions = mutableListOf<Pair<String, Exception>>()

        fun hasReportableIssues() =
            exceptions.isNotEmpty() || nullFields.any { it !in UNSUPPORTED_FIELDS }

        fun summary(): String {
            val reportableNulls = nullFields.filter { it !in UNSUPPORTED_FIELDS }
            return buildString {
                if (reportableNulls.isNotEmpty()) append("null=[${reportableNulls.joinToString(",")}] ")
                if (exceptions.isNotEmpty()) append("exceptions=[${exceptions.joinToString(",") { it.first }}]")
            }.trim()
        }
    }

    private var lastFieldIssueLogTime = 0L
    private val fieldIssueThrottleMs = 60_000L

    /**
     * Records data-quality issues found while converting a GeoData reading.
     * Real exceptions are always recorded; null-field summaries are throttled
     * to at most once per minute since they can repeat on every reading.
     */
    fun reportFieldIssues(issues: FieldIssues, rawJsonSnapshot: String, deviceAddress: String, source: String) {
        issues.exceptions.forEach { (context, e) ->
            crashlytics.setCustomKey("geodata_error_context", "$source:$context")
            crashlytics.recordException(e)
        }

        val now = System.currentTimeMillis()
        if (!issues.hasReportableIssues() || now - lastFieldIssueLogTime < fieldIssueThrottleMs) return
        lastFieldIssueLogTime = now

        crashlytics.setCustomKey("null_fields", issues.summary().take(1000))
        crashlytics.setCustomKey("eld_device_address", deviceAddress)
        crashlytics.setCustomKey("geodata_source", source)
        crashlytics.setCustomKey("geodata_snapshot", prettyJson(rawJsonSnapshot, 1000))
        crashlytics.recordException(Exception("GeoData null fields ($source): ${issues.summary()}"))
    }

    fun prettyJson(json: String, maxChars: Int = 4000): String {
        val pretty = try { JSONObject(json).toString(2) } catch (e: Exception) { json }
        return if (pretty.length > maxChars) pretty.take(maxChars) + "\n...[truncated]" else pretty
    }
}