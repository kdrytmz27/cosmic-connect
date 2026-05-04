import { Coins } from 'lucide-react';

interface UniversalSlotMachineProps {
    gameState: { state: 'BETTING' | 'ROLLING' | 'RESULT', timeLeft: number, result?: any };
    slots: number[];
    gameResultMsg: string;
    myBet: { amount: number, type: string } | null;
    betAmount: number;
    setBetAmount: (val: number) => void;
    placeBet: (type: 'BIG' | 'SMALL') => void;
}

export const UniversalSlotMachine = ({
    gameState, slots, gameResultMsg, myBet, betAmount, setBetAmount, placeBet
}: UniversalSlotMachineProps) => {
    return (
        <div className="glass-panel" style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--accent-gold)' }}>Evrensel Yıldız Tozu Slotu</h2>
            <div style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '4px 12px', borderRadius: 16, marginBottom: 16 }}>
                Sıradaki Çekiliş: <strong style={{ color: 'var(--accent-purple)' }}>{gameState.timeLeft} sn</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                {slots.map((val, idx) => (
                    <div key={idx} style={{
                        width: 60, height: 70, background: '#1c1c24', border: '2px solid var(--accent-purple)',
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, fontWeight: 'bold', color: 'white',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px rgba(139, 92, 246, 0.3)',
                        transform: gameState.state === 'ROLLING' ? 'translateY(2px)' : 'none',
                        transition: 'transform 0.1s'
                    }}>
                        {val}
                    </div>
                ))}
            </div>

            {gameResultMsg && (
                <div style={{ marginBottom: 16, padding: '12px', borderRadius: 8, background: gameResultMsg.includes('Kazandın') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                    <h4 style={{ color: gameResultMsg.includes('Kazandın') ? '#4ade80' : '#f87171', fontSize: 16 }}>{gameResultMsg}</h4>
                </div>
            )}

            {myBet ? (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        Senin Bahsin: <strong style={{ color: 'white' }}>{myBet.amount} Toz - {myBet.type === 'BIG' ? 'BÜYÜK' : 'KÜÇÜK'}</strong>
                    </p>
                    <p style={{ fontSize: 12, marginTop: 8, color: 'var(--accent-gold)' }}>Çekilişin sonucunu bekle...</p>
                </div>
            ) : gameState.state === 'BETTING' && gameState.timeLeft > 2 ? (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                        <Coins size={18} color="var(--accent-gold)" />
                        <input
                            type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 0)}
                            style={{ width: 80, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--card-border)', padding: '6px 12px', borderRadius: 8, textAlign: 'center', fontSize: 16 }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button onClick={() => placeBet('BIG')} disabled={betAmount <= 0} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '12px', borderRadius: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>BÜYÜK (&gt;14)</button>
                        <button onClick={() => placeBet('SMALL')} disabled={betAmount <= 0} style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white', padding: '12px', borderRadius: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>KÜÇÜK (&lt;14)</button>
                    </div>
                </>
            ) : (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, color: 'var(--text-secondary)' }}>
                    {gameState.state === 'ROLLING' ? 'Zarlar dönüyor, bahisler kapandı!' : 'Sonuçlar! Yeni tur başlıyor...'}
                </div>
            )}
        </div>
    );
};
