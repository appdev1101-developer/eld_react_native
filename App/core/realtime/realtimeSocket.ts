import SessionManager from '../session/SessionManager';
import { SocketClient } from './socketClient';
import {
    AUTH_FAILED_EVENT,
    AUTH_SEND_TYPE,
    AUTH_SUCCESS_EVENT,
    getRealtimeSocketUrl,
    SessionMessageType
} from './socketConfig';
import { WsReceiveType } from '../../Model/Message';
import { logger } from '../logger';

/**
 * The one WebSocket connection for the whole app — chat messaging, force
 * logout, and duty-status changes all ride on this single socket. It's
 * created once, globally, at module scope — connected/disconnected by
 * useRealtime.ts (mounted at the app root in App.js) based on login state,
 * not tied to any particular screen being mounted.
 *
 * Handshake, repeated automatically on every (re)connect:
 *   1. Socket opens.
 *   2. Client sends { sendType: 'auth', token }.
 *   3. Server responds { sendType: 'auth_success' } or 'auth_failed'.
 *   4. Once authenticated, force-logout and duty-status frames arrive
 *      unprompted — there's no separate subscribe step on the client side.
 */
export const realtimeSocket = new SocketClient<WsReceiveType | SessionMessageType>(
    getRealtimeSocketUrl,
    {
        typeField: 'sendType',
        reconnectDelayMs: 3000,
        onOpenHandshake: (send) => {
            void SessionManager.getToken().then((token) => {
                if (token) {
                    logger.log("Initial request to establish connection with websocket"+token)
                    send({ sendType: AUTH_SEND_TYPE, token: token });
                }
            });
        }
    }
);

// Logged at module scope (not inside a component) so this fires on every
// reconnect for the life of the app, not just while some screen is mounted.
realtimeSocket.on(AUTH_SUCCESS_EVENT, () => {
    logger.log('Realtime socket authenticated (auth_success)');
});

realtimeSocket.on(AUTH_FAILED_EVENT, (payload) => {
    logger.recordError(
        'Realtime socket auth_failed',
        `payload=${JSON.stringify(payload).slice(0, 200)}`
    );
    // Don't let the generic reconnect loop keep retrying with a token the
    // server just rejected — stop here. The connection re-establishes on
    // its own next time useRealtime sees a fresh login (and thus a fresh
    // token via SessionManager.getToken() in the handshake above).
    realtimeSocket.disconnect();
});