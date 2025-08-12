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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const [scaleAnimation] = useState(new Animated.Value(1));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      style={styles.statCardContainer}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.statCard,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <LinearGradient
          colors={[color, `${color}CC`]}
          style={styles.statCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statCardHeader}>
            <Ionicons name={icon} size={24} color="white" />
            <Text style={styles.statCardTitle}>{title}</Text>
          </View>
          <Text style={styles.statCardValue}>{value}</Text>
          {subtitle && (
            <Text style={styles.statCardSubtitle}>{subtitle}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { dashboardStats, fetchDashboardStats } = useData();
  const { relationshipInfo } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  const calculateDaysInRelationship = () => {
    if (!relationshipInfo?.anniversary) return 0;
    const anniversary = new Date(relationshipInfo.anniversary);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - anniversary.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="heart-circle" size={40} color="white" />
          <Text style={styles.headerTitle}>Our Love Story</Text>
          <Text style={styles.headerSubtitle}>
            {relationshipInfo?.partner1Name} & {relationshipInfo?.partner2Name}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Relationship Info */}
        {relationshipInfo && (
          <View style={styles.relationshipCard}>
            <Text style={styles.relationshipTitle}>Together Since</Text>
            <Text style={styles.relationshipDate}>
              {formatDate(relationshipInfo.anniversary)}
            </Text>
            <Text style={styles.relationshipDays}>
              {calculateDaysInRelationship()} days of love ❤️
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Photos"
            value={dashboardStats?.totalPhotos || 0}
            icon="images"
            color="#FF6B9D"
            subtitle="memories captured"
          />
          <StatCard
            title="Love Count"
            value={dashboardStats?.totalLove || 0}
            icon="heart"
            color="#C44569"
            subtitle="hearts shared"
          />
          <StatCard
            title="Memories"
            value={dashboardStats?.totalMemories || 0}
            icon="book"
            color="#F8B500"
            subtitle="special moments"
          />
          <StatCard
            title="Categories"
            value={dashboardStats?.totalCategories || 0}
            icon="folder"
            color="#6C5CE7"
            subtitle="photo collections"
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {dashboardStats?.recentPhotos && dashboardStats.recentPhotos.length > 0 ? (
            <View style={styles.activityCard}>
              <Ionicons name="camera" size={20} color="#FF6B9D" />
              <Text style={styles.activityText}>
                Latest photo uploaded {new Date(dashboardStats.recentPhotos[0].uploadDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {dashboardStats?.recentMemories && dashboardStats.recentMemories.length > 0 ? (
            <View style={styles.activityCard}>
              <Ionicons name="book" size={20} color="#F8B500" />
              <Text style={styles.activityText}>
                Latest memory: "{dashboardStats.recentMemories[0].title}"
              </Text>
            </View>
          ) : null}

          <View style={styles.activityCard}>
            <Ionicons name="heart" size={20} color="#C44569" />
            <Text style={styles.activityText}>
              Love counter at {dashboardStats?.totalLove || 0} hearts
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.actionButtonText}>Add Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#F8B500', '#FFA726']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="book" size={20} color="white" />
                <Text style={styles.actionButtonText}>New Memory</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  relationshipCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relationshipTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  relationshipDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  relationshipDays: {
    fontSize: 14,
    color: '#FF6B9D',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCardContainer: {
    width: (width - 50) / 2,
    marginBottom: 15,
  },
  statCard: {
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
  statCardGradient: {
    padding: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCardTitle: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activitySection: {
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});