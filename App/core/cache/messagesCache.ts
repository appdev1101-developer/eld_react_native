export type ChatPreviewItem = {
    id: string;
    receiverId: number;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread?: number;
    isGroup: boolean;
    sentTime?: string;
};

export type ContactPreview = {
    id: string;
    receiverId: number;
    name: string;
    avatar: string;
    isGroup: boolean;
};

export type MessagesCachedData = {
    recentChats: ChatPreviewItem[];
    lastTalkedTo: ContactPreview[];
    fetchedAt: number;
};

const CACHE_TTL_MS = 45_000;
let cache: MessagesCachedData | null = null;

export function getMessagesCache(): MessagesCachedData | null {
    if (!cache) {
        return null;
    }
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
        return null;
    }
    return cache;
}

export function setMessagesCache(
    data: Omit<MessagesCachedData, 'fetchedAt'>
): void {
    cache = {
        ...data,
        fetchedAt: Date.now()
    };
}

export function invalidateMessagesCache(): void {
    cache = null;
}

export function getUnreadMessageCount(): number {
    const data = getMessagesCache();
    if (!data) {
        return 0;
    }
    return data.recentChats.reduce(
        (total, chat) => total + (chat.unread ?? 0),
        0
    );
}

export function upsertChatPreview(preview: ChatPreviewItem): void {
    if (!cache) {
        cache = {
            recentChats: [preview],
            lastTalkedTo: [],
            fetchedAt: Date.now()
        };
        return;
    }

    const existingIndex = cache.recentChats.findIndex(
        (chat) => chat.id === preview.id
    );
    const nextChats = [...cache.recentChats];
    if (existingIndex >= 0) {
        nextChats[existingIndex] = preview;
    } else {
        nextChats.unshift(preview);
    }

    cache = {
        ...cache,
        recentChats: nextChats.sort(
            (a, b) =>
                new Date(b.sentTime ?? 0).getTime() -
                new Date(a.sentTime ?? 0).getTime()
        ),
        fetchedAt: Date.now()
    };
}