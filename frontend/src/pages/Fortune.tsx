import { useEffect, useState } from 'react';
import api, { BACKEND_URL } from '../api/client';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

import { UniversalSlotMachine } from '../components/fortune/UniversalSlotMachine';
import { DailyTarot } from '../components/fortune/DailyTarot';
import { LoveHoroscope } from '../components/fortune/LoveHoroscope';
import { MoonPhaseWidget } from '../components/fortune/MoonPhaseWidget';
import { FortuneTellersList } from '../components/fortune/FortuneTellersList';
import { PastFortunesModal } from '../components/fortune/PastFortunesModal';

const Fortune = () => {
    const { showToast } = useToast();
    const { updateEconomy, stardustBalance } = useAuth();
    const [horoscope, setHoroscope] = useState<any>(null);
    const [tellers, setTellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [tarotStatus, setTarotStatus] = useState<{ canDraw: boolean, lastDraw?: string }>({ canDraw: false });
    const [drawnCard, setDrawnCard] = useState<any>(null);
    const [isFlipping, setIsFlipping] = useState(false);

    const navigate = useNavigate();
    const [gameState, setGameState] = useState<{ state: 'BETTING' | 'ROLLING' | 'RESULT', timeLeft: number, result?: any }>({ state: 'BETTING', timeLeft: 26 });
    const [myBet, setMyBet] = useState<{ amount: number, type: string } | null>(null);
    const [slots, setSlots] = useState([7, 7, 7]);
    const [gameResultMsg, setGameResultMsg] = useState('');
    const [betAmount, setBetAmount] = useState(10);
    const [myFortunes, setMyFortunes] = useState<any[]>([]);
    const [showFortunesModal, setShowFortunesModal] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/horoscope/today?category=LOVE'),
            api.get('/teller'),
            api.get('/teller/slot/state'),
            api.get('/teller/fortunes/my'),
            api.get('/tarot/daily/status')
        ]).then(([horoRes, tellerRes, slotRes, fortunesRes, tarotRes]) => {
            setHoroscope(horoRes.data.horoscope || horoRes.data.love || horoRes.data);
            setTellers(tellerRes.data.data || tellerRes.data);
            if (fortunesRes) setMyFortunes(fortunesRes.data);
            if (tarotRes) setTarotStatus(tarotRes.data);

            const gState = slotRes.data;
            if (gState.lastResult) {
                setSlots([gState.lastResult.n1, gState.lastResult.n2, gState.lastResult.n3]);
            }
            if (gState.myBet) {
                setMyBet(gState.myBet);
            }
            setGameState(gState);
        }).catch(console.error).finally(() => setLoading(false));

        const token = localStorage.getItem('token');
        const newSocket = io(BACKEND_URL, { auth: { token } });

        newSocket.on('slot:tick', (data) => setGameState(data));
        newSocket.on('slot:state', (data) => {
            setGameState(data);
            if (data.state === 'BETTING') setMyBet(null);
            if (data.state === 'ROLLING') setGameResultMsg('');
            if (data.result) setSlots([data.result.n1, data.result.n2, data.result.n3]);
        });
        newSocket.on('slot:result', (data) => {
            if (data.win) {
                setGameResultMsg(`Kazandın! (+${data.payout} Toz)`);
                updateEconomy({ stardustBalance: stardustBalance + data.payout });
            } else {
                setGameResultMsg(`Kaybettin! (-${data.lost} Toz)`);
            }
        });

        return () => { newSocket.close(); };
    }, []);

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

    const getMoonPhase = () => {
        const baseDate = new Date('2024-01-11T11:57:00Z').getTime();
        const now = new Date().getTime();
        const diff = now - baseDate;
        const days = diff / (1000 * 60 * 60 * 24);
        const cycle = days % 29.53;

        if (cycle < 1.84 || cycle > 27.68) return { phase: 'Yeni Ay', emoji: '🌑', text: 'Yeni başlangıçlar için harika bir zaman. Niyetlerini belirle.' };
        if (cycle < 5.53) return { phase: 'Hilal', emoji: '🌒', text: 'Hedeflerine odaklan ve adımlar atmaya başla.' };
        if (cycle < 9.22) return { phase: 'İlk Dördün', emoji: '🌓', text: 'Zorluklarla yüzleşme ve kararlılık gösterme zamanı.' };
        if (cycle < 12.91) return { phase: 'Büyüyen Ay', emoji: '🌔', text: 'Enerjin artıyor, projelerini ince ayarla.' };
        if (cycle < 16.60) return { phase: 'Dolunay', emoji: '🌕', text: 'Duygular yoğun; hasat zamanı, sonuçları görme dönemi.' };
        if (cycle < 20.29) return { phase: 'Küçülen Ay', emoji: '🌖', text: 'Minnettarlık hisset ve tecrübelerini paylaş.' };
        if (cycle < 23.98) return { phase: 'Son Dördün', emoji: '🌗', text: 'Affetme, bırakma ve fazlalıkları hayatından çıkarma vakti.' };
        return { phase: 'Balzamik Ay', emoji: '🌘', text: 'Dinlenme ve iç gözlem yapma zamanı.' };
    };

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
            // Error is handled by global interceptor now
        }
    };

    const rateTellerResult = async (appointmentId: string, rating: number) => {
        const comment = window.prompt('Falcı için bir yorumunuz var mı? (İsteğe bağlı)');
        try {
            await api.post('/teller/fortunes/rate', { appointmentId, rating, comment });
            showToast('Değerlendirmeniz alındı, Falcıya iletildi!', 'success');
            const res = await api.get('/teller/fortunes/my');
            setMyFortunes(res.data);
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Bir hata oluştu', 'error');
        }
    };

    const drawTarot = async () => {
        if (!tarotStatus.canDraw || isFlipping) return;
        setIsFlipping(true);
        try {
            const res = await api.post('/tarot/daily/draw');
            if (res.data.remainingStardust !== undefined) {
                updateEconomy({ stardustBalance: res.data.remainingStardust });
            }
            setTimeout(() => {
                setDrawnCard(res.data.card);
                setTarotStatus({ canDraw: false, lastDraw: new Date().toISOString() });
                setIsFlipping(false);
            }, 600);
        } catch (err: any) {
            setIsFlipping(false);
        }
    };

    return (
        <div style={{ padding: 24, paddingBottom: 100 }}>
            <h1 className="glow-text" style={{ fontSize: 32, marginBottom: 24 }}>Falcı & Oyunlar</h1>

            <UniversalSlotMachine
                gameState={gameState}
                slots={slots}
                gameResultMsg={gameResultMsg}
                myBet={myBet}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                placeBet={placeBet}
            />

            <DailyTarot
                tarotStatus={tarotStatus}
                drawnCard={drawnCard}
                isFlipping={isFlipping}
                drawTarot={drawTarot}
            />

            <LoveHoroscope horoscope={horoscope} loading={loading} />

            <MoonPhaseWidget moonPhase={getMoonPhase()} />

            <FortuneTellersList
                tellers={tellers}
                navigate={navigate}
                myFortunesCount={myFortunes.length}
                setShowFortunesModal={setShowFortunesModal}
            />

            <PastFortunesModal
                showFortunesModal={showFortunesModal}
                setShowFortunesModal={setShowFortunesModal}
                myFortunes={myFortunes}
                rateTellerResult={rateTellerResult}
            />
        </div>
    );
};
export default Fortune;
