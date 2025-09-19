import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { authService } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

const INTERESTS = [
  'Sports', 'Food', 'Music', 'Art', 'Travel', 'Technology',
  'Reading', 'Movies', 'Gaming', 'Fitness', 'Photography', 'Cooking',
  'Dancing', 'Hiking', 'Volunteering', 'Study Groups'
];

const AVAILABILITY = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings'
];

const ProfileSetupScreen: React.FC<Props> = () => {
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleAvailability = (availability: string) => {
    setSelectedAvailability(prev =>
      prev.includes(availability)
        ? prev.filter(a => a !== availability)
        : [...prev, availability]
    );
  };

  const handleCompleteSetup = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Please select at least one interest');
      return;
    }

    if (selectedAvailability.length === 0) {
      Alert.alert('Error', 'Please select your availability');
      return;
    }

    if (!user) return;

    setIsLoading(true);

    try {
      const updatedUserData = {
        bio,
        interests: selectedInterests,
        availability: selectedAvailability,
      };

      await authService.updateUserProfile(user.id, updatedUserData);
      
      const updatedUser = { ...user, ...updatedUserData };
      dispatch(setUser(updatedUser));
    } catch (error: any) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help others get to know you better</Text>
        </View>

        <View style={styles.profileSection}>
          <ProfileAvatar
            photoUrl={user.photoUrl}
            name={user.name}
            size="large"
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Input
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
            style={styles.bioInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text style={styles.sectionSubtitle}>Select activities you enjoy</Text>
          <View style={styles.tagContainer}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.tag,
                  selectedInterests.includes(interest) && styles.tagSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[
                  styles.tagText,
                  selectedInterests.includes(interest) && styles.tagTextSelected,
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.sectionSubtitle}>When are you usually free?</Text>
          <View style={styles.tagContainer}>
            {AVAILABILITY.map((availability) => (
              <TouchableOpacity
                key={availability}
                style={[
                  styles.tag,
                  selectedAvailability.includes(availability) && styles.tagSelected,
                ]}
                onPress={() => toggleAvailability(availability)}
              >
                <Text style={[
                  styles.tagText,
                  selectedAvailability.includes(availability) && styles.tagTextSelected,
                ]}>
                  {availability}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Complete Setup"
          onPress={handleCompleteSetup}
          disabled={isLoading}
          style={styles.completeButton}
        />
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tagSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  tagTextSelected: {
    color: '#ffffff',
  },
  completeButton: {
    marginTop: 24,
  },
});

export default ProfileSetupScreen;