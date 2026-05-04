import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DailyHoroscopeWidget } from './DailyHoroscopeWidget';

const mockDailyHoroscope = {
    sign: "Koç",
    predictions: {
        love: { content: "Aşkta şanslı günündesin." },
        career: { content: "İş yerinde yeni bir fırsat." },
        health: { content: "Kendine dikkat et." }
    }
};

describe('DailyHoroscopeWidget Component', () => {
    it('does not render if dailyHoroscope is null', () => {
        const { container } = render(<DailyHoroscopeWidget dailyHoroscope={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the astrological sign in header', () => {
        render(<DailyHoroscopeWidget dailyHoroscope={mockDailyHoroscope} />);
        expect(screen.getByText('Günün Falı (Koç)')).toBeInTheDocument();
        expect(screen.getByText('Yıldızlar bugün senin için ne diyor?')).toBeInTheDocument();
    });

    it('expands to show predictions when clicked', async () => {
        render(<DailyHoroscopeWidget dailyHoroscope={mockDailyHoroscope} />);

        // Predictions should not be visible initially
        expect(screen.queryByText('Aşkta şanslı günündesin.')).not.toBeInTheDocument();

        // Click the header to expand
        const header = screen.getByText('Günün Falı (Koç)').closest('div')?.parentElement;
        if (header) {
            fireEvent.click(header);
        }

        // Wait for animations and assertions
        await waitFor(() => {
            expect(screen.getByText('Aşkta şanslı günündesin.')).toBeInTheDocument();
            expect(screen.getByText('İş yerinde yeni bir fırsat.')).toBeInTheDocument();
            expect(screen.getByText('Kendine dikkat et.')).toBeInTheDocument();
        });
    });
});
