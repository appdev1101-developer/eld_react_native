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
import { logger } from '../logger';

type NotificationLists = {
    all: NotificationItem[];
    unread: NotificationItem[];
    read: NotificationItem[];
};

let inFlightRequest: Promise<NotificationLists | null> | null = null;

async function fetchNotifications(): Promise<NotificationLists | null> {
    if (!inFlightRequest) {
        inFlightRequest = (async () => {
            try {
                const result = await notificationApi.getAll();
                if (isSuccess(result)) {
                    setNotificationsCache(result.data);
                    return result.data;
                }
                return null;
            } catch (error) {
                if (__DEV__) {
                    console.warn('notifications fetch failed', error);
                }
                return null;
            }
        })().finally(() => {
            inFlightRequest = null;
        });
    }
 
    return inFlightRequest;
}

export async function prefetchNotifications(options?: {
    force?: boolean;
}): Promise<number> {
    if (!options?.force) {
        const cached = getNotificationsCache();
        if (cached) {
            return cached.unread.length;
        }
    }

    const result = await fetchNotifications();
    return result ? result.unread.length : getUnreadNotificationCount();
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
        (lists: NotificationLists) => {
            setAllNotifications(lists.all);
            setUnreadNotifications(lists.unread);
            setReadNotifications(lists.read);
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
                const result = await fetchNotifications();
                if (result) {
                    applyLists(result);
                }
                return result;
            } catch (error) {
                if (__DEV__) {
                    logger.log('useNotifications load failed'+ error);
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