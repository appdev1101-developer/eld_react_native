import { API } from '../endpoints';
import { apiGet, apiPost } from '../client';
import { NotificationLists } from '../types/notification';
import { mapEmptyData } from '../mappers/dashboardMapper';

function mapNotificationLists(raw: Record<string, unknown>): NotificationLists {
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return {
        all: (data.all_notifications as NotificationLists['all']) ?? [],
        unread: (data.unread_notifications as NotificationLists['unread']) ?? [],
        read: (data.read_notifications as NotificationLists['read']) ?? []
    };
}

export const notificationApi = {
    getAll: () =>
        apiGet<NotificationLists>(API.dashboard.notifications(), mapNotificationLists),

    markAllRead: () =>
        apiPost<Record<string, never>>(
            API.dashboard.notifications(),
            mapEmptyData,
            {}
        )
};