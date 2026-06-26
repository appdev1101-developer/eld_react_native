import { ImageSourcePropType } from 'react-native';
import { DEFAULT_USER_AVATAR_URI } from './ProfileImage';

export type Contact = {
    id: string;
    name: string;
    avatar: string;
    category: 'General' | 'Work' | 'Groups' | 'Organizations';
};

export type ChatPreview = {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread?: number;
    isGroup: boolean;
    memberCount?: number;
};

export type ChatMessage = {
    id: string;
    text?: string;
    image?: string;
    senderId: string;
    senderName?: string;
    time: string;
    isMine: boolean;
    dateLabel?: string;
};

export type GroupMember = {
    id: string;
    name: string;
    avatar: string;
    isFollowing: boolean;
};

export type GroupEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
};

const avatar = (seed: number) =>
    `https://i.pravatar.cc/150?img=${seed}`;

export const LAST_TALKED_TO: Contact[] = [
    { id: '1', name: 'Arthur', avatar: avatar(1), category: 'Work' },
    { id: '2', name: 'Sarah', avatar: avatar(2), category: 'General' },
    { id: '3', name: 'Mike', avatar: avatar(3), category: 'Work' },
    { id: '4', name: 'Emma', avatar: avatar(4), category: 'Groups' },
    { id: '5', name: 'James', avatar: avatar(5), category: 'Organizations' },
    { id: '6', name: 'Lisa', avatar: avatar(6), category: 'General' }
];

export const RECENT_CHATS: ChatPreview[] = [
    {
        id: 'group-1',
        name: 'Fullstack Designers',
        avatar: avatar(10),
        lastMessage: 'See you at the event tomorrow!',
        timestamp: '2m',
        unread: 2,
        isGroup: true,
        memberCount: 12
    },
    {
        id: 'chat-1',
        name: 'Arthur Miller',
        avatar: avatar(1),
        lastMessage: 'Thanks for the update on the route.',
        timestamp: '15m',
        isGroup: false
    },
    {
        id: 'chat-2',
        name: 'Dispatch Team',
        avatar: avatar(11),
        lastMessage: 'New load assigned to Unit 42.',
        timestamp: '1h',
        unread: 1,
        isGroup: true,
        memberCount: 8
    },
    {
        id: 'chat-3',
        name: 'Sarah Johnson',
        avatar: avatar(2),
        lastMessage: 'Can you confirm the delivery time?',
        timestamp: '3h',
        isGroup: false
    },
    {
        id: 'chat-4',
        name: 'Fleet Safety',
        avatar: avatar(12),
        lastMessage: 'Weekly safety briefing posted.',
        timestamp: 'Yesterday',
        isGroup: true,
        memberCount: 24
    },
    {
        id: 'chat-5',
        name: 'Mike Chen',
        avatar: avatar(3),
        lastMessage: 'Got it, heading to the yard now.',
        timestamp: 'Yesterday',
        isGroup: false
    }
];

export const ALL_CONTACTS: Contact[] = [
    ...LAST_TALKED_TO,
    { id: '7', name: 'David Park', avatar: avatar(7), category: 'Work' },
    { id: '8', name: 'Nina Ross', avatar: avatar(8), category: 'Groups' },
    { id: '9', name: 'Tom Bradley', avatar: avatar(9), category: 'Organizations' },
    { id: '10', name: 'Olivia Grant', avatar: avatar(13), category: 'General' },
    { id: '11', name: 'Chris Lee', avatar: avatar(14), category: 'Work' },
    { id: '12', name: 'Rachel Kim', avatar: avatar(15), category: 'Groups' }
];

export const GROUP_MESSAGES: Record<string, ChatMessage[]> = {
    'group-1': [
        {
            id: 'm1',
            senderId: '2',
            senderName: 'Sarah',
            text: 'Hey everyone! The design review is scheduled for Friday.',
            image: 'https://picsum.photos/seed/chat1/300/200',
            time: '10:30 AM',
            isMine: false,
            dateLabel: 'Today'
        },
        {
            id: 'm2',
            senderId: '3',
            senderName: 'Mike',
            text: 'Sounds good. I will prepare the mockups.',
            time: '10:45 AM',
            isMine: false
        },
        {
            id: 'm3',
            senderId: 'me',
            text: 'I will join the call from the road.',
            time: '11:02 AM',
            isMine: true
        },
        {
            id: 'm4',
            senderId: '4',
            senderName: 'Emma',
            text: 'See you at the event tomorrow!',
            image: 'https://picsum.photos/seed/chat2/300/200',
            time: '11:15 AM',
            isMine: false
        }
    ],
    'chat-1': [
        {
            id: 'm1',
            senderId: '1',
            senderName: 'Arthur',
            text: 'Hey, are you on schedule?',
            time: '9:00 AM',
            isMine: false,
            dateLabel: 'Today'
        },
        {
            id: 'm2',
            senderId: 'me',
            text: 'Yes, about 30 minutes out.',
            time: '9:05 AM',
            isMine: true
        },
        {
            id: 'm3',
            senderId: '1',
            senderName: 'Arthur',
            text: 'Thanks for the update on the route.',
            time: '9:10 AM',
            isMine: false
        }
    ]
};

export const DEFAULT_MESSAGES: ChatMessage[] = [
    {
        id: 'dm1',
        senderId: 'other',
        text: 'Hello! How can I help you today?',
        time: '9:00 AM',
        isMine: false,
        dateLabel: 'Today'
    },
    {
        id: 'dm2',
        senderId: 'me',
        text: 'Hi there!',
        time: '9:05 AM',
        isMine: true
    }
];

export const GROUP_INFO = {
    'group-1': {
        name: 'Fullstack Designers',
        avatar: avatar(10),
        distance: '3 Miles from Current',
        about:
            'A collaborative group for designers and developers working on fleet management and logistics UI. Share ideas, feedback, and resources.',
        notificationsEnabled: true,
        events: [
            {
                id: 'e1',
                title: 'Design Review Meeting',
                date: 'Jun 12, 2026',
                time: '2:00 PM',
                location: 'Conference Room B'
            }
        ] as GroupEvent[],
        members: [
            { id: '1', name: 'Arthur Miller', avatar: avatar(1), isFollowing: true },
            { id: '2', name: 'Sarah Johnson', avatar: avatar(2), isFollowing: false },
            { id: '3', name: 'Mike Chen', avatar: avatar(3), isFollowing: true },
            { id: '4', name: 'Emma Wilson', avatar: avatar(4), isFollowing: false },
            { id: '5', name: 'James Brown', avatar: avatar(5), isFollowing: false },
            { id: '6', name: 'Lisa Anderson', avatar: avatar(6), isFollowing: true }
        ] as GroupMember[],
        media: [
            'https://picsum.photos/seed/media1/200/200',
            'https://picsum.photos/seed/media2/200/200',
            'https://picsum.photos/seed/media3/200/200',
            'https://picsum.photos/seed/media4/200/200',
            'https://picsum.photos/seed/media5/200/200',
            'https://picsum.photos/seed/media6/200/200',
            'https://picsum.photos/seed/media7/200/200',
            'https://picsum.photos/seed/media8/200/200',
            'https://picsum.photos/seed/media9/200/200'
        ]
    }
};

export const SUGGESTION_CHIPS = [
    'General',
    'Work',
    'Groups',
    'Organizations'
] as const;

export const getAvatarSource = (uri?: string): ImageSourcePropType => {
    if (uri?.trim()) {
        return { uri };
    }
    return { uri: DEFAULT_USER_AVATAR_URI };
};

export const getMessagesForChat = (chatId: string): ChatMessage[] => {
    return GROUP_MESSAGES[chatId] ?? DEFAULT_MESSAGES;
};

export const getChatById = (chatId: string): ChatPreview | undefined => {
    return RECENT_CHATS.find((c) => c.id === chatId);
};
