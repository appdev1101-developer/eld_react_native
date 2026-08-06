import { useCallback, useEffect, useRef } from 'react';
import { realtimeSocket } from '../realtime/realtimeSocket';
import { DUTY_STATUS_CHANGED_EVENT, FORCE_LOGOUT_EVENT } from '../realtime/socketConfig';

export type DutyStatusChangedPayload = {
    latestLogId?: number;
    latestLog?: string;
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
): DutyStatusChangedPayload | null {
    try {
        const data = (payload.data ?? {}) as {
            latest_log_id?: number;
            latestLogId?: number;
            latest_log?: string;
            latestLog?: string;
            shift_id?: string | number;
            changed_at?: string;
        };

        const latestLogId = data.latestLogId ?? data.latest_log_id;
        const latestLog = data.latestLog ?? data.latest_log;
        if (latestLogId == null && !latestLog) {
            return null;
        }

        return {
            latestLogId,
            latestLog,
            shiftId: data.shift_id,
            changedAt: data.changed_at
        };
    } catch {
        return null;
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
            if (parseForceLogoutEvent(payload)) {
                void onForceLogoutRef.current();
            }
        });

        const unsubscribeDutyStatus = realtimeSocket.on(DUTY_STATUS_CHANGED_EVENT, (payload) => {
            const parsed = parseDutyStatusChangedEvent(payload);
            if (parsed) {
                onDutyStatusChangedRef.current?.(parsed);
            }
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