import { useCallback, useEffect, useRef } from 'react';
import { realtimeSocket } from '../realtime/realtimeSocket';
import { AUTH_EXPIRED_EVENT,AUTH_MISMATCH_EVENT, DUTY_STATUS_CHANGED_EVENT, FORCE_LOGOUT_EVENT } from '../realtime/socketConfig';
import { logger } from '../logger';

export type DutyStatusChangedPayload = {
    shift_id: number;
    timeLeftInDrive: string;
    timeLeftInShift: string;
    timeLeftInCycle: string;
    timeLeftInBreak: string;
    timeInCurrentStatus: string;
};

type UseRealtimeOptions = {
    loginStatus: boolean;
    userId?: number | string | null;
    onForceLogout: () => void | Promise<void>;
    onDutyStatusChanged?: (payload: DutyStatusChangedPayload) => void;
};

function parseForceLogoutEvent(payload: Record<string, unknown>): boolean {
    try {
        const data = payload.data as { type?: string } | undefined;
        return data?.type === 'LOGOUT';
    } catch {
        return false;
    }
}

function parseDutyStatusChangedEvent(
    payload: Record<string, unknown>
): DutyStatusChangedPayload {
    logger.log(">>>>> parseDutyStatusChnaged called >> ")
    try {
        const data = payload as {
        shiftStatus: number;
        shift_time: string;
        cycle_time: string;
        break_time: string;
        drive_time: string;
        duration: string;
    };
 
    // No fields beyond sendType are guaranteed present — if the server
    // sends this as a bare signal (no status data attached), the caller
    // still gets called so it can fall back to a plain refetch.
    return {
        shift_id: data.shiftStatus ?? -1,
        timeLeftInDrive: data.drive_time,
        timeLeftInShift: data.shift_time,
        timeLeftInCycle: data.cycle_time,
        timeLeftInBreak: data.break_time,
        timeInCurrentStatus: data.duration,
     };
    } catch {
        return {
            shift_id: -1,
            timeLeftInDrive: "",
            timeLeftInShift: "",
            timeLeftInCycle: "",
            timeLeftInBreak: "",
            timeInCurrentStatus: "",
        };
    }
}

/**
 * Registers session-event handlers (force logout, duty-status change) on
 * the single shared realtime connection (see core/realtime/realtimeSocket.ts)
 * — the same connection App/Utils/MessageWebSocket.ts uses for chat. This
 * hook does NOT own the connection lifecycle by itself; connect/disconnect
 * calls from here and from App.js's messageWebSocket.connect()/disconnect()
 * both target the same underlying socket and are safe to coexist (connect()
 * is idempotent — see socketClient.ts — and either side tearing down on
 * logout is correct, since the whole connection should close together).
 */
export function useRealtime({
    loginStatus,
    userId,
    onForceLogout,
    onDutyStatusChanged
}: UseRealtimeOptions) {
    const onForceLogoutRef = useRef(onForceLogout);
    const onDutyStatusChangedRef = useRef(onDutyStatusChanged);

    useEffect(() => {
        onForceLogoutRef.current = onForceLogout;
    }, [onForceLogout]);

    useEffect(() => {
        onDutyStatusChangedRef.current = onDutyStatusChanged;
    }, [onDutyStatusChanged]);

    const disconnect = useCallback(async () => {
        realtimeSocket.disconnect();
    }, []);

    useEffect(() => {
        const unsubscribeForceLogout = realtimeSocket.on(FORCE_LOGOUT_EVENT, (payload) => {
            // The connection is already scoped to this user via the auth
            // token in the handshake, so arrival here is itself the
            // signal — driverId is logged for the audit trail, not used
            // as a filter (don't second-guess a server-issued logout).
            //logger.log(`Force logout received (driverId=${payload.driverId ?? 'n/a'})`);
            logger.log(`Force logout received`);
            void onForceLogoutRef.current();
        });

        // auth_expired means this connection's token is no longer valid
        // mid-session — treated as equivalent to an explicit force logout,
        // since there's no token-refresh flow to fall back to here.
        const unsubscribeAuthExpired = realtimeSocket.on(AUTH_EXPIRED_EVENT, () => {
            logger.log('Auth expired — treating as force logout');
            void onForceLogoutRef.current();
        });

        // auth_mismatch means this connection's token is no longer valid
        // mid-session — treated as equivalent to an explicit force logout,
        // since there's no token-refresh flow to fall back to here.
        const unsubscribeAuthTokenMismatch = realtimeSocket.on(AUTH_MISMATCH_EVENT, () => {
            logger.log('Auth mismatch — treating as force logout');
            void onForceLogoutRef.current();
        });

        const unsubscribeDutyStatus = realtimeSocket.on(DUTY_STATUS_CHANGED_EVENT, (payload) => {
            onDutyStatusChangedRef.current?.(parseDutyStatusChangedEvent(payload));
        });
 
        return () => {
            unsubscribeForceLogout();
            unsubscribeAuthExpired();
            unsubscribeAuthTokenMismatch();
            unsubscribeDutyStatus();
        };
    }, []);

    useEffect(() => {
        if (loginStatus && userId != null && userId !== '') {
            realtimeSocket.connect().catch(() => {});
        } else {
            void disconnect();
        }
    }, [disconnect, loginStatus, userId]);

    useEffect(() => {
        return () => {
            void disconnect();
        };
    }, [disconnect]);

    return { disconnect };
}