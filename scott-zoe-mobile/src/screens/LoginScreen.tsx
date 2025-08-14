import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export default function LoginScreen() {
  const [username, setUsername] = useState('scott');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [logoScale] = useState(new Animated.Value(0));
  const [logoRotation] = useState(new Animated.Value(0));
  const { login } = useAuth();

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
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Create floating hearts
    const interval = setInterval(createFloatingHeart, 2000);
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
        duration: 8000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(6000),
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

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const success = await login(username, password);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Invalid password. Please try again.');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FF6B9D', '#C44569', '#F8B500']}
        style={styles.gradient}
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
            <Ionicons name="heart" size={30} color="rgba(255, 255, 255, 0.8)" />
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
            <Ionicons name="heart-circle" size={120} color="white" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Scott & Zoe</Text>
          <Text style={styles.subtitle}>Love Story</Text>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Username Selection */}
            <View style={styles.usernameContainer}>
              <Text style={styles.usernameLabel}>Who are you?</Text>
              <View style={styles.usernameToggle}>
                <TouchableOpacity
                  style={[styles.usernameOption, username === 'scott' && styles.usernameOptionActive]}
                  onPress={() => {
                    setUsername('scott');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={username === 'scott' ? 'white' : '#FF6B9D'} 
                    style={styles.usernameIcon} 
                  />
                  <Text style={[styles.usernameText, username === 'scott' && styles.usernameTextActive]}>Scott</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.usernameOption, username === 'zoe' && styles.usernameOptionActive]}
                  onPress={() => {
                    setUsername('zoe');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={username === 'zoe' ? 'white' : '#FF6B9D'} 
                    style={styles.usernameIcon} 
                  />
                  <Text style={[styles.usernameText, username === 'zoe' && styles.usernameTextActive]}>Zoe</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#FF6B9D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255, 107, 157, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Made with ❤️ for our love story</Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
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
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  usernameContainer: {
    marginBottom: 20,
  },
  usernameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  usernameToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  usernameOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    justifyContent: 'center',
  },
  usernameOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  usernameIcon: {
    marginRight: 6,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  usernameTextActive: {
    color: '#FF6B9D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  floatingHeart: {
    position: 'absolute',
    zIndex: 1,
  },
});