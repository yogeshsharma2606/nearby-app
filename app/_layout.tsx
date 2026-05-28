import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PlacesProvider } from '../context/PlacesContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

function AppStack() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.headerBackground },
          headerTintColor: c.headerText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ title: 'Nearby — Map' }} />
        <Stack.Screen name="list" options={{ title: 'Nearby — List' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <PlacesProvider>
            <AppStack />
          </PlacesProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
