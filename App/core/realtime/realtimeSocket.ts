import SessionManager from '../session/SessionManager';
import { SocketClient } from './socketClient';
import { getRealtimeSocketUrl, IDENTIFY_SEND_TYPE, SessionMessageType } from './socketConfig';
import { WsReceiveType } from '../../Model/Message';

/**
 * The one WebSocket connection for the whole app — chat messaging, force
 * logout, and duty-status changes all ride on this single socket. Both
 * App/Utils/MessageWebSocket.ts and App/core/hooks/useRealtime.ts import
 * this same instance rather than each opening their own connection.
 *
 * Auth: right after the socket opens, we send an `identify` frame with the
 * bearer token so the server can scope account-wide events (force logout,
 * duty status) to this connection. This is separate from — and sent in
 * addition to — the per-conversation `authenticateChat()` call the chat
 * screens already make, since that scopes a conversation thread, not the
 * connection's account identity.
 */
export const realtimeSocket = new SocketClient<WsReceiveType | SessionMessageType>(
    getRealtimeSocketUrl,
    {
        typeField: 'sendType',
        reconnectDelayMs: 3000,
        onOpenHandshake: (send) => {
            void SessionManager.getToken().then((token) => {
                if (token) {
                    send({ sendType: IDENTIFY_SEND_TYPE, token });
                }
            });
        }
    }
);