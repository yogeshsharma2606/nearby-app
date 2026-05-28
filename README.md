# Nearby Finder

A React Native (Expo) mobile app that finds places of interest near you — petrol pumps, temples, washrooms, parking, metro stations, hospitals, ATMs, and restaurants.

## Features

- Detects your GPS location or search any address / landmark
- Searches nearby places within 5 km using **Google Places API**
- Shows driving distance and duration via **OSRM** (free routing engine)
- Displays results on an interactive map with markers
- Sortable list with name, address, rating, opening hours, distance, and drive time
- Tapping a place opens full details and a **"Open in Google Maps"** button for navigation
- **Recent searches** — last 5 searches saved locally for quick re-use
- **Dark theme** toggle with preference persisted across sessions
- Falls back to OpenStreetMap (Overpass API) when no Google key is present

## Supported Categories

| Category | Google Places Type |
|---|---|
| Petrol Pump | `gas_station` |
| Temple | `hindu_temple` |
| Washroom | keyword: `public toilet restroom washroom` |
| Parking | `parking` |
| Metro Station | `subway_station` |
| Hospital | `hospital` |
| ATM | `atm` |
| Restaurant | `restaurant` |

## APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| Device Geolocation (`expo-location`) | Get user's GPS coordinates | Free (built-in) |
| [Google Places Nearby Search](https://developers.google.com/maps/documentation/places/web-service/search-nearby) | Find places near a coordinate | Pay-per-use |
| [Google Places Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) | Address / landmark suggestions | Pay-per-use |
| [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding) | Resolve place ID to coordinates | Pay-per-use |
| [OSRM](https://router.project-osrm.org/) | Driving distance & duration | Free, no key |
| [Overpass API](https://overpass-api.de/) | OSM fallback when no Google key | Free, no key |
| Google Maps deep link | Navigation (opens installed app) | Free URL scheme |

## Tech Stack

- React Native + Expo SDK 52 (managed workflow)
- TypeScript
- `expo-router` — file-based navigation
- `react-native-maps` — native map with OSM tiles
- `expo-location` — GPS access
- `@react-native-async-storage/async-storage` — recent searches + theme persistence
- EAS Build — cloud APK / AAB builds

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) app on your phone
- A Google Cloud project with **Places API**, **Geocoding API**, and **Maps SDK for Android** enabled

### Install

```bash
npm install
```

### Configure API Key

Create a `.env` file in the project root:

```
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_api_key_here
```

> For EAS cloud builds, add the key as an EAS secret instead:
> ```bash
> eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value your_key
> ```

### Run (development)

```bash
npx expo start --clear
```

Scan the QR code in Expo Go on your phone, or open in an emulator via `exp://127.0.0.1:8081`.

## Building

### Preview APK (for testing)

```bash
eas build -p android --profile preview
```

Downloads as a `.apk` — install directly on any Android device.

### Production AAB (for Play Store)

```bash
eas build -p android --profile production
```

Generates a signed `.aab` for upload to Google Play Console.

## Project Structure

```
nearby-finder/
├── app/
│   ├── _layout.tsx              # Root layout — ThemeProvider, PlacesProvider, stack nav
│   ├── index.tsx                # Home screen — category picker, location search, results
│   ├── map.tsx                  # Map screen — native map with place markers
│   ├── map.web.tsx              # Web fallback map (OpenStreetMap iframe)
│   └── list.tsx                 # List screen — sortable place list
├── components/
│   ├── PlaceMarker.tsx          # Custom map pin
│   ├── PlaceListItem.tsx        # List row card
│   ├── PlaceDetailSheet.tsx     # Bottom sheet — details + navigate button
│   └── ErrorBoundary.tsx        # App-level error catcher
├── services/
│   ├── placesService.ts         # Google Places Nearby Search + Place Details
│   ├── geocodeService.ts        # Google Places Autocomplete + Geocoding
│   ├── overpassService.ts       # Overpass API (OSM fallback)
│   └── osrmService.ts           # OSRM routing + distance/duration formatting
├── hooks/
│   ├── useNearbyPlaces.ts       # Main data hook — location → places → routing
│   └── useRecentSearches.ts     # AsyncStorage-backed recent search history
├── context/
│   ├── PlacesContext.tsx        # Shares places state across all screens
│   └── ThemeContext.tsx         # Light / dark theme with persistence
├── config/
│   ├── placeTypes.ts            # All supported categories with Google/Overpass config
│   └── apiKeys.ts               # API key loader from env
└── types/
    └── place.ts                 # TypeScript interfaces — NearbyPlace, OsrmRoute, etc.
```

## API Key Security

- The key is **never hardcoded** — loaded from `EXPO_PUBLIC_*` env variable or EAS secret
- The `.env` file is in `.gitignore` and never committed
- In Google Cloud Console, restrict the key to:
  - **APIs**: Places API, Geocoding API, Maps SDK for Android only
  - **Application**: Android apps — add your package name (`com.nearbyfinder.app`) and release SHA-1
- Set a **billing alert** in Google Cloud → Billing → Budgets & Alerts as a safety net

## Testing

| Method | How |
|--------|-----|
| Physical device | Scan QR with Expo Go — uses real GPS |
| Android Emulator | Connect via `exp://127.0.0.1:8081` in Expo Go |
| Fake location | Android Emulator → Extended Controls → Location tab |

## Play Store Requirements Checklist

- [x] App name, package name, version configured
- [x] App icon + adaptive icon + splash screen
- [x] Location permissions declared
- [x] Privacy policy (`privacy-policy.html`)
- [x] EAS signing keystore created
- [ ] Privacy policy hosted at a public URL
- [ ] Screenshots (2–8, phone size)
- [ ] Feature graphic (1024×500 px)
- [ ] Short description (max 80 chars)
- [ ] Full description (max 4000 chars)
- [ ] Data Safety form completed in Play Console
- [ ] Content rating questionnaire completed
- [ ] Production AAB built and uploaded
