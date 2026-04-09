import { router } from 'expo-router';

export const handleBackPress = (fallbackRoute: any = '/(tabs)/quotations') => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute);
  }
};