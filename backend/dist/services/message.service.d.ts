export declare const messageService: {
    getMessages: (userId: string, friendId: string) => Promise<{
        id: string;
        createdAt: Date;
        content: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        senderId: string;
        isRead: boolean;
        receiverId: string;
    }[]>;
    sendMessage: (userId: string, receiverId: string, content: string, imageUrl?: string, audioUrl?: string) => Promise<{
        id: string;
        createdAt: Date;
        content: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        senderId: string;
        isRead: boolean;
        receiverId: string;
    }>;
};
//# sourceMappingURL=message.service.d.ts.map