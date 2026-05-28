// Dynamic Expo config — replaces app.json so env vars can be injected at build time.
// EAS secret:  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY
// Local dev:   set EXPO_PUBLIC_GOOGLE_MAPS_KEY in .env

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Nearby Finder',
  slug: 'nearby-finder',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'nearbyfinder',
  newArchEnabled: false,
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    backgroundColor: '#0a7ea4',
    resizeMode: 'contain',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'This app needs your location to find nearby places.',
      NSLocationAlwaysUsageDescription:
        'This app needs your location to find nearby places.',
    },
  },
  android: {
    package: 'com.nearbyfinder.app',
    versionCode: 1,
    config: {
      googleMaps: {
        apiKey: googleMapsKey,
      },
    },
    adaptiveIcon: {
      backgroundColor: '#0a7ea4',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'This app needs your location to find nearby places.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // ProGuard only for production Play Store builds — breaks Fabric in preview APKs
          enableProguardInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
        },
      },
    ],
  ],
  extra: {
    router: { origin: false },
    eas: { projectId: '5d7fe707-87de-4cc6-a6ed-c0de4bafed3f' },
  },
  // Add your hosted privacy policy URL here once available
  // privacyPolicyUrl: 'https://YOUR_USERNAME.github.io/nearby-finder/privacy-policy.html',
};
