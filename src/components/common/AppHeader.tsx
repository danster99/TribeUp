import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import ProfileHeaderButton from './ProfileHeaderButton';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showProfileButton?: boolean;
  gradient?: string[];
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  showProfileButton = true,
  gradient = colors.gradients.sunset
}) => {
  return (
    <View style={styles.header}>
      {/* Left side - Back button or spacer */}
      <View style={styles.leftContainer}>
        {showBackButton && onBackPress ? (
          <LinearGradient
            colors={gradient}
            style={styles.backButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity 
              style={styles.buttonTouchable}
              onPress={onBackPress}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* Center - Title and subtitle */}
      <View style={styles.centerContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right side - Profile button or spacer */}
      <View style={styles.rightContainer}>
        {showProfileButton ? (
          <LinearGradient
            colors={gradient}
            style={styles.profileButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ProfileHeaderButton style={styles.profileButton} />
          </LinearGradient>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingTop: 52,
    minHeight: 120,
    backgroundColor: colors.white,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonTouchable: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  profileButton: {
    margin: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default AppHeader;