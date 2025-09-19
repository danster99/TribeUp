import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
// import { typography, spacing, shadows, borderRadius } from '../../utils/typography';

const { height } = Dimensions.get('window');

const ComingSoonScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="rocket-outline" size={80} color={colors.primary} />
        </View>
        
        <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
        <Text style={styles.comingSoonSubtitle}>
          We're working on an amazing new feature that will enhance your TribeUp experience.
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Enhanced user experience</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="flash-outline" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Improved performance</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="heart-outline" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Better connections</Text>
          </View>
        </View>

        <Text style={styles.stayTunedText}>Stay tuned for updates!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height - 200, // Fixed height to avoid overlapping tab bar
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  comingSoonTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '800',
  },
  comingSoonSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textPrimary,
    marginLeft: 16,
    fontWeight: '500',
    flex: 1,
  },
  stayTunedText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.textLight,
    textAlign: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ComingSoonScreen;