import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doctorify.app',
  appName: 'doctorify',
  webDir: 'public',
  server: {
    url: 'https://doctorify-cloud.vercel.app/',
    cleartext: true
  }
};

export default config;
