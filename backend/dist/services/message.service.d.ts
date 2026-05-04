export declare const messageService: {
    getMessages: (userId: string, friendId: string) => Promise<{
        id: string;
        createdAt: Date;
        content: string;
        senderId: string;
        receiverId: string;
    }[]>;
    sendMessage: (userId: string, receiverId: string, content: string) => Promise<{
        id: string;
        createdAt: Date;
        content: string;
        senderId: string;
        receiverId: string;
    }>;
};
//# sourceMappingURL=message.service.d.ts.map