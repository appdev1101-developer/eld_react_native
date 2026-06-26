import moment from 'moment-timezone';
import {
    WsChatMessage,
    WsContact,
    WsGroup,
    WsReceiveType,
    WsTotalMsg
} from '../Model/Message';

const MESSAGE_WEBSOCKET_URL = 'wss://lms.learningink.com/socket'
type MessageHandler = (payload: Record<string, unknown>) => void;

const getWebSocketUrl = (): string => {
    return MESSAGE_WEBSOCKET_URL;
};

class MessageWebSocket {
    private ws: WebSocket | null = null;
    private handlers = new Map<WsReceiveType | 'open' | 'close' | 'error', Set<MessageHandler>>();
    private connectPromise: Promise<void> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private shouldReconnect = false;

    connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.shouldReconnect = true;

        this.connectPromise = new Promise((resolve, reject) => {
            const url = getWebSocketUrl();
            const socket = new WebSocket(url);
            this.ws = socket;

            socket.onopen = () => {
                this.connectPromise = null;
                this.emit('open', {});
                resolve();
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(String(event.data));
                    if (data?.sendType) {
                        this.emit(data.sendType as WsReceiveType, data);
                    }
                } catch (error) {
                    console.warn('MessageWebSocket parse error', error);
                }
            };

            socket.onerror = (error) => {
                this.connectPromise = null;
                this.emit('error', { error });
                reject(error);
            };

            socket.onclose = () => {
                this.connectPromise = null;
                this.ws = null;
                this.emit('close', {});

                if (this.shouldReconnect) {
                    this.reconnectTimer = setTimeout(() => {
                        this.connect().catch(() => {});
                    }, 3000);
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

    on(event: WsReceiveType | 'open' | 'close' | 'error', handler: MessageHandler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    off(event: WsReceiveType | 'open' | 'close' | 'error', handler: MessageHandler) {
        this.handlers.get(event)?.delete(handler);
    }

    private emit(event: WsReceiveType | 'open' | 'close' | 'error', payload: Record<string, unknown>) {
        console.log('emit', event, payload);
        this.handlers.get(event)?.forEach((handler) => handler(payload));
    }

    private send(payload: Record<string, unknown>) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(payload));
    }

    async ensureConnected() {
        if (this.ws?.readyState === WebSocket.OPEN) return;
        await this.connect();
    }

    authenticateChat(senderId: number, receiverId: number, isGroup: boolean) {
        this.send({
            sendType: 'auth',
            senderId,
            recieverId: receiverId,
            isGroup
        });
    }

    fetchUserInfo(senderId: number, masterId: number) {
        this.send({
            sendType: 'userInfo',
            senderId,
            masterId
        });
    }

    fetchTotalMessages(senderId: number, receiverId: number) {
        this.send({
            sendType: 'totalMsg',
            senderId,
            receiverId
        });
    }

    createGroup(params: {
        senderId: number;
        groupName: string;
        masterId: number;
        masterCompanyId: number;
        ids: number;
        userSelected: number[];
    }) {
        this.send({
            sendType: 'group_create',
            senderId: params.senderId,
            groupName: params.groupName,
            masterId: params.masterId,
            masterCompanyId: params.masterCompanyId,
            ids: params.ids,
            userSelected: params.userSelected
        });
    }

    sendPrivateMessage(params: {
        senderId: number;
        receiverId: number;
        content: string;
        imageUrl?: string;
        masterId: number;
        masterCompanyId: number;
    }) {
        this.send({
            sendType: 'message',
            type: 0,
            sender_id: params.senderId,
            reciever_id: params.receiverId,
            content: params.content,
            image_url: params.imageUrl ?? '',
            master_id: params.masterId,
            master_company_id: params.masterCompanyId,
            sent_time: moment().format('YYYY-MM-DD HH:mm:ss')
        });
    }

    sendGroupMessage(params: {
        senderId: number;
        groupId: number;
        content: string;
        imageUrl?: string;
        masterId: number;
        masterCompanyId: number;
    }) {
        this.send({
            sendType: 'message',
            type: 1,
            sender_id: params.senderId,
            reciever_id: params.groupId,
            content: params.content,
            image_url: params.imageUrl ?? '',
            master_id: params.masterId,
            master_company_id: params.masterCompanyId,
            sent_time: moment().format('YYYY-MM-DD HH:mm:ss')
        });
    }

    markAsRead(params: {
        senderId: number;
        receiverId: number;
        isGroup: boolean;
        userId?: number;
    }) {
        this.send({
            sendType: 'update_read_status',
            senderId: params.senderId,
            recieverId: params.receiverId,
            isGroup: params.isGroup,
            id: params.userId ?? params.senderId,
            sent_time: moment().format('YYYY-MM-DD HH:mm:ss')
        });
    }

    waitForMessages(
        sendType: WsReceiveType | WsReceiveType[],
        sendFn: () => void,
        timeoutMs = 8000
    ): Promise<Record<string, unknown>[]> {
        const types = Array.isArray(sendType) ? sendType : [sendType];

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
}

export const messageWebSocket = new MessageWebSocket();

export const formatMessageTime = (sentTime?: string): string => {
    if (!sentTime) return '';
    const parsed = moment(sentTime, 'YYYY-MM-DD HH:mm:ss', true);
    if (!parsed.isValid()) {
        return sentTime;
    }
    return parsed.format('h:mm A');
};

export const formatChatTimestamp = (sentTime?: string): string => {
    if (!sentTime) return '';
    const parsed = moment(sentTime, 'YYYY-MM-DD HH:mm:ss', true);
    if (!parsed.isValid()) return sentTime;

    const now = moment();
    if (parsed.isSame(now, 'day')) {
        return parsed.format('h:mm A');
    }
    if (parsed.isSame(now.clone().subtract(1, 'day'), 'day')) {
        return 'Yesterday';
    }
    return parsed.format('MMM D');
};

export const wsMessageToChatMessage = (
    msg: WsChatMessage,
    currentUserId: number
) => ({
    id: String(msg.id),
    text: msg.content,
    image: msg.image_url || undefined,
    senderId: String(msg.sender_id),
    senderName: msg.sender_name,
    time: formatMessageTime(msg.sent_time),
    isMine: msg.sender_id === currentUserId
});

export const wsContactToDisplay = (contact: WsContact) => ({
    id: String(contact.id),
    name: `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'Unknown',
    avatar: contact.image_url ?? '',
    category: 'General' as const
});

export const wsGroupToDisplay = (group: WsGroup) => ({
    id: String(group.id),
    name: group.group_name,
    avatar: '',
    isGroup: true
});

export const wsTotalMsgToChatPreview = (msg: WsTotalMsg, currentUserId: number) => {
    const isGroup = msg.type === 1;
    const peerId = isGroup ? msg.group_id ?? msg.receiver_id : msg.sender_id === currentUserId
        ? msg.receiver_id
        : msg.sender_id;

    return {
        id: isGroup ? `group-${peerId}` : `chat-${peerId}`,
        receiverId: peerId,
        name: isGroup
            ? `Group ${peerId}`
            : msg.sender_id === currentUserId
                ? msg.reciever_name ?? 'Chat'
                : msg.sender_name ?? 'Chat',
        avatar: msg.image_url ?? '',
        lastMessage: msg.content,
        timestamp: formatChatTimestamp(msg.sent_time),
        unread: msg.is_read === 0 || msg.is_read === '0' ? 1 : undefined,
        isGroup,
        sentTime: msg.sent_time
    };
};

export default messageWebSocket;
