import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Purchases } from '@revenuecat/purchases-capacitor';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Capgo OTA: Uygulamanın başarıyla yüklendiğini Capgo sunucusuna bildir
// Bu çağrı OLMADAN Capgo güncellemeyi başarısız sayar ve eski versiyona döner
CapacitorUpdater.notifyAppReady();

// RevenueCat Yapılandırması (Configure)
const configureRevenueCat = async () => {
  try {
    // TODO: Buraya asıl RevenueCat Public API anahtarınız (Key) girilmelidir.
    // Google Play için örn: 'goog_XyZxZ...' | App Store için: 'appl_XyZxZ...'
    await Purchases.configure({ apiKey: 'YOUR_REVENUECAT_API_KEY_HERE' });
  } catch (e) {
    console.error('RevenueCat başlatılamadı:', e);
  }
}
configureRevenueCat();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
