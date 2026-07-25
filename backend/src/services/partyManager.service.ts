import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { prisma } from '../index';

export interface Seat {
    userId: string | null;
    isMuted: boolean;
    isLocked: boolean;
    label?: string;
}

export interface ParticipantInfo {
    id: string;
    name: string;
    avatar: string | null;
    level: number;
}

export interface RoomSettings {
    title?: string;
    description?: string;
    coverUrl?: string;
    welcomeMessage?: string;
    announcement?: string;
    password?: string;
    isLocked?: boolean;
    micMode?: string;
    seatLayout?: string;
    autoInvite?: boolean;
    chatEnabled?: boolean;
    frameUrl?: string;
    backgroundUrl?: string;
    entryEffect?: string;
}

export interface RoomState {
    id: string;
    ownerId: string;
    settings: RoomSettings;
    seats: Seat[];
    popularity: number;
    micRequests: string[]; // array of userIds
    participants: Map<string, ParticipantInfo>;
    moderators: string[];
    bannedUsers: string[];
}

class PartyManagerService {
    private rooms = new Map<string, RoomState>();
    private io: Server | null = null;

    public initialize(io: Server) {
        this.io = io;
    }

    public getRoom(roomId: string): RoomState | undefined {
        return this.rooms.get(roomId);
    }

    private getSeatCount(layout: string): number {
        switch (layout) {
            case "10": return 10;
            case "12": return 12;
            case "15+1": return 16;
            case "16": return 16;
            case "20": return 20;
            case "30": return 30;
            case "8+1":
            default: return 9;
        }
    }

    public createRoomState(roomId: string, ownerId: string, initialData: any = {}): RoomState {
        if (this.rooms.has(roomId)) return this.rooms.get(roomId)!;
        
        const layout = initialData.seatLayout || "8+1";
        const seatCount = this.getSeatCount(layout);

        const newRoom: RoomState = {
            id: roomId,
            ownerId,
            settings: {
                title: initialData.title || '',
                description: initialData.description || '',
                coverUrl: initialData.coverUrl || null,
                welcomeMessage: initialData.welcomeMessage || null,
                announcement: initialData.announcement || null,
                password: initialData.password || null,
                isLocked: initialData.isLocked || false,
                micMode: initialData.micMode || "ALL",
                seatLayout: layout,
                autoInvite: initialData.autoInvite || false,
                chatEnabled: initialData.chatEnabled !== false,
                frameUrl: initialData.frameUrl || null,
                backgroundUrl: initialData.backgroundUrl || null,
                entryEffect: initialData.entryEffect || null,
            },
            seats: Array(seatCount).fill(null).map(() => ({ userId: null, isMuted: false, isLocked: false })),
            popularity: 0,
            micRequests: [],
            participants: new Map(),
            moderators: initialData.moderators ? (typeof initialData.moderators === 'string' ? JSON.parse(initialData.moderators) : initialData.moderators) : [],
            bannedUsers: initialData.bannedUsers ? (typeof initialData.bannedUsers === 'string' ? JSON.parse(initialData.bannedUsers) : initialData.bannedUsers) : [],
        };
        
        // Restore seat labels if any
        if (initialData.seatLabels) {
            try {
                const labels = typeof initialData.seatLabels === 'string' ? JSON.parse(initialData.seatLabels) : initialData.seatLabels;
                Object.keys(labels).forEach(index => {
                    const idx = parseInt(index, 10);
                    if (newRoom.seats[idx]) {
                        newRoom.seats[idx].label = labels[index];
                    }
                });
            } catch (e) {
                logger.error('Error parsing seat labels:', e);
            }
        }

        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    public async joinRoom(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        if (room.bannedUsers.includes(userId)) {
            throw new Error('Bu odadan engellendiniz.');
        }

        // Fetch user info from DB
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, avatar: true, level: true }
            });
            if (user) {
                room.participants.set(userId, {
                    id: user.id,
                    name: user.name || 'Kozmik Gezgin',
                    avatar: user.avatar,
                    level: user.level
                });
            } else {
                room.participants.set(userId, {
                    id: userId,
                    name: 'Kozmik Gezgin',
                    avatar: null,
                    level: 1
                });
            }
        } catch (e) {
            room.participants.set(userId, {
                id: userId,
                name: 'Kozmik Gezgin',
                avatar: null,
                level: 1
            });
        }

        room.popularity += 10;
        this.broadcastRoomUpdate(roomId);
    }

    public leaveRoom(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.participants.delete(userId);
        room.micRequests = room.micRequests.filter(id => id !== userId);
        
        let seatChanged = false;
        room.seats.forEach(seat => {
            if (seat && seat.userId === userId) {
                seat.userId = null;
                seat.isMuted = false;
                seatChanged = true;
            }
        });

        if (seatChanged || room.participants.size >= 0) {
            this.broadcastRoomUpdate(roomId);
        }

        if (room.participants.size === 0) {
            this.rooms.delete(roomId);
            prisma.partyRoom.update({
                where: { id: roomId },
                data: { isActive: false }
            }).catch(e => logger.error('Error closing empty party room:', e));
        }
    }

    // --- Seat Mechanics ---

    public requestMic(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        if (room.seats.some(s => s && s.userId === userId)) return; // Already sitting
        if (!room.micRequests.includes(userId)) {
            room.micRequests.push(userId);
            this.broadcastRoomUpdate(roomId);
        }
    }

    public takeSeat(roomId: string, userId: string, seatIndex: number) {
        const room = this.rooms.get(roomId);
        if (!room || seatIndex < 0 || seatIndex >= room.seats.length) return;

        const targetSeat = room.seats[seatIndex];
        if (!targetSeat || targetSeat.isLocked || targetSeat.userId !== null) return; // Seat occupied or locked

        // If user is already in another seat, remove them from it (Seat Switch)
        room.seats.forEach(seat => {
            if (seat && seat.userId === userId) {
                seat.userId = null;
                seat.isMuted = false;
            }
        });

        targetSeat.userId = userId;
        room.micRequests = room.micRequests.filter(id => id !== userId); // Remove from queue
        this.broadcastRoomUpdate(roomId);
    }

    public leaveSeat(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        let seatChanged = false;
        room.seats.forEach(seat => {
            if (seat && seat.userId === userId) {
                seat.userId = null;
                seat.isMuted = false;
                seatChanged = true;
            }
        });

        if (seatChanged) {
            this.broadcastRoomUpdate(roomId);
        }
    }

    public lockSeat(roomId: string, seatIndex: number, isLocked: boolean) {
        const room = this.rooms.get(roomId);
        if (!room || seatIndex < 0 || seatIndex >= room.seats.length) return;
        
        const targetSeat = room.seats[seatIndex];
        if (targetSeat) {
            targetSeat.isLocked = isLocked;
            this.broadcastRoomUpdate(roomId);
        }
    }

    public kickFromSeat(roomId: string, seatIndex: number) {
        const room = this.rooms.get(roomId);
        if (!room || seatIndex < 0 || seatIndex >= room.seats.length) return;
        
        const targetSeat = room.seats[seatIndex];
        if (targetSeat) {
            targetSeat.userId = null;
            targetSeat.isMuted = false;
            this.broadcastRoomUpdate(roomId);
        }
    }

    public muteSeat(roomId: string, seatIndex: number, isMuted: boolean) {
        const room = this.rooms.get(roomId);
        if (!room || seatIndex < 0 || seatIndex >= room.seats.length) return;
        
        const targetSeat = room.seats[seatIndex];
        if (targetSeat) {
            targetSeat.isMuted = isMuted;
            this.broadcastRoomUpdate(roomId);
        }
    }

    public setSeatLabel(roomId: string, seatIndex: number, label: string | null) {
        const room = this.rooms.get(roomId);
        if (!room || seatIndex < 0 || seatIndex >= room.seats.length) return;
        
        const targetSeat = room.seats[seatIndex];
        if (targetSeat) {
            if (label) targetSeat.label = label;
            else delete targetSeat.label;
            
            // Async update to DB
            this.saveSeatLabels(roomId);
            this.broadcastRoomUpdate(roomId);
        }
    }

    private async saveSeatLabels(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const labels: any = {};
        room.seats.forEach((seat, index) => {
            if (seat.label) labels[index] = seat.label;
        });
        
        try {
            await prisma.partyRoom.update({
                where: { id: roomId },
                data: { seatLabels: labels }
            });
        } catch (e) {
            logger.error('Error saving seat labels:', e);
        }
    }

    public updateSettings(roomId: string, updates: Partial<RoomSettings>) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // Handle seatLayout change
        if (updates.seatLayout && updates.seatLayout !== room.settings.seatLayout) {
            const newCount = this.getSeatCount(updates.seatLayout);
            const newSeats: Seat[] = Array(newCount).fill(null).map(() => ({ userId: null, isMuted: false, isLocked: false }));
            
            // Copy existing users to new seats up to max index
            room.seats.forEach((seat, i) => {
                if (i < newCount) {
                    newSeats[i] = seat;
                } else if (seat.userId) {
                    // User is kicked from seat if new layout is smaller
                    // (They remain in room)
                }
            });
            room.seats = newSeats;
        }

        room.settings = { ...room.settings, ...updates };
        this.saveSettings(roomId);
        this.broadcastRoomUpdate(roomId);
    }

    public toggleLock(roomId: string, isLocked: boolean, password?: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.settings.isLocked = isLocked;
        if (password) {
            room.settings.password = password;
        } else {
            delete room.settings.password;
        }
        this.saveSettings(roomId);
        this.broadcastRoomUpdate(roomId);
    }

    private async saveSettings(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const data: any = {};
        for (const [key, value] of Object.entries(room.settings)) {
            if (value !== undefined) data[key] = value;
        }
        try {
            await prisma.partyRoom.update({ where: { id: roomId }, data });
        } catch (e) {
            logger.error('Error saving party room settings:', e);
        }
    }

    public setModerator(roomId: string, targetUserId: string, isModerator: boolean) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        if (isModerator && !room.moderators.includes(targetUserId)) {
            room.moderators.push(targetUserId);
        } else if (!isModerator) {
            room.moderators = room.moderators.filter(id => id !== targetUserId);
        }
        
        this.saveModerators(roomId);
        this.broadcastRoomUpdate(roomId);
    }

    private async saveModerators(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        try {
            await prisma.partyRoom.update({
                where: { id: roomId },
                data: { moderators: room.moderators }
            });
        } catch (e) {
            logger.error('Error saving moderators:', e);
        }
    }

    public banUser(roomId: string, targetUserId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        if (!room.bannedUsers.includes(targetUserId)) {
            room.bannedUsers.push(targetUserId);
            this.leaveRoom(roomId, targetUserId); // kick out immediately
            this.saveBannedUsers(roomId);
        }
    }

    private async saveBannedUsers(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        try {
            await prisma.partyRoom.update({
                where: { id: roomId },
                data: { bannedUsers: room.bannedUsers }
            });
        } catch (e) {
            logger.error('Error saving banned users:', e);
        }
    }

    public addPopularity(roomId: string, points: number) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.popularity += points;
            this.broadcastRoomUpdate(roomId);
        }
    }

    public getParticipantCount(roomId: string): number {
        const room = this.rooms.get(roomId);
        return room ? room.participants.size : 0;
    }

    public broadcastRoomUpdate(roomId: string) {
        if (!this.io) return;
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Convert Map to Array with full user info before sending over socket
        const participantsArray = Array.from(room.participants.values());
        
        // Enrich seat data with participant names
        const enrichedSeats = room.seats.map(seat => {
            if (seat.userId) {
                const participant = room.participants.get(seat.userId);
                return {
                    ...seat,
                    userName: participant?.name || 'Kozmik Gezgin',
                    userAvatar: participant?.avatar || null,
                    userLevel: participant?.level || 1
                };
            }
            return seat;
        });

        // Omit password from broadcast
        const { password, ...safeSettings } = room.settings;

        const data = {
            id: room.id,
            ownerId: room.ownerId,
            settings: safeSettings,
            seats: enrichedSeats,
            popularity: room.popularity,
            micRequests: room.micRequests,
            participants: participantsArray,
            moderators: room.moderators
        };
        this.io.to(`party_${roomId}`).emit('partyRoomStateSync', data);
    }
}

export const partyManager = new PartyManagerService();
