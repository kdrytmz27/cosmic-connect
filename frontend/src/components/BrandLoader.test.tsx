import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrandLoader } from './BrandLoader';

describe('BrandLoader Component', () => {
    it('renders with default message', () => {
        render(<BrandLoader />);
        expect(screen.getByText('Kozmik Sırlar Çözülüyor...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        const customMsg = "Bağlanıyor...";
        render(<BrandLoader message={customMsg} />);
        expect(screen.getByText(customMsg)).toBeInTheDocument();
    });
});
