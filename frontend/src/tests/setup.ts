import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    })),
});

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    })),
});

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Global RevenueCat Mock for testing environment
vi.mock('@revenuecat/purchases-capacitor', () => ({
    Purchases: {
        setLogLevel: vi.fn(),
        configure: vi.fn(),
        getOfferings: vi.fn().mockResolvedValue({ current: { availablePackages: [] } }),
        purchasePackage: vi.fn().mockResolvedValue({ customerInfo: {} }),
        getCustomerInfo: vi.fn().mockResolvedValue({ entitlements: { active: {} } }),
        addCustomerInfoUpdateListener: vi.fn(),
        logOut: vi.fn().mockResolvedValue({})
    },
    LOG_LEVEL: { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 }
}));
