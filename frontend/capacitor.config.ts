import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosmicconnect.app',
  appName: 'Cosmic Connect',
  webDir: 'dist',
  android: {
    allowMixedContent: false
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,          // Uygulama açılışında otomatik güncelleme kontrol et
      statsUrl: '',              // İstatistik gönderme (boş = devre dışı)
      privateKey: undefined,     // Bundle imzalama için (isteğe bağlı)
    }
  }
};

export default config;
