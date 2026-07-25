import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api, { BACKEND_URL } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const UniversalSlotMachine = () => {
    const { showToast } = useToast();
    const { updateEconomy, stardustBalance } = useAuth();
    
    const [gameState, setGameState] = useState<{ state: 'BETTING' | 'ROLLING' | 'RESULT', timeLeft: number, result?: any }>({ state: 'BETTING', timeLeft: 26 });
    const [myBet, setMyBet] = useState<{ amount: number, type: string } | null>(null);
    const [slots, setSlots] = useState([7, 7, 7]);
    const [gameResultMsg, setGameResultMsg] = useState('');
    const [betAmount, setBetAmount] = useState(10);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    useEffect(() => {
        // Initial state fetch
        api.get('/teller/slot/state')
            .then((res) => {
                const gState = res.data;
                if (gState.lastResult) setSlots([gState.lastResult.n1, gState.lastResult.n2, gState.lastResult.n3]);
                if (gState.myBet) setMyBet(gState.myBet);
                setGameState(gState);
            })
            .catch(console.error);

        // Socket setup
        const token = localStorage.getItem('token');
        const socket = io(BACKEND_URL, { auth: { token } });

        socket.on('connect', () => setIsSocketConnected(true));
        socket.on('disconnect', () => setIsSocketConnected(false));

        socket.on('slot:tick', (data) => setGameState(data));
        
        socket.on('slot:state', (data) => {
            setGameState(data);
            if (data.state === 'BETTING') setMyBet(null);
            if (data.state === 'ROLLING') setGameResultMsg('');
            if (data.result) setSlots([data.result.n1, data.result.n2, data.result.n3]);
        });
        
        socket.on('slot:result', (data) => {
            if (data.win) {
                setGameResultMsg(`Kazandın! (+${data.payout} Toz)`);
                updateEconomy({ stardustBalance: stardustBalance + data.payout });
            } else {
                setGameResultMsg(`Kaybettin! (-${data.lost} Toz)`);
            }
        });

        return () => { socket.close(); };
    }, [stardustBalance]); // dependency added for economy updates

    // Rolling animation
    useEffect(() => {
        let interval: any;
        if (gameState.state === 'ROLLING') {
            interval = setInterval(() => {
                setSlots([
                    Math.floor(Math.random() * 9) + 1,
                    Math.floor(Math.random() * 9) + 1,
                    Math.floor(Math.random() * 9) + 1
                ]);
            }, 80);
        }
        return () => clearInterval(interval);
    }, [gameState.state]);

    const placeBet = async (betType: 'BIG' | 'SMALL') => {
        if (gameState.state !== 'BETTING') return;
        setGameResultMsg('');
        try {
            const res = await api.post('/teller/slot', { betAmount, betType });
            setMyBet({ amount: betAmount, type: betType });
            if (res.data && res.data.remainingStardust !== undefined) {
                updateEconomy({ stardustBalance: res.data.remainingStardust });
            }
            showToast('Bahis alındı! Bol şans 🍀', 'success');
        } catch (err: any) {
            // Handled by global interceptor
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden h-full justify-center">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
            
            <h3 className="font-headline-md text-headline-md text-on-surface mb-1 relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">casino</span> 
                Evrensel Çark
            </h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-4 relative z-10">Şansını dene, ekstra toz kazan!</p>

            {/* Timer Badge */}
            <div className="bg-surface-container-highest border border-white/5 px-4 py-1.5 rounded-full font-label-sm text-label-sm mb-6 flex items-center gap-2 relative z-10">
                <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></span>
                Sıradaki Çekiliş: <span className="text-primary font-bold">{gameState.timeLeft}sn</span>
            </div>

            {/* Slot Area */}
            <div className="bg-surface-container-lowest border-2 border-outline/20 rounded-xl p-4 w-full flex justify-between items-center relative z-10 shadow-inner mb-6">
                {slots.map((val, idx) => (
                    <div key={idx} className="w-16 h-20 bg-surface border border-primary/30 rounded-lg flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8),0_0_10px_rgba(147,51,234,0.2)] overflow-hidden relative">
                        <div 
                            className={`flex items-center justify-center h-full w-full font-headline-xl text-headline-xl text-white font-bold transition-transform`}
                            style={{
                                transform: gameState.state === 'ROLLING' ? 'translateY(2px)' : 'none',
                                textShadow: '0 0 10px rgba(255,255,255,0.5)'
                            }}
                        >
                            {val}
                        </div>
                    </div>
                ))}
            </div>

            {/* Result Message */}
            {gameResultMsg && (
                <div className={`w-full mb-6 p-3 rounded-xl border relative z-10 ${gameResultMsg.includes('Kazandın') ? 'bg-tertiary/10 border-tertiary/30 text-tertiary' : 'bg-error/10 border-error/30 text-error'}`}>
                    <h4 className="font-label-md text-label-md font-bold">{gameResultMsg}</h4>
                </div>
            )}

            {/* Controls */}
            <div className="w-full relative z-10">
                {myBet ? (
                    <div className="p-4 bg-surface-container-highest border border-white/5 rounded-xl">
                        <p className="font-label-md text-on-surface-variant">
                            Senin Bahsin: <span className="text-white">{myBet.amount} Toz</span> - <span className={myBet.type === 'BIG' ? 'text-tertiary' : 'text-error'}>{myBet.type === 'BIG' ? 'BÜYÜK' : 'KÜÇÜK'}</span>
                        </p>
                        <p className="font-label-sm text-secondary mt-2 animate-pulse">Çekilişin sonucunu bekle...</p>
                    </div>
                ) : gameState.state === 'BETTING' && gameState.timeLeft > 2 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 bg-surface-container-highest rounded-xl p-2 border border-white/5">
                            <span className="material-symbols-outlined text-secondary ml-2">auto_awesome</span>
                            <input
                                type="number" 
                                value={betAmount} 
                                onChange={e => setBetAmount(parseInt(e.target.value) || 0)}
                                className="w-20 bg-transparent text-white text-center font-headline-md focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => placeBet('SMALL')} 
                                disabled={betAmount <= 0} 
                                className="bg-error/20 text-error border border-error/30 py-3 rounded-xl font-label-md font-bold hover:bg-error/30 transition-colors disabled:opacity-50"
                            >
                                KÜÇÜK (3-10)
                            </button>
                            <button 
                                onClick={() => placeBet('BIG')} 
                                disabled={betAmount <= 0} 
                                className="bg-tertiary/20 text-tertiary border border-tertiary/30 py-3 rounded-xl font-label-md font-bold hover:bg-tertiary/30 transition-colors disabled:opacity-50"
                            >
                                BÜYÜK (11-18)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-surface-container-highest border border-white/5 rounded-xl text-on-surface-variant font-label-md text-center">
                        {gameState.state === 'ROLLING' ? 'Zarlar dönüyor, bahisler kapandı!' : 'Sonuçlar hazırlanıyor...'}
                    </div>
                )}
            </div>
        </div>
    );
};
