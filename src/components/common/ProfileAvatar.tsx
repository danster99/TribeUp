import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface ProfileAvatarProps {
  photoUrl?: string;
  name: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoUrl,
  name,
  size = 'medium',
  style,
}) => {
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyles = styles[size];

  return (
    <View style={[styles.container, sizeStyles, style]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={[styles.image, sizeStyles]} />
      ) : (
        <View style={[styles.placeholder, sizeStyles]}>
          <Text style={[styles.initials, styles[`${size}Text`]]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 50,
  },
  placeholder: {
    backgroundColor: '#6366f1',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 80,
    height: 80,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 24,
  },
});

export default ProfileAvatar;