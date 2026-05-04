import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext';
import { AuthProvider } from '../../context/AuthContext';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    route?: string;
    initialRoute?: string[];
}

export function renderWithProviders(
    ui: ReactElement,
    { route = '/', initialRoute = ['/'], ...renderOptions }: ExtendedRenderOptions = {}
) {
    window.history.pushState({}, 'Test page', route);

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
            <MemoryRouter initialEntries={initialRoute}>
                <ToastProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ToastProvider>
            </MemoryRouter>
        );
    };

    return { Wrapper, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';
