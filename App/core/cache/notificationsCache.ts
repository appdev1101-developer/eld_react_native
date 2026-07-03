import { NotificationItem, NotificationLists } from '../api/types/notification';

export type NotificationsCachedData = NotificationLists & {
    fetchedAt: number;
};

const CACHE_TTL_MS = 45_000;
let cache: NotificationsCachedData | null = null;

export function getNotificationsCache(): NotificationsCachedData | null {
    if (!cache) {
        return null;
    }
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
        return null;
    }
    return cache;
}

export function setNotificationsCache(
    data: Omit<NotificationsCachedData, 'fetchedAt'>
): void {
    cache = {
        ...data,
        fetchedAt: Date.now()
    };
}

export function invalidateNotificationsCache(): void {
    cache = null;
}

export function getUnreadNotificationCount(): number {
    const data = getNotificationsCache();
    return data?.unread.length ?? 0;
}

export function markNotificationsReadInCache(): void {
    if (!cache) {
        return;
    }
    cache = {
        all: cache.all.map((item) => ({ ...item, is_read: 1 })),
        unread: [],
        read: [...cache.all],
        fetchedAt: Date.now()
    };
}