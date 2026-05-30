// Shared TypeScript interfaces for Cosmic Connect

export interface IMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    imageUrl?: string;
    audioUrl?: string;
    createdAt: string;
}

export interface ILastMessage {
    content: string;
    senderId: string;
    createdAt: string;
}

export interface IFriend {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    status: 'MATCH' | 'SWIPE_MATCH' | 'FRIEND';
    isPremium?: boolean;
    isBlurred?: boolean;
    isExpired?: boolean;
    isMatch?: boolean;
    expiresAt?: string;
    lastMessage?: ILastMessage;
    hasMessages?: boolean;
    sunSign?: string;
    cosmicStatus?: string;
    isOnline?: boolean;
    lastSeen?: string | null;
}

export interface IGift {
    id: string;
    emoji: string;
    cost: number;
    name: string;
}

export interface IFriendRequestSender {
    id: string;
    name?: string;
    avatar?: string;
    sunSign?: string;
}

export interface IFriendRequest {
    id: string;
    sender: IFriendRequestSender;
}

export interface IGroupMessage {
    id?: string;
    senderId: string;
    roomId?: string;
    content: string;
    sender?: {
        name?: string;
        avatar?: string;
        cosmicStatus?: string;
    };
}

export interface IZodiacSign {
    id: string;
    tr: string;
    emoji: string;
}
