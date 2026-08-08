import { useCallback, useEffect, useRef } from 'react';
import { realtimeSocket } from '../realtime/realtimeSocket';
import { DUTY_STATUS_CHANGED_EVENT, FORCE_LOGOUT_EVENT } from '../realtime/socketConfig';
import { logger } from '../logger';

export type DutyStatusChangedPayload = {
    // latestLogId?: number;
    // latestLog?: string;
    shiftId?: string | number;
    changedAt?: string;
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
    try {
        const data = payload as {
        shift_id?: string | number;
        changed_at?: string;
    };
 
    // No fields beyond sendType are guaranteed present — if the server
    // sends this as a bare signal (no status data attached), the caller
    // still gets called so it can fall back to a plain refetch.
    return {
        shiftId: data.shift_id,
        changedAt: data.changed_at
     };
    } catch {
        return {};
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
            logger.log(`Force logout received (driverId=${payload.driverId ?? 'n/a'})`);
            void onForceLogoutRef.current();
        });

        const unsubscribeDutyStatus = realtimeSocket.on(DUTY_STATUS_CHANGED_EVENT, (payload) => {
            onDutyStatusChangedRef.current?.(parseDutyStatusChangedEvent(payload));
        });
 
        return () => {
            unsubscribeForceLogout();
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