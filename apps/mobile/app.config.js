/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'BiteBolt',
  slug: 'bitebolt',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FF5722',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.APP_BUNDLE_ID,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'BiteBolt needs your location to deliver food to your address.',
      NSCameraUsageDescription: 'BiteBolt needs camera access for profile pictures.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FF5722',
    },
    package: process.env.APP_BUNDLE_ID,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#FF5722',
      },
    ],
  ],
  scheme: 'bitebolt',
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
    router: {},
  },
  owner: process.env.EXPO_OWNER,
};
