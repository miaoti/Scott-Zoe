import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export default function LoadingScreen() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [logoScale] = useState(new Animated.Value(0));
  const [logoRotation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    // Animate logo entrance
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Create floating hearts
    const interval = setInterval(createFloatingHeart, 1500);
    return () => clearInterval(interval);
  }, []);

  const createFloatingHeart = () => {
    const heartId = Date.now();
    const x = Math.random() * (width - 50);
    const y = height;
    
    const newHeart: FloatingHeart = {
      id: heartId,
      x,
      y,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
    };

    setHearts(prev => [...prev, newHeart]);

    // Animate heart
    Animated.parallel([
      Animated.spring(newHeart.scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(newHeart.translateY, {
        toValue: -height - 100,
        duration: 6000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(newHeart.opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Remove heart after animation
      setHearts(prev => prev.filter(heart => heart.id !== heartId));
    });
  };

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#F8B500']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Floating Hearts */}
      {hearts.map((heart) => (
        <Animated.View
          key={heart.id}
          style={[
            styles.floatingHeart,
            {
              left: heart.x,
              bottom: heart.y,
              transform: [
                { scale: heart.scale },
                { translateY: heart.translateY },
              ],
              opacity: heart.opacity,
            },
          ]}
        >
          <Ionicons name="heart" size={25} color="rgba(255, 255, 255, 0.6)" />
        </Animated.View>
      ))}

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: logoRotationInterpolate },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: pulseAnimation }],
            }}
          >
            <Ionicons name="heart-circle" size={100} color="white" />
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Scott & Zoe</Text>
        <Text style={styles.subtitle}>Love Story</Text>

        {/* Loading Text */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading our memories...</Text>
          <View style={styles.dotsContainer}>
            <Animated.Text style={[styles.dot, { opacity: pulseAnimation }]}>•</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: pulseAnimation }]}>•</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: pulseAnimation }]}>•</Animated.Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 50,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 24,
    color: 'white',
    marginHorizontal: 2,
  },
  floatingHeart: {
    position: 'absolute',
    zIndex: 1,
  },
});