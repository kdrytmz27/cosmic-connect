import { Server } from 'socket.io';
declare class SlotMachineManager {
    private io;
    private state;
    private timeLeft;
    private bets;
    private lastResult;
    private intervalId;
    isInitialized: boolean;
    initialize(io: Server): void;
    private startLoop;
    stopLoop(): void;
    private tick;
    private resolveBets;
    placeBet(userId: string, betAmount: number, betType: 'BIG' | 'SMALL'): Promise<{
        success: boolean;
        newBalance: number;
    }>;
    getCurrentState(userId?: string): {
        state: "BETTING" | "ROLLING" | "RESULT";
        timeLeft: number;
        lastResult: {
            n1: number;
            n2: number;
            n3: number;
            sum: number;
        } | null;
        myBet: {
            amount: number;
            type: "BIG" | "SMALL";
        } | null;
    };
}
export declare const slotManager: SlotMachineManager;
export {};
//# sourceMappingURL=slot.service.d.ts.map