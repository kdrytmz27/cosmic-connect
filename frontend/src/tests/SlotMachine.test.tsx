import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import { UniversalSlotMachine } from '../../src/components/fortune/UniversalSlotMachine';
import { vi } from 'vitest';

describe('Slot Makinesi Testleri', () => {
    it('Bahis modunda BÜYÜK/KÜÇÜK butonları görünür ve tıklanabilir', async () => {
        const user = userEvent.setup();
        const mockPlaceBet = vi.fn();

        renderWithProviders(
            <UniversalSlotMachine
                gameState={{ state: 'BETTING', timeLeft: 15 }}
                slots={[3, 5, 2]}
                gameResultMsg=""
                myBet={null}
                betAmount={100}
                setBetAmount={vi.fn()}
                placeBet={mockPlaceBet}
            />
        );

        // Slot değerleri görünmeli
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        // Geri sayım
        expect(screen.getByText(/15 sn/i)).toBeInTheDocument();

        // Butonlar
        const bigBtn = screen.getByRole('button', { name: /BÜYÜK/i });
        const smallBtn = screen.getByRole('button', { name: /KÜÇÜK/i });
        expect(bigBtn).toBeInTheDocument();
        expect(smallBtn).toBeInTheDocument();

        await user.click(bigBtn);
        expect(mockPlaceBet).toHaveBeenCalledWith('BIG');

        await user.click(smallBtn);
        expect(mockPlaceBet).toHaveBeenCalledWith('SMALL');
    });

    it('Bahis yapıldığında bahis bilgisi ve bekleme mesajı görünür', () => {
        renderWithProviders(
            <UniversalSlotMachine
                gameState={{ state: 'ROLLING', timeLeft: 5 }}
                slots={[7, 7, 7]}
                gameResultMsg=""
                myBet={{ amount: 200, type: 'BIG' }}
                betAmount={200}
                setBetAmount={vi.fn()}
                placeBet={vi.fn()}
            />
        );

        expect(screen.getByText(/200 Toz - BÜYÜK/i)).toBeInTheDocument();
        expect(screen.getByText(/Çekilişin sonucunu bekle/i)).toBeInTheDocument();
    });

    it('Kazanç sonucu ekranda "Kazandın" mesajıyla yeşil gösterilir', () => {
        renderWithProviders(
            <UniversalSlotMachine
                gameState={{ state: 'RESULT', timeLeft: 0 }}
                slots={[8, 9, 7]}
                gameResultMsg="Kazandın! +400 Yıldız Tozu"
                myBet={null}
                betAmount={0}
                setBetAmount={vi.fn()}
                placeBet={vi.fn()}
            />
        );

        expect(screen.getByText('Kazandın! +400 Yıldız Tozu')).toBeInTheDocument();
    });
});
