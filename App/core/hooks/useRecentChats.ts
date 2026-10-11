import { useCallback, useState } from 'react';
import { WsChatMessage, WsContact, WsTotalMsg } from '../../Model/Message';
import { formatChatTimestamp } from '../../Utils/MessageWebSocket';
import messageWebSocket, {
    wsTotalMsgToChatPreview
} from '../../Utils/MessageWebSocket';
import {
    ChatPreviewItem,
    getMessagesCache,
    getUnreadMessageCount,
    invalidateMessagesCache,
    setMessagesCache,
    upsertChatPreview
} from '../cache/messagesCache';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { setMsgDriverList, setMsgGroupList, setRecentChatList } from '../../Redux/reducer/Messages';

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

    const dispatch = useDispatch();
    const messages = useSelector((state: RootState) => state.Messages);

    const [loading, setLoading] = useState(true);
    const [recentChats, setRecentChats] = useState<ChatPreviewItem[]>([]);

    const applyCache = useCallback(
        (cached: NonNullable<ReturnType<typeof getMessagesCache>>) => {
            setRecentChats(cached.recentChats);
            setLoading(false);
        },
        []
    );

    // const loadChats = useCallback(
    //     async (options?: { force?: boolean }) => {
    //         if (!senderId) {
    //             setLoading(false);
    //             return null;
    //         }

    //         const force = options?.force ?? false;
    //         const messageCached = getMessagesCache();
    //         console.log(`<<<< loadChats >>>>>> ${messageCached?.contactsLoaded} ${force}`);
    //         if (!force) {
    //             if (messageCached) {
    //                 applyCache(messageCached);
    //                 return messageCached;
    //             }
    //         }
            
    //         const shouldFetchContacts =
    //                 force || !messageCached?.contactsLoaded;
    //         setLoading(true);

    //         try {
    //             await messageWebSocket.ensureConnected();
    //             const totalMessages = await messageWebSocket.waitForMessages(
    //                 'totalMsg',
    //                 () => messageWebSocket.fetchTotalMessages()
    //             );

    //             const chats = buildChatList(
    //                 totalMessages as WsTotalMsg[],
    //                 senderId
    //             );

    //             dispatch(setRecentChatList(chats));
    //             setRecentChats(chats);

    //             let driverList = messageCached?.driverList ?? [];
    //             let groupList = messageCached?.groupList ?? [];
                
    //             if(shouldFetchContacts)
    //             {
    //                 const contacts = await messageWebSocket.waitForMessages(
    //                 ['driver_list', 'group_list', 'master_list'],
    //                 () => messageWebSocket.fetchUserInfo(senderId, masterId),
    //                 5000
    //                 );
    //                 const wsContacts = contacts as WsContact[];
    //                 // Combine driver_list + master_list
    //                 driverList = wsContacts
    //                     .filter(
    //                         (contact) =>
    //                             contact.sendType === 'driver_list' ||
    //                             contact.sendType === 'master_list'
    //                     );
    //                 //console.log(" >>>> Driver List "+JSON.stringify(driverList));
    //                 // Keep group_list separate
    //                 groupList = wsContacts
    //                     .filter((contact) => contact.sendType === 'group_list');
    //                 dispatch(setMsgDriverList(driverList));
    //                 dispatch(setMsgGroupList(groupList));
    //             }
                
    //             const cached = { recentChats: chats, driverList: driverList, groupList: groupList,contactsLoaded: true};
    //             setMessagesCache(cached);
    //             return cached;
    //         } catch (error) {
    //             if (__DEV__) {
    //                 console.warn('useRecentChats load failed', error);
    //             }
    //             return null;
    //         } finally {
    //             setLoading(false);
    //         }
    //     },
    //     [masterId, senderId]
    // );

    const loadChats = useCallback(
    async (options?: { force?: boolean }) => {
        if (!senderId) {
            setLoading(false);
            return null;
        }

        const force = options?.force ?? false;
        const cached = getMessagesCache();

        console.log(
            `<<<< loadChats >>>> force=${force}, contactsLoaded=${cached?.contactsLoaded}`
        );

        // --------------------------------------------------
        // INITIAL LOAD:
        // Use cache immediately if available.
        // Do NOT hit WebSocket again.
        // --------------------------------------------------
        if (!force && cached) {
            applyCache(cached);
            return cached;
        }

        setLoading(true);

        try {
            await messageWebSocket.ensureConnected();

            // --------------------------------------------------
            // Fetch recent chats
            // --------------------------------------------------
            const totalMessages =
                await messageWebSocket.waitForMessages(
                    'totalMsg',
                    () => messageWebSocket.fetchTotalMessages()
                );

            const chats = buildChatList(
                totalMessages as WsTotalMsg[],
                senderId
            );

            dispatch(setRecentChatList(chats));
            setRecentChats(chats);

            // --------------------------------------------------
            // Fetch contacts
            // Initial load without cache OR forced refresh
            // --------------------------------------------------
            let driverList = cached?.driverList ?? [];
            let groupList = cached?.groupList ?? [];

            const shouldFetchContacts =
                force || !cached?.contactsLoaded;

            if (shouldFetchContacts) {
                const contacts =
                    await messageWebSocket.waitForMessages(
                        ['driver_list', 'group_list', 'master_list'],
                        () =>
                            messageWebSocket.fetchUserInfo(
                                senderId,
                                masterId
                            ),
                        5000
                    );

                const wsContacts = contacts as WsContact[];

                // driver_list + master_list
                driverList = wsContacts.filter(
                    contact =>
                        contact.sendType === 'driver_list' ||
                        contact.sendType === 'master_list'
                );

                // group_list
                groupList = wsContacts.filter(
                    contact =>
                        contact.sendType === 'group_list'
                );

                dispatch(setMsgDriverList(driverList));
                dispatch(setMsgGroupList(groupList));
            }

            // --------------------------------------------------
            // Save everything in cache
            // --------------------------------------------------
            const newCache = {
                recentChats: chats,
                driverList,
                groupList,
                contactsLoaded: true,
            };

            setMessagesCache(newCache);

            return newCache;
        } catch (error) {
            if (__DEV__) {
                console.warn(
                    'useRecentChats load failed',
                    error
                );
            }

            return null;
        } finally {
            setLoading(false);
        }
    },
    [
        senderId,
        masterId,
        applyCache,
        dispatch,
    ]
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
                    id: `${peerId}`,
                    receiverId: peerId,
                    name: isGroup
                        ? (msg?.group_name ?? `Unknown Group`)
                        : msg.sender_id === senderId
                          ? msg.reciever_name ?? 'Chat'
                          : msg.sender_name ?? 'Chat',
                    avatar: '',
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
                dispatch(setRecentChatList(cached.recentChats));
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
        driverList: messages.driverList,
        groupList: messages.groupList,
        unreadCount,
        loadChats,
        refresh,
        handleNewMessage,
        invalidate: invalidateMessagesCache
    };
}