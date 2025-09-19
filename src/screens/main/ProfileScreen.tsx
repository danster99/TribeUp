import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { activityService } from '../../services/activityService';
import { authService } from '../../services/authService';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { Activity } from '../../types';
import { colors } from '../../utils/colors';

const { height } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [created, joined] = await Promise.all([
        activityService.getUserActivities(user.id),
        activityService.getJoinedActivities(user.id),
      ]);
      
      setUserActivities(created);
      setJoinedActivities(joined.filter(activity => activity.organizerId !== user.id));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              dispatch(logout());
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getUpcomingActivities = (activities: Activity[]) => {
    const now = new Date();
    return activities.filter(activity => {
      const activityDate = activity.date.toDate ? activity.date.toDate() : new Date(activity.date);
      return activityDate > now;
    });
  };

  const getPastActivities = (activities: Activity[]) => {
    const now = new Date();
    return activities.filter(activity => {
      const activityDate = activity.date.toDate ? activity.date.toDate() : new Date(activity.date);
      return activityDate <= now;
    });
  };

  const getInterestColor = (interest: string) => {
    const interestKey = interest?.toLowerCase() as keyof typeof colors;
    return colors[interestKey] || colors.primary;
  };

  if (!user) return null;

  const upcomingCreated = getUpcomingActivities(userActivities);
  const pastCreated = getPastActivities(userActivities);
  const upcomingJoined = getUpcomingActivities(joinedActivities);
  const pastJoined = getPastActivities(joinedActivities);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.header}
        >
          <View style={styles.profileInfo}>
            <ProfileAvatar
              photoUrl={user.photoUrl}
              name={user.name}
              size="large"
              style={styles.avatar}
            />
            <Text style={styles.name}>{user.name}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{userActivities.length}</Text>
                <Text style={styles.statLabel}>Created</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{joinedActivities.length}</Text>
                <Text style={styles.statLabel}>Joined</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {upcomingCreated.length + upcomingJoined.length}
                </Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={colors.textWhite} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {user.interests.map((interest, index) => (
                <View key={index} style={[styles.interestTag, { backgroundColor: getInterestColor(interest) + '20', borderColor: getInterestColor(interest) }]}>
                  <Text style={[styles.interestText, { color: getInterestColor(interest) }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Availability */}
        {user.availability && user.availability.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityContainer}>
              {user.availability.map((time, index) => (
                <Text key={index} style={styles.availabilityText}>
                  • {time}
                </Text>
              ))}
            </View>
          </Card>
        )}

        {/* Upcoming Activities */}
        {(upcomingCreated.length > 0 || upcomingJoined.length > 0) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Activities</Text>
            
            {upcomingCreated.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('ActivityDetails', { activityId: activity.id })}
              >
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                  <View style={styles.activityBadge}>
                    <Text style={styles.organizerBadge}>Organizer</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            ))}

            {upcomingJoined.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('ActivityDetails', { activityId: activity.id })}
              >
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                  <View style={styles.activityBadge}>
                    <Text style={styles.participantBadge}>Participant</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Past Activities */}
        {(pastCreated.length > 0 || pastJoined.length > 0) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Past Activities</Text>
            
            {[...pastCreated, ...pastJoined]
              .sort((a, b) => {
                const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              })
              .slice(0, 5)
              .map((activity) => (
                <View key={activity.id} style={styles.pastActivityItem}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.pastActivityTitle}>{activity.title}</Text>
                    <Text style={styles.pastActivityDate}>{formatDate(activity.date)}</Text>
                  </View>
                  <View style={styles.activityBadge}>
                    <Text style={activity.organizerId === user.id ? styles.organizerBadge : styles.participantBadge}>
                      {activity.organizerId === user.id ? 'Organized' : 'Participated'}
                    </Text>
                  </View>
                </View>
              ))}

            {(pastCreated.length + pastJoined.length) > 5 && (
              <Text style={styles.moreActivitiesText}>
                And {(pastCreated.length + pastJoined.length) - 5} more activities
              </Text>
            )}
          </Card>
        )}

        {/* Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />

        <View style={styles.footer}>
          <Text style={styles.versionText}>TribeUp v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height - 200, // Fixed height to avoid overlapping tab bar
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: 'relative',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    opacity: 0.9,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textWhite,
    marginTop: 4,
    opacity: 0.8,
  },
  editButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 12,
    color: colors.textWhite,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availabilityContainer: {
    gap: 4,
  },
  availabilityText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pastActivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    opacity: 0.7,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pastActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pastActivityDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  activityBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  organizerBadge: {
    fontSize: 10,
    color: colors.success,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  participantBadge: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  moreActivitiesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderColor: colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: colors.textLight,
  },
});

export default ProfileScreen;