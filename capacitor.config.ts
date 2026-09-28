import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.gesex.app',
  appName: 'GESEX Control de Calidad',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#08284d',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: '#08284d',
      showSpinner: false
    }
  }
};

export default config;
