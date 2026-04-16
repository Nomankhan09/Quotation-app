import React, { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import StartupScreen from '@/components/StartupScreen';
import LoginScreen from '@/components/LoginScreen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Easing } from 'react-native';


// import QuotationFlowNavigator from '@/components/QuotationFlowNavigator';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isStartupComplete, setIsStartupComplete] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);


  if (!isStartupComplete) {
    return <StartupScreen onComplete={() => setIsStartupComplete(true)} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      {/* <QuotationFlowNavigator /> */}
      <Stack
        screenOptions={{
          headerShown: false,

          // 📖 book-like horizontal navigation
          animation: "slide_from_right",

          // swipe back like pages
          gestureEnabled: true,

          // prevents flicker / border bug
          contentStyle: {
            backgroundColor: "#fff",
          },

          // makes it feel like stacked pages
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SafeAreaView style={{ flex: 1 }}>
              <AppNavigator />
            </SafeAreaView>
          </PersistGate>
        </Provider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </>
  );
}