import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import ProfileHeaderButton from './ProfileHeaderButton';

interface DiscreteHeaderProps {
  title: string;
  navigation?: any;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const DiscreteHeader: React.FC<DiscreteHeaderProps> = ({ title, navigation, showBackButton, onBackPress }) => {
  return (
    <View style={styles.container}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButtonContainer} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.profileButtonContainer}>
          <ProfileHeaderButton
            size="small"
            navigation={navigation}
          />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 48, // Compact but usable height
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  profileButtonContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  emptySpace: {
    width: 40,
  },
  backButtonContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export default DiscreteHeader;