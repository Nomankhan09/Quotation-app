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
import * as Notifications from 'expo-notifications';

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

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });


  useEffect(() => {
    const setupNotifications = async () => {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor:"#f3e5e57c",
      });
    };

    setupNotifications();
  }, []);


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