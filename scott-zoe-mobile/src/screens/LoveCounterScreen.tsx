import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../contexts/DataContext';

const { width, height } = Dimensions.get('window');

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

interface LoveButtonProps {
  onPress: () => void;
  disabled: boolean;
}

function LoveButton({ onPress, disabled }: LoveButtonProps) {
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
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
  }, []);

  const handlePress = () => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1.1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.loveButtonContainer}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.loveButton,
          {
            transform: [
              { scale: scaleAnimation },
              { scale: pulseAnimation },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#FF6B9D', '#C44569']}
          style={styles.loveButtonGradient}
        >
          <Ionicons name="heart" size={60} color="white" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  return (
    <View style={styles.statsCard}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.statsCardGradient}
      >
        <View style={styles.statsCardHeader}>
          <Ionicons name={icon} size={24} color="white" />
          <Text style={styles.statsCardTitle}>{title}</Text>
        </View>
        <Text style={styles.statsCardValue}>{value.toLocaleString()}</Text>
        {subtitle && (
          <Text style={styles.statsCardSubtitle}>{subtitle}</Text>
        )}
      </LinearGradient>
    </View>
  );
}

interface PrizeWheelCardProps {
  wheelStats: any;
  onSpin: () => void;
}

function PrizeWheelCard({ wheelStats, onSpin }: PrizeWheelCardProps) {
  const canSpin = wheelStats?.spinsAvailable > 0;

  return (
    <View style={styles.prizeWheelCard}>
      <Text style={styles.cardTitle}>Prize Wheel</Text>
      <View style={styles.prizeWheelContent}>
        <View style={styles.prizeWheelStats}>
          <Text style={styles.prizeWheelStatText}>
            Spins Available: {wheelStats?.spinsAvailable || 0}
          </Text>
          <Text style={styles.prizeWheelStatText}>
            Total Spins: {wheelStats?.totalSpins || 0}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.spinButton,
            !canSpin && styles.spinButtonDisabled,
          ]}
          onPress={onSpin}
          disabled={!canSpin}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSpin ? ['#F8B500', '#FFA726'] : ['#ccc', '#999']}
            style={styles.spinButtonGradient}
          >
            <Ionicons
              name="refresh-circle"
              size={24}
              color="white"
              style={styles.spinButtonIcon}
            />
            <Text style={styles.spinButtonText}>
              {canSpin ? 'Spin Wheel' : 'No Spins Left'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LoveCounterScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [isIncrementing, setIsIncrementing] = useState(false);
  
  const {
    loveStats,
    wheelStats,
    fetchLoveStats,
    fetchWheelStats,
    incrementLove,
    spinPrizeWheel,
  } = useData();

  useEffect(() => {
    fetchLoveStats();
    fetchWheelStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([fetchLoveStats(), fetchWheelStats()]);
    setRefreshing(false);
  };

  const createFloatingHeart = () => {
    const heartId = Date.now();
    const x = Math.random() * (width - 50);
    const y = height / 2;
    
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
        toValue: -200,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(newHeart.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Remove heart after animation
      setHearts(prev => prev.filter(heart => heart.id !== heartId));
    });
  };

  const handleIncrementLove = async () => {
    if (isIncrementing) return;
    
    setIsIncrementing(true);
    createFloatingHeart();
    
    try {
      await incrementLove();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error incrementing love:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTimeout(() => setIsIncrementing(false), 1000);
    }
  };

  const handleSpinWheel = async () => {
    if (wheelStats?.spinsAvailable <= 0) {
      Alert.alert('No Spins Available', 'You need more love to earn spins!');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const result = await spinPrizeWheel();
      
      if (result) {
        Alert.alert(
          'Congratulations!',
          `You won: ${result.prize}!`,
          [{ text: 'Awesome!', style: 'default' }]
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
      Alert.alert('Error', 'Failed to spin the wheel. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const calculateProgress = () => {
    const currentLove = loveStats?.totalLove || 0;
    const nextMilestone = Math.ceil(currentLove / 100) * 100;
    const progress = nextMilestone > 0 ? (currentLove % 100) / 100 : 0;
    return { progress, nextMilestone };
  };

  const { progress, nextMilestone } = calculateProgress();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
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
                top: heart.y,
                transform: [
                  { scale: heart.scale },
                  { translateY: heart.translateY },
                ],
                opacity: heart.opacity,
              },
            ]}
          >
            <Ionicons name="heart" size={30} color="rgba(255, 255, 255, 0.9)" />
          </Animated.View>
        ))}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Love Counter</Text>
            <Text style={styles.headerSubtitle}>
              Spread the love, one tap at a time ❤️
            </Text>
          </View>

          {/* Love Counter */}
          <View style={styles.loveCounterSection}>
            <Text style={styles.loveCountText}>
              {(loveStats?.totalLove || 0).toLocaleString()}
            </Text>
            <Text style={styles.loveCountLabel}>Total Love</Text>
            
            <LoveButton
              onPress={handleIncrementLove}
              disabled={isIncrementing}
            />
          </View>

          {/* Progress to Next Milestone */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              Progress to {nextMilestone} hearts
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatsCard
              title="Today's Love"
              value={loveStats?.todayLove || 0}
              icon="heart"
              color="#FF6B9D"
              subtitle="hearts today"
            />
            <StatsCard
              title="This Week"
              value={loveStats?.weekLove || 0}
              icon="calendar"
              color="#C44569"
              subtitle="hearts this week"
            />
          </View>

          {/* Prize Wheel */}
          <PrizeWheelCard
            wheelStats={wheelStats}
            onSpin={handleSpinWheel}
          />
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    minHeight: height,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
    textAlign: 'center',
  },
  loveCounterSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loveCountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loveCountLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  loveButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loveButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  loveButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardGradient: {
    padding: 15,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsCardTitle: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  statsCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statsCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  prizeWheelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  prizeWheelContent: {
    alignItems: 'center',
  },
  prizeWheelStats: {
    alignItems: 'center',
    marginBottom: 15,
  },
  prizeWheelStatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  spinButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  spinButtonIcon: {
    marginRight: 8,
  },
  spinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingHeart: {
    position: 'absolute',
    zIndex: 1000,
  },
});