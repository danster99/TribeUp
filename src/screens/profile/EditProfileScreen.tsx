import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { authService } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const INTERESTS = [
  'Sports', 'Food', 'Music', 'Art', 'Travel', 'Technology',
  'Reading', 'Movies', 'Gaming', 'Fitness', 'Photography', 'Cooking',
  'Dancing', 'Hiking', 'Volunteering', 'Study Groups'
];

const AVAILABILITY = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings'
];

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(user?.availability || []);
  const [isLoading, setIsLoading] = useState(false);

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

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Please select at least one interest');
      return false;
    }

    if (selectedAvailability.length === 0) {
      Alert.alert('Error', 'Please select your availability');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);

    try {
      const updatedData = {
        name: name.trim(),
        bio: bio.trim(),
        interests: selectedInterests,
        availability: selectedAvailability,
      };

      await authService.updateUserProfile(user.id, updatedData);
      
      const updatedUser = { ...user, ...updatedData };
      dispatch(setUser(updatedUser));

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>Update your profile information</Text>
        </View>

        <View style={styles.profileSection}>
          <ProfileAvatar
            photoUrl={user.photoUrl}
            name={user.name}
            size="large"
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
            style={styles.bioInput}
          />

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

          <View style={styles.buttons}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            />

            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
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
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 16,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
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
  buttons: {
    marginTop: 24,
    gap: 16,
  },
  saveButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});

export default EditProfileScreen;