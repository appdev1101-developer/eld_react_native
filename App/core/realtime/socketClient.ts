/**
 * Single, generic WebSocket engine used by every realtime feature in the
 * app (session events, duty-status changes, messaging). This replaces:
 *   - the Pusher SDK (`@pusher/pusher-websocket-react-native`) previously
 *     used for ForceLogoutEvent, and
 *   - the hand-rolled raw WebSocket that used to live directly inside
 *     App/Utils/MessageWebSocket.ts.
 *
 * Both realtime systems now build on this one class instead of maintaining
 * two separate connection/reconnect/parsing implementations.
 *
 * Note: the main-backend channel and the messaging channel currently point
 * at two different servers (see socketConfig.ts) — messaging talks to a
 * separate chat service on its own domain. This class doesn't merge those
 * into one physical connection (that would require the backend to serve
 * both from the same endpoint); what it does merge is the client-side
 * *implementation* — one reconnect strategy, one message-framing contract,
 * one place to fix bugs — used by both.
 */

import { logger } from "../logger";

export type SocketEventName<TMessageType extends string> =
    | TMessageType
    | 'open'
    | 'close'
    | 'error';

type Handler = (payload: Record<string, unknown>) => void;

export type SocketClientOptions = {
    /** Discriminator field in incoming JSON frames used to route to handlers, e.g. 'sendType' or 'type'. */
    typeField: string;
    /** Milliseconds to wait before a reconnect attempt after an unexpected close. */
    reconnectDelayMs?: number;
    /** Called once, right after the socket opens, before 'open' handlers fire — use for an auth handshake frame. */
    onOpenHandshake?: (send: (payload: Record<string, unknown>) => void) => void;
};

function getSocketErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message?: unknown }).message ?? '');
    }
    return String(error ?? 'Unknown WebSocket error');
}

/** Treat auth/server errors as permanent — retrying immediately won't help and just spams the server. */
function isPermanentFailure(message: string): boolean {
    return /400|401|403|404|500|502|503/i.test(message);
}

export class SocketClient<TMessageType extends string> {
    private ws: WebSocket | null = null;
    private handlers = new Map<SocketEventName<TMessageType>, Set<Handler>>();
    private connectPromise: Promise<void> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private shouldReconnect = false;

    constructor(
        private readonly getUrl: () => string,
        private readonly options: SocketClientOptions
    ) {}

    connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.shouldReconnect = true;

        this.connectPromise = new Promise((resolve, reject) => {
            const url = this.getUrl();
            let opened = false;
            const socket = new WebSocket(url);
            this.ws = socket;

            socket.onopen = () => {
                opened = true;
                this.connectPromise = null;
                this.options.onOpenHandshake?.((payload) => this.send(payload));
                this.emit('open', {});
                resolve();
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(String(event.data));
                    logger.log("<<<<<<< Socket.onmessage Data  >>>>>>>>>>> "+data)
                    const type = data?.[this.options.typeField];
                    if (type) {
                        this.emit(type as TMessageType, data);
                    }
                } catch (error) {
                    if (__DEV__) {
                        console.warn('SocketClient parse error', error);
                    }
                }
            };

            socket.onerror = (error) => {
                const message = getSocketErrorMessage(error);
                logger.log("<<<<<<< Socket.onerror Data  >>>>>>>>>>> "+message)
                if (isPermanentFailure(message)) {
                    this.shouldReconnect = false;
                }
                if (__DEV__) {
                    console.warn('SocketClient connection error', { url, message });
                }
                this.connectPromise = null;
                this.emit('error', { error, url, message });
                reject(new Error(message || `WebSocket failed to connect (${url})`));
            };

            socket.onclose = (event) => {
                this.connectPromise = null;
                this.ws = null;
                this.emit('close', { code: event.code, reason: event.reason });

                if (!opened && isPermanentFailure(event.reason ?? '')) {
                    this.shouldReconnect = false;
                }

                if (this.shouldReconnect) {
                    this.reconnectTimer = setTimeout(() => {
                        this.connect().catch(() => {});
                    }, this.options.reconnectDelayMs ?? 3000);
                }
            };
        });

        return this.connectPromise;
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connectPromise = null;
    }

    async ensureConnected() {
        if (this.ws?.readyState === WebSocket.OPEN) return;
        await this.connect();
    }

    on(event: SocketEventName<TMessageType>, handler: Handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    off(event: SocketEventName<TMessageType>, handler: Handler) {
        this.handlers.get(event)?.delete(handler);
    }

    send(payload: Record<string, unknown>) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(payload));
    }

    /** True if the underlying socket is currently open. */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /** Send a request frame and collect every matching response type until timeout — used for request/response-shaped protocols (e.g. fetch total messages). */
    waitForMessages(
        eventType: TMessageType | TMessageType[],
        sendFn: () => void,
        timeoutMs = 8000
    ): Promise<Record<string, unknown>[]> {
        const types = Array.isArray(eventType) ? eventType : [eventType];

        return new Promise((resolve) => {
            const collected: Record<string, unknown>[] = [];
            let settled = false;

            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                unsubscribers.forEach((unsub) => unsub());
                resolve(collected);
            };

            const unsubscribers = types.map((type) =>
                this.on(type, (payload) => {
                    collected.push(payload);
                })
            );

            const timer = setTimeout(finish, timeoutMs);

            this.ensureConnected()
                .then(sendFn)
                .catch(() => finish());
        });
    }

    private emit(event: SocketEventName<TMessageType>, payload: Record<string, unknown>) {
        this.handlers.get(event)?.forEach((handler) => handler(payload));
    }
}