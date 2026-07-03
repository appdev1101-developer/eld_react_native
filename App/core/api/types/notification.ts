export type NotificationItem = Record<string, unknown> & {
    id?: number;
    type?: number;
    title?: string;
    message?: string;
    data?: {
        message?: string;
    };
    created_at?: string;
    read_at?: string | null;
    is_read?: number | boolean;
};

export type NotificationLists = {
    all: NotificationItem[];
    unread: NotificationItem[];
    read: NotificationItem[];
};