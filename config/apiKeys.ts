/**
 * API Keys are loaded from environment variables.
 *
 * Local dev:  set EXPO_PUBLIC_GOOGLE_MAPS_KEY in .env (never commit .env)
 * EAS builds: set via `eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY`
 *
 * The EXPO_PUBLIC_ prefix makes the value available at runtime in the JS bundle.
 * The key is still embedded in the compiled APK — protect it using Google Cloud
 * Console API restrictions (restrict to Places API + Geocoding API + Maps SDK for Android).
 */
export const API_KEYS = {
  GOOGLE_MAPS: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
};
