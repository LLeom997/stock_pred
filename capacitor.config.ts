import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.hedgefund.stockapp',
    appName: 'HedgeFundStock',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: "#09090b", // zinc-950
            showSpinner: false,
            androidScaleType: "CENTER_CROP"
        }
    }
};

export default config;
