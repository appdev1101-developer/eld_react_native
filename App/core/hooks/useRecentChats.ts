import { useCallback, useState } from 'react';
import { WsChatMessage, WsContact, WsTotalMsg } from '../../Model/Message';
import { formatChatTimestamp } from '../../Utils/MessageWebSocket';
import messageWebSocket, {
    wsTotalMsgToChatPreview
} from '../../Utils/MessageWebSocket';
import {
    ChatPreviewItem,
    ContactPreview,
    getMessagesCache,
    invalidateMessagesCache,
    setMessagesCache,
    upsertChatPreview
} from '../cache/messagesCache';

type UseRecentChatsOptions = {
    senderId: number;
    masterId: number;
};

function buildChatList(totalMessages: WsTotalMsg[], senderId: number) {
    const chatMap = new Map<string, ChatPreviewItem>();
    totalMessages.forEach((msg) => {
        const preview = wsTotalMsgToChatPreview(msg, senderId);
        const existing = chatMap.get(preview.id);
        if (
            !existing ||
            new Date(msg.sent_time).getTime() >
                new Date(existing.sentTime ?? 0).getTime()
        ) {
            chatMap.set(preview.id, preview);
        }
    });

    return Array.from(chatMap.values()).sort(
        (a, b) =>
            new Date(b.sentTime ?? 0).getTime() -
            new Date(a.sentTime ?? 0).getTime()
    );
}

export function useRecentChats({ senderId, masterId }: UseRecentChatsOptions) {
    const [loading, setLoading] = useState(true);
    const [recentChats, setRecentChats] = useState<ChatPreviewItem[]>([]);
    const [lastTalkedTo, setLastTalkedTo] = useState<ContactPreview[]>([]);

    const applyCache = useCallback(
        (cached: NonNullable<ReturnType<typeof getMessagesCache>>) => {
            setRecentChats(cached.recentChats);
            setLastTalkedTo(cached.lastTalkedTo);
            setLoading(false);
        },
        []
    );

    const loadChats = useCallback(
        async (options?: { force?: boolean }) => {
            if (!senderId) {
                setLoading(false);
                return null;
            }

            const force = options?.force ?? false;
            if (!force) {
                const cached = getMessagesCache();
                if (cached) {
                    applyCache(cached);
                    return cached;
                }
            }

            setLoading(true);

            try {
                await messageWebSocket.ensureConnected();

                const totalMessages = await messageWebSocket.waitForMessages(
                    'totalMsg',
                    () => messageWebSocket.fetchTotalMessages(senderId, senderId)
                );

                const chats = buildChatList(
                    totalMessages as WsTotalMsg[],
                    senderId
                );

                const contacts = await messageWebSocket.waitForMessages(
                    ['driver_list', 'user_list', 'master_list'],
                    () => messageWebSocket.fetchUserInfo(senderId, masterId),
                    5000
                );

                const contactList = (contacts as WsContact[])
                    .slice(0, 6)
                    .map((contact) => ({
                        id: String(contact.id),
                        receiverId: contact.id,
                        name:
                            `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() ||
                            'Unknown',
                        avatar: contact.image_url ?? '',
                        isGroup: false
                    }));

                setRecentChats(chats);
                setLastTalkedTo(contactList);
                const cached = { recentChats: chats, lastTalkedTo: contactList };
                setMessagesCache(cached);
                return cached;
            } catch (error) {
                if (__DEV__) {
                    console.warn('useRecentChats load failed', error);
                }
                return null;
            } finally {
                setLoading(false);
            }
        },
        [applyCache, masterId, senderId]
    );

    const handleNewMessage = useCallback(
        (payload: Record<string, unknown>) => {
            if (!senderId) {
                return;
            }

            if (payload.sendType === 'totalMsg') {
                const preview = wsTotalMsgToChatPreview(
                    payload as WsTotalMsg,
                    senderId
                );
                upsertChatPreview(preview);
            } else {
                const msg = payload as WsChatMessage;
                if (!msg.sent_time) {
                    return;
                }
                const isGroup = Boolean(msg.group_id);
                const peerId = isGroup
                    ? msg.group_id ?? msg.receiver_id ?? 0
                    : msg.sender_id === senderId
                      ? msg.receiver_id ?? msg.reciever_id ?? 0
                      : msg.sender_id;
                upsertChatPreview({
                    id: isGroup ? `group-${peerId}` : `chat-${peerId}`,
                    receiverId: peerId,
                    name: isGroup
                        ? `Group ${peerId}`
                        : msg.sender_id === senderId
                          ? msg.reciever_name ?? 'Chat'
                          : msg.sender_name ?? 'Chat',
                    avatar: msg.image_url ?? '',
                    lastMessage: msg.content,
                    timestamp: formatChatTimestamp(msg.sent_time),
                    unread: msg.sender_id === senderId ? undefined : 1,
                    isGroup,
                    sentTime: msg.sent_time
                });
            }

            const cached = getMessagesCache();
            if (cached) {
                setRecentChats(cached.recentChats);
            }
        },
        [senderId]
    );

    const refresh = useCallback(async () => {
        invalidateMessagesCache();
        return loadChats({ force: true });
    }, [loadChats]);

    const unreadCount = recentChats.reduce(
        (total, chat) => total + (chat.unread ?? 0),
        0
    );

    return {
        loading,
        recentChats,
        lastTalkedTo,
        unreadCount,
        loadChats,
        refresh,
        handleNewMessage,
        invalidate: invalidateMessagesCache
    };
}