import { useEffect, useState } from 'react';
import { Banknote, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

interface PayoutRequest {
    id: string;
    amount: number;
    iban: string;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    createdAt: string;
    processedAt: string | null;
}

interface PayoutPanelProps {
    diamondBalance: number;
    onBalanceChange: (balance: number) => void;
}

const STATUS_META: Record<PayoutRequest['status'], { label: string; className: string; Icon: typeof Clock }> = {
    PENDING: { label: 'Bekliyor', className: 'text-amber-400 bg-amber-400/10 border-amber-400/30', Icon: Clock },
    COMPLETED: { label: 'Ödendi', className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', Icon: CheckCircle2 },
    REJECTED: { label: 'Reddedildi', className: 'text-red-400 bg-red-400/10 border-red-400/30', Icon: XCircle }
};

// IBAN'ı 4'erli gruplayarak okunur hale getirir
const formatIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim();

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

export const PayoutPanel: React.FC<PayoutPanelProps> = ({ diamondBalance, onBalanceChange }) => {
    const { showToast } = useToast();
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [minAmount, setMinAmount] = useState(0);
    const [amount, setAmount] = useState('');
    const [iban, setIban] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get('/teller/payout')
            .then(({ data }) => {
                if (cancelled) return;
                setPayouts(data.payouts || []);
                setMinAmount(data.minAmount || 0);
                if (data.iban) setIban(formatIban(data.iban));
            })
            .catch(err => {
                if (!cancelled) console.error('Ödeme talepleri alınamadı', err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    // Bekleyen talep varken yenisi açılamıyor (sunucu da aynı kuralı uyguluyor);
    // formu kapatmak, kullanıcıyı reddedilecek bir istek göndermekten kurtarıyor
    const pending = payouts.find(p => p.status === 'PENDING');
    const parsedAmount = Number(amount);
    const amountValid = Number.isInteger(parsedAmount) && parsedAmount >= minAmount && parsedAmount <= diamondBalance;
    const canSubmit = !pending && !submitting && amountValid && iban.trim().length > 0;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const { data } = await api.post('/teller/payout', {
                amount: parsedAmount,
                iban: iban.replace(/\s+/g, '')
            });
            setPayouts(prev => [data.payout, ...prev]);
            onBalanceChange(data.diamondBalance);
            setAmount('');
            showToast('Ödeme talebiniz oluşturuldu.', 'success');
        } catch (err: any) {
            showToast(err?.response?.data?.error || 'Ödeme talebi oluşturulamadı.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <Banknote size={22} className="text-emerald-400" /> Kazancını Çek
                </h2>
                <div className="text-right">
                    <div className="font-headline-md text-headline-md text-emerald-400 font-bold">
                        {diamondBalance.toLocaleString('tr-TR')}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">Çekilebilir Elmas</div>
                </div>
            </div>

            {pending ? (
                <p className="text-sm text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3">
                    Bekleyen bir ödeme talebiniz var. Sonuçlandıktan sonra yenisini oluşturabilirsiniz.
                </p>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                            Tutar (elmas)
                        </label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder={minAmount ? `En az ${minAmount.toLocaleString('tr-TR')}` : ''}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/60"
                        />
                        {amount !== '' && !amountValid && (
                            <p className="text-xs text-red-400 mt-1">
                                {parsedAmount > diamondBalance
                                    ? 'Bakiyenizden fazla tutar giremezsiniz.'
                                    : `En az ${minAmount.toLocaleString('tr-TR')} elmas çekebilirsiniz.`}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">IBAN</label>
                        <input
                            value={iban}
                            onChange={e => setIban(e.target.value)}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/60 font-mono text-sm"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full bg-emerald-500 text-black font-bold rounded-xl py-3 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Gönderiliyor...' : 'Ödeme Talebi Oluştur'}
                    </button>
                </div>
            )}

            <div className="space-y-2">
                <h3 className="font-label-md text-label-md text-on-surface-variant">Geçmiş Talepler</h3>
                {loading ? (
                    <p className="text-sm text-on-surface-variant">Yükleniyor...</p>
                ) : payouts.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">Henüz bir ödeme talebiniz yok.</p>
                ) : (
                    payouts.map(p => {
                        const meta = STATUS_META[p.status];
                        const Icon = meta.Icon;
                        return (
                            <div key={p.id} className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl px-4 py-3">
                                <div className="min-w-0">
                                    <div className="text-on-surface font-bold">{p.amount.toLocaleString('tr-TR')} elmas</div>
                                    <div className="text-xs text-on-surface-variant font-mono truncate">{formatIban(p.iban)}</div>
                                    <div className="text-xs text-on-surface-variant">{formatDate(p.createdAt)}</div>
                                </div>
                                <span className={`shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.className}`}>
                                    <Icon size={13} /> {meta.label}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};
