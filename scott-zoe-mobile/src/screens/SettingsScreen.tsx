import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  color?: string;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  color = '#666',
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightElement}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const { logout, relationshipInfo } = useAuth();
  const { clearCache } = useData();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await clearCache();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    const email = 'support@scottzoe.com';
    const subject = 'Scott & Zoe App Support';
    const body = 'Hi, I need help with the Scott & Zoe app.';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleRateApp = () => {
    // In a real app, this would open the app store
    Alert.alert(
      'Rate Our App',
      'Thank you for using Scott & Zoe! We appreciate your feedback.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    const url = 'https://scottzoe.com/privacy';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open privacy policy');
    });
  };

  const handleTermsOfService = () => {
    const url = 'https://scottzoe.com/terms';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open terms of service');
    });
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={32} color="white" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Relationship Info */}
        {relationshipInfo && (
          <Section title="Relationship">
            <SettingItem
              icon="heart-circle"
              title="Anniversary"
              subtitle={formatDate(relationshipInfo.anniversary)}
              color="#FF6B9D"
              showArrow={false}
            />
            <SettingItem
              icon="people"
              title="Partners"
              subtitle={`${relationshipInfo.partner1Name} & ${relationshipInfo.partner2Name}`}
              color="#C44569"
              showArrow={false}
            />
          </Section>
        )}

        {/* App Preferences */}
        <Section title="Preferences">
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Receive love reminders"
            color="#F8B500"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#ccc', true: '#FF6B9D' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="phone-portrait"
            title="Haptic Feedback"
            subtitle="Feel the love with vibrations"
            color="#6C5CE7"
            rightElement={
              <Switch
                value={hapticFeedback}
                onValueChange={(value) => {
                  setHapticFeedback(value);
                  if (value) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                trackColor={{ false: '#ccc', true: '#FF6B9D' }}
                thumbColor={hapticFeedback ? '#fff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </Section>

        {/* Data Management */}
        <Section title="Data">
          <SettingItem
            icon="refresh"
            title="Refresh Data"
            subtitle="Sync with server"
            color="#74B9FF"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Refresh all data
              Alert.alert('Success', 'Data refreshed successfully');
            }}
          />
          <SettingItem
            icon="trash"
            title="Clear Cache"
            subtitle="Free up storage space"
            color="#FD79A8"
            onPress={handleClearCache}
          />
        </Section>

        {/* Support & Feedback */}
        <Section title="Support">
          <SettingItem
            icon="mail"
            title="Contact Support"
            subtitle="Get help with the app"
            color="#00B894"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="star"
            title="Rate Our App"
            subtitle="Share your love"
            color="#FDCB6E"
            onPress={handleRateApp}
          />
          <SettingItem
            icon="chatbubbles"
            title="Send Feedback"
            subtitle="Help us improve"
            color="#A29BFE"
            onPress={() => {
              Alert.alert(
                'Feedback',
                'Thank you for your interest in providing feedback! Please contact us at feedback@scottzoe.com'
              );
            }}
          />
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <SettingItem
            icon="document-text"
            title="Privacy Policy"
            subtitle="How we protect your data"
            color="#636E72"
            onPress={handlePrivacyPolicy}
          />
          <SettingItem
            icon="document"
            title="Terms of Service"
            subtitle="App usage terms"
            color="#636E72"
            onPress={handleTermsOfService}
          />
        </Section>

        {/* App Info */}
        <Section title="About">
          <SettingItem
            icon="information-circle"
            title="App Version"
            subtitle="1.0.0"
            color="#2D3436"
            showArrow={false}
          />
          <SettingItem
            icon="code"
            title="Build"
            subtitle="React Native Expo"
            color="#2D3436"
            showArrow={false}
          />
        </Section>

        {/* Account Actions */}
        <Section title="Account">
          <SettingItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            color="#E17055"
            onPress={handleLogout}
          />
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for Scott & Zoe</Text>
          <Text style={styles.footerSubtext}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
  },
});