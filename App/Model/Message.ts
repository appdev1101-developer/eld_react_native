export type WsSendType =
    | 'auth'
    | 'userInfo'
    | 'group_create'
    | 'message'
    | 'totalMsg'
    | 'update_read_status';

export type WsReceiveType =
    | 'previous_message'
    | 'new_message'
    | 'user_list'
    | 'driver_list'
    | 'master_list'
    | 'group_list'
    | 'user_group_list'
    | 'totalMsg'
    | 'message_read_status';

export type WsContact = {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    image_url?: string;
    sendType: WsReceiveType;
};

export type WsGroup = {
    id: number;
    group_name: string;
    created_by?: number;
    created_at?: string;
    sendType: WsReceiveType;
};

export type WsChatMessage = {
    id: number | string;
    type: number;
    sendType: WsReceiveType;
    sender_id: number;
    receiver_id?: number;
    reciever_id?: number;
    sender_name?: string;
    reciever_name?: string;
    content: string;
    image_url?: string;
    sent_time: string;
    is_read?: number | string;
    group_id?: number;
};

export type WsTotalMsg = {
    id: number;
    type: number;
    sendType: 'totalMsg';
    sender_id: number;
    receiver_id: number;
    sender_name?: string;
    reciever_name?: string;
    content: string;
    image_url?: string;
    sent_time: string;
    is_read?: number | string;
    group_id?: number;
};

export type ChatThreadParams = {
    receiverId: number;
    chatName?: string;
    isGroup?: boolean;
    avatar?: string;
};
