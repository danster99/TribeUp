import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>TribeUp</Text>
          <Text style={styles.subtitle}>Discover activities, meet new people</Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Discover Activities</Text>
            <Text style={styles.featureDescription}>
              Find interesting activities and events happening near you
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureTitle}>Meet New People</Text>
            <Text style={styles.featureDescription}>
              Connect with like-minded individuals and form temporary tribes
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Group Chat</Text>
            <Text style={styles.featureDescription}>
              Chat with activity participants before and during events
            </Text>
          </View>
        </View>
        
        <View style={styles.buttons}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Signup')}
            size="large"
            style={styles.primaryButton}
          />
          
          <Button
            title="Already have an account? Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="large"
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
  },
  feature: {
    alignItems: 'center',
    marginBottom: 40,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    marginTop: 40,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    marginBottom: 24,
  },
});

export default OnboardingScreen;