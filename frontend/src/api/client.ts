import axios from 'axios';
import { toastManager } from '../context/ToastContext';

// VITE_API_URL öncelikli: .env dosyasında tanımlı olmalı (özellikle APK build'leri için)
// Capacitor native ortamında window.location.hostname 'localhost' döner ama
// bu gerçek localhost değildir — bu yüzden VITE_API_URL zorunludur.

if (!import.meta.env.VITE_API_URL) {
    console.error('[API] VITE_API_URL tanımlı değil! Capacitor native build\'de backend\'e bağlanılamaz.');
}

export const BACKEND_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthEndpoint = requestUrl.includes('/auth/');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            toastManager.showToast('Oturum süreniz doldu, lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('auth:unauthorized'));
            return Promise.reject(error);
        }

        // Global Error notification handling
        if (error.response?.data) {
            const { error: msg, validationErrors } = error.response.data;
            if (validationErrors) {
                // Show first validation error or a generic message
                const firstError = Object.values(validationErrors)[0] || 'Girdiğiniz bilgiler hatalı.';
                toastManager.showToast(firstError as string, 'error');
            } else if (msg) {
                toastManager.showToast(msg, 'error');
            } else {
                toastManager.showToast('Beklenmeyen bir hata oluştu.', 'error');
            }
        } else if (!error.response) {
            toastManager.showToast('Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.', 'error');
        }

        return Promise.reject(error);
    }
);

export default api;
