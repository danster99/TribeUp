import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
// import { typography, spacing, shadows } from '../../utils/typography';
import ProfileHeaderButton from './ProfileHeaderButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  gradient?: string[];
  style?: any;
  children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showProfile = true,
  gradient = colors.gradients.primary,
  style,
  children
}) => {
  return (
    <LinearGradient
      colors={gradient}
      style={[styles.header, style]}
    >
      {showProfile && (
        <ProfileHeaderButton style={styles.profileButton} />
      )}
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        {children}
      </View>
      <View style={styles.headerSpacer} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 52, // Account for status bar + modern spacing
    minHeight: 120,
  },
  profileButton: {
    position: 'absolute',
    top: 44, // Status bar safe area
    right: 24,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 40, // Balance the profile button width
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.textWhite,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textWhite,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ScreenHeader;