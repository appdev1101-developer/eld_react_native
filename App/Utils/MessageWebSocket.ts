import moment from 'moment-timezone';
import {
    WsChatMessage,
    WsContact,
    WsGroup,
    WsReceiveType,
    WsTotalMsg
} from '../Model/Message';
import { realtimeSocket } from '../core/realtime/realtimeSocket';

/**
 * Chat/messaging realtime API — thin wrapper around the single shared
 * connection (core/realtime/realtimeSocket.ts). This used to open its own
 * WebSocket; now it shares the exact same connection that force-logout and
 * duty-status events ride on, since it's genuinely one server.
 *
 * Public API is intentionally unchanged from the previous version so
 * nothing in the Message screens needed to change.
 */
class MessageWebSocket {
    private client = realtimeSocket;

    connect(): Promise<void> {
        return this.client.connect();
    }

    disconnect() {
        this.client.disconnect();
    }

    on(event: WsReceiveType | 'open' | 'close' | 'error', handler: (payload: Record<string, unknown>) => void) {
        return this.client.on(event, handler);
    }

    off(event: WsReceiveType | 'open' | 'close' | 'error', handler: (payload: Record<string, unknown>) => void) {
        this.client.off(event, handler);
    }

    async ensureConnected() {
        await this.client.ensureConnected();
    }

    authenticateChat(senderId: number, receiverId: number, isGroup: boolean) {
        this.client.send({
            sendType: 'auth',
            senderId,
            recieverId: receiverId,
            isGroup
        });
    }

    fetchUserInfo(senderId: number, masterId: number) {
        this.client.send({
            sendType: 'userInfo',
            senderId,
            masterId
        });
    }

    fetchTotalMessages(senderId: number, receiverId: number) {
        this.client.send({
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
        this.client.send({
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
        this.client.send({
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
        this.client.send({
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
        this.client.send({
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
        return this.client.waitForMessages(sendType, sendFn, timeoutMs);
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