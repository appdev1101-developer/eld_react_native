import {
    getCrashlytics,
    setCrashlyticsCollectionEnabled,
    setUserId,
    setAttribute,
    setAttributes,
    log as fbLog,
    recordError as fbRecordError,
    crash as fbCrash,
} from '@react-native-firebase/crashlytics';

/**
 * Thin wrapper around Crashlytics. Nothing in the rest of the app should
 * import '@react-native-firebase/crashlytics' directly — go through this
 * module, so the logging strategy (what we send, what we redact, whether
 * it's enabled in dev) stays in one place.
 *
 * Crashlytics has hard limits worth knowing before you sprinkle calls
 * everywhere:
 *  - `log()` breadcrumbs: last ~64KB kept, attached to the *next* crash/error,
 *    not sent anywhere on their own. Fine for lots of small breadcrumbs.
 *  - `setAttribute`/`setAttributes`: max 64 key/value pairs, keys ≤64 chars,
 *    values ≤1024 chars, and they persist until overwritten — good for
 *    "current state" (app version, duty status, connectivity), bad for
 *    high-frequency changing data.
 *  - Never log auth tokens, full API payloads, or driver PII beyond an id —
 *    Crashlytics reports are visible to anyone with Firebase console access.
 */

const crashlyticsInstance = getCrashlytics();

let enabled = false;

export async function initCrashlytics(options?: { forceEnableInDev?: boolean }) {
    const shouldEnable = !__DEV__ || options?.forceEnableInDev === true;
    await setCrashlyticsCollectionEnabled(crashlyticsInstance, shouldEnable);
    enabled = shouldEnable;
    logger.log(`Crashlytics initialized (enabled=${shouldEnable})`);
}

/**
 * Call once after login succeeds, and again on logout (with null) so crash
 * reports can be tied to a driver without leaking PII beyond an id.
 */
export function identifyUser(userId: string | number | null) {
    setUserId(crashlyticsInstance, userId != null ? String(userId) : '');
}

/**
 * Persistent key/value context shown alongside every subsequent crash/error
 * for this session — e.g. current duty status, ELD device connection state,
 * app version. Overwrite the same key to update it; don't call this in a
 * tight loop (64-key limit, and each call is a native bridge round trip).
 */
export function setContext(key: string, value: string | number | boolean) {
    setAttribute(crashlyticsInstance, key, String(value));
}

export function setContextBatch(values: Record<string, string | number | boolean>) {
    const stringified: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
        stringified[key] = String(value);
    });
    setAttributes(crashlyticsInstance, stringified);
}

/**
 * Breadcrumb log — cheap, use liberally for anything you'd want to see in
 * the timeline leading up to a crash (screen views, duty status changes,
 * sync attempts, BLE connect/disconnect). Not a substitute for analytics;
 * this data only surfaces if a crash or recordError() happens afterward.
 */
function log(message: string) {
    fbLog(crashlyticsInstance, message);
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[crashlytics] ${message}`);
    }
}

/**
 * Records a non-fatal error with a stack trace, without crashing the app.
 * Use this for caught exceptions you still want visibility into — failed
 * background sync, a rejected API call you handled gracefully, a native
 * bridge call that threw. Attach short, non-sensitive context via `context`.
 */
function recordError(error: unknown, context?: string) {
    if (context) {
        log(context);
    }
    const normalized =
        error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    fbRecordError(crashlyticsInstance, normalized);
}

/**
 * Dev-only manual crash trigger, to confirm the pipeline actually reaches
 * the Firebase console end-to-end. Never wire this to any button/menu that
 * ships in a release build.
 */
function testCrash() {
    if (!__DEV__) {
        return;
    }
    fbCrash(crashlyticsInstance);
}

export const logger = {
    log,
    recordError,
    testCrash
};

export function isCrashlyticsEnabled() {
    return enabled;
}