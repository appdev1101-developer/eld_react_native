/**
 * Raw shape of the new `message/mobile/recent-chats` bootstrap endpoint —
 * one REST call replacing what used to require connecting the WebSocket
 * first and then round-tripping a `fetchTotalMessages` request/response
 * over it just to paint the initial screen. The WebSocket itself is
 * unchanged for everything after this: new messages, read-status, etc.
 * still arrive exactly as before.
 */

export interface MessagingUserRaw {
    id: number;
    first_name?: string;
    last_name?: string;
    image_url?: string | null;
    /** TODO(backend): confirm this field name/presence — used for the online/away dot. */
    is_online?: boolean;
    /** TODO(backend): confirm — 'online' | 'away' | 'offline', if presence has more than two states. */
    presence?: string;
}

export interface MessagingGroupRaw {
    id: number;
    group_name: string;
    image_url?: string | null;
}

export interface MessagingConversationRaw {
    /** The user id (personal chat) or group id (group chat) this conversation is with. */
    peer_id: number;
    /** 0 = personal, 1 = group — matches the existing WsTotalMsg.type convention. */
    type: number;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

export interface RecentChatsApiResponse {
    users: MessagingUserRaw[];
    groups: MessagingGroupRaw[];
    conversations: MessagingConversationRaw[];
}