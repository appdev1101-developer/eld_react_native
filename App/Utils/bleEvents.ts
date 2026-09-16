/**
 * Single source of truth for the event contract between
 * GeoDataForegroundService/GeoDataServiceModule (native) and JS.
 *
 * These two event names are currently duplicated as string literals in
 * three places: GeoDataForegroundService.kt (implicitly, via what
 * GeoDataServiceModule emits), GeoDataServiceModule.kt (the actual
 * .emit(...) calls), and every JS file that listens. That's exactly the
 * kind of drift that caused real bugs earlier in this codebase (a
 * WebSocket event-name mismatch from an unconfirmed backend contract).
 * Import these constants everywhere on the JS side instead of retyping
 * the string; the Kotlin side can't import a JS file, so its two emit
 * sites carry a comment pointing back here — if these ever need to
 * change, that comment is the reminder to update both sides together.
 */

export const ELD_EVENTS = {
    /** Live OBD/GeoData measurement — fires frequently while connected. */
    DATA: 'GeometrisData',
    /**
     * Fires only on a genuine connect/disconnect transition (see
     * notifyConnectionState() in GeoDataForegroundService.kt) — never on
     * every data packet.
     */
    CONNECTION_CHANGED: 'BluetoothConnectionChanged'
} as const;

export type EldConnectionChangedPayload = {
    connected: boolean;
};