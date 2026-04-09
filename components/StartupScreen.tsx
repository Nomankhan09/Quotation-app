import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { loadAllLeads } from '@/store/slices/leadsSlice';
import { loadAllProducts } from '@/store/slices/productsSlice';
import { loadAllCategories } from '@/store/slices/categoriesSlice';

interface StartupScreenProps {
  onComplete: () => void;
}

export default function StartupScreen({ onComplete }: StartupScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const slideUpAnim = new Animated.Value(20);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          dispatch(loadAllLeads()),
          dispatch(loadAllProducts()),
          dispatch(loadAllCategories())
        ]);
        
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          onComplete();
        }, 1500);
      } catch (error) {
        console.error('Error initializing app:', error);
        onComplete();
      }
    };

    // Enhanced animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    // Start loading data after animation begins
    const timer = setTimeout(() => {
      initializeApp();
    }, 1500);

    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideUpAnim }
            ],
          },
        ]}
      >
        {/* Elegant Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoText}>
              <Image source={{ uri: 'https://www.decolivings.com/img/DecoLivings-Website-Logo.jpg' }} style={styles.logoImage} resizeMode="contain"/>
            </Text>
          </View>
          <View style={styles.logoGlow} />
        </View>

        {/* App Title with subtle spacing */}
        {/* <Text style={styles.title}>DecoLivings</Text> */}
        <Text style={styles.subtitle}>Professional Quotes</Text>

        {/* Enhanced Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View style={styles.loadingProgress} />
          </View>
          <Text style={styles.loadingText}>Preparing your experience</Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with precision</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoBackground: {
    width: 200,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoGlow: {
    position: 'absolute',
    width: 250,
    height: 150,
    backgroundColor: '#2563EB',
    borderRadius: 30,
    opacity: 0.1,
    top: -12,
    left: -20,
    zIndex: 1,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    width: 200,
  },
  loadingBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
    width: '35%',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});