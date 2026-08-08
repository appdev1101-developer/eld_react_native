import { MESSAGE_WEBSOCKET_URL } from '../../Utils/EnvVariables';

/**
 * One WebSocket server handles everything — chat messaging, session
 * events (force logout), and duty-status changes all share this same
 * connection. There is only one URL because there is only one socket.
 */
const FALLBACK_WEBSOCKET_URL = 'wss://lms.learningink.com/socket';

export function getRealtimeSocketUrl(): string {
    return MESSAGE_WEBSOCKET_URL || FALLBACK_WEBSOCKET_URL;
}

/**
 * sendType values for the non-chat events carried on this connection.
 * These extend the existing chat `sendType` scheme (see App/Model/Message.ts
 * for the chat-specific values) rather than introducing a second framing
 * convention — it's one server, so it gets one discriminator field.
 *
 * TODO(backend): confirm these exact string values and the identify-frame
 * shape below against whatever the server actually emits/expects — these
 * are my best-guess contract, not a confirmed spec.
 */
export const AUTH_SEND_TYPE = 'auth';
export const AUTH_SUCCESS_EVENT = 'auth_success';
export const AUTH_FAILED_EVENT = 'auth_failed';
 
/** -> nothing to send; these arrive unprompted once the connection is authenticated. */
export const FORCE_LOGOUT_EVENT = 'force_logout';
export const DUTY_STATUS_CHANGED_EVENT = 'duty_status_changed';

export type SessionMessageType =
    | typeof AUTH_SUCCESS_EVENT
    | typeof AUTH_FAILED_EVENT
    | typeof FORCE_LOGOUT_EVENT
    | typeof DUTY_STATUS_CHANGED_EVENT;