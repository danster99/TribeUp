import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../utils/colors';
// import { shadows } from '../../utils/typography';
import ProfileAvatar from './ProfileAvatar';

interface ProfileHeaderButtonProps {
  size?: 'small' | 'medium';
  style?: any;
  navigation?: any;
}

const ProfileHeaderButton: React.FC<ProfileHeaderButtonProps> = ({
  size = 'small',
  style,
  navigation
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const handlePress = () => {
    if (navigation) {
      navigation.navigate('Profile');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <ProfileAvatar
        photoUrl={user.photoUrl}
        name={user.displayName || user.email || 'User'}
        size={size}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ProfileHeaderButton;