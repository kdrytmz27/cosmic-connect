import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const HardwareBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleBackButton = async () => {
            if (location.pathname === '/' || location.pathname === '/login') {
                await CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        };

        const addListener = async () => {
            const listener = await CapacitorApp.addListener('backButton', handleBackButton);
            return listener;
        };
        
        const listenerPromise = addListener();

        return () => {
            listenerPromise.then(l => l.remove());
        };
    }, [navigate, location]);

    return null;
};
