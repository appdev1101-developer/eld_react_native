import { useCallback, useState } from 'react';
import { notificationApi } from '../api/services/notificationApi';
import { NotificationItem } from '../api/types/notification';
import { isSuccess } from '../api/types/common';
import {
    getNotificationsCache,
    getUnreadNotificationCount,
    invalidateNotificationsCache,
    markNotificationsReadInCache,
    setNotificationsCache
} from '../cache/notificationsCache';

export async function prefetchNotifications(options?: {
    force?: boolean;
}): Promise<number> {
    if (!options?.force) {
        const cached = getNotificationsCache();
        if (cached) {
            return cached.unread.length;
        }
    }

    try {
        const result = await notificationApi.getAll();
        if (isSuccess(result)) {
            setNotificationsCache(result.data);
            return result.data.unread.length;
        }
    } catch (error) {
        if (__DEV__) {
            console.warn('prefetchNotifications failed', error);
        }
    }

    return getUnreadNotificationCount();
}

export function useNotifications() {
    const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([]);
    const [readNotifications, setReadNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const applyCache = useCallback(
        (cached: NonNullable<ReturnType<typeof getNotificationsCache>>) => {
            setAllNotifications(cached.all);
            setUnreadNotifications(cached.unread);
            setReadNotifications(cached.read);
            setLoading(false);
        },
        []
    );

    const applyLists = useCallback(
        (lists: { all: NotificationItem[]; unread: NotificationItem[]; read: NotificationItem[] }) => {
            setAllNotifications(lists.all);
            setUnreadNotifications(lists.unread);
            setReadNotifications(lists.read);
            setNotificationsCache(lists);
        },
        []
    );

    const loadNotifications = useCallback(
        async (options?: { showLoading?: boolean; force?: boolean }) => {
            const showLoading = options?.showLoading ?? false;
            const force = options?.force ?? false;

            if (!force) {
                const cached = getNotificationsCache();
                if (cached) {
                    applyCache(cached);
                    return cached;
                }
            }

            if (showLoading) {
                setLoading(true);
            }

            try {
                const result = await notificationApi.getAll();
                if (isSuccess(result)) {
                    applyLists(result.data);
                    return result.data;
                }
                return null;
            } catch (error) {
                if (__DEV__) {
                    console.warn('useNotifications load failed', error);
                }
                return null;
            } finally {
                if (showLoading) {
                    setLoading(false);
                }
            }
        },
        [applyCache, applyLists]
    );

    const refresh = useCallback(async () => {
        setRefreshing(true);
        invalidateNotificationsCache();
        await loadNotifications({ force: true });
        setRefreshing(false);
    }, [loadNotifications]);

    const markAllRead = useCallback(async () => {
        const result = await notificationApi.markAllRead();
        if (!isSuccess(result)) {
            return false;
        }
        markNotificationsReadInCache();
        const cached = getNotificationsCache();
        if (cached) {
            applyCache(cached);
        } else {
            await loadNotifications({ force: true });
        }
        return true;
    }, [applyCache, loadNotifications]);

    const unreadCount = unreadNotifications.length;

    return {
        allNotifications,
        unreadNotifications,
        readNotifications,
        unreadCount,
        loading,
        refreshing,
        loadNotifications,
        refresh,
        markAllRead,
        invalidate: invalidateNotificationsCache
    };
}