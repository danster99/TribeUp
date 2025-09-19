import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { colors } from '../../utils/colors';
import CompactActivityCard from '../../components/activity/CompactActivityCard';
import { activityService } from '../../services/activityService';
import { Activity } from '../../types';

const { height } = Dimensions.get('window');

interface MyActivitiesScreenProps {
  navigation: any;
  route?: any;
}

const MyActivitiesScreen: React.FC<MyActivitiesScreenProps> = ({ navigation, route }) => {
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [loading, setLoading] = useState(true);
  
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadMyActivities();
  }, []);

  // Handle defaultTab parameter from navigation
  useEffect(() => {
    if (route?.params?.defaultTab) {
      setActiveTab(route.params.defaultTab);
    }
  }, [route?.params?.defaultTab]);

  // Refresh activities when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMyActivities();
    }, [])
  );

  const loadMyActivities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [created, joined] = await Promise.all([
        activityService.getUserActivities(user.id),
        activityService.getJoinedActivities(user.id)
      ]);
      
      setCreatedActivities(created);
      // Filter out activities created by the user from joined activities
      const joinedByOthers = joined.filter(activity => activity.organizerId !== user.id);
      setJoinedActivities(joinedByOthers);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityPress = (activity: Activity) => {
    navigation.navigate('ActivityDetails', { activityId: activity.id });
  };

  const handleLeaveActivity = async (activity: Activity) => {
    if (!user) return;
    
    Alert.alert(
      'Leave Activity',
      `Are you sure you want to leave "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await activityService.leaveActivity(activity.id, user.id);
              Alert.alert('Success', 'You have left the activity');
              loadMyActivities(); // Refresh the list
            } catch (error) {
              console.error('Error leaving activity:', error);
              Alert.alert('Error', 'Failed to leave activity');
            }
          }
        }
      ]
    );
  };

  const handleDeleteActivity = async (activity: Activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await activityService.deleteActivity(activity.id);
              loadMyActivities(); // Refresh the list
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', 'Failed to delete activity');
            }
          }
        }
      ]
    );
  };

  const renderActivities = () => {
    const activities = activeTab === 'created' ? createdActivities : joinedActivities;
    
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      );
    }
    
    if (activities.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>
            {activeTab === 'created' ? 'No activities created' : 'No activities joined'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'created' 
              ? 'Create your first activity to get started!' 
              : 'Join activities to see them here!'
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.activitiesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.activitiesContent}
      >
        {activities.map((activity) => (
          <CompactActivityCard
            key={activity.id}
            activity={activity}
            onPress={() => handleActivityPress(activity)}
            showCreatedActions={activeTab === 'created'}
            onActionPress={(action) => {
              if (action === 'view') {
                handleActivityPress(activity);
              } else if (action === 'delete') {
                handleDeleteActivity(activity);
              } else if (action === 'leave') {
                handleLeaveActivity(activity);
              }
            }}
            style={styles.activityCard}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'created' && styles.activeTab
          ]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'created' && styles.activeTabText
          ]}>
            Created ({createdActivities.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'joined' && styles.activeTab
          ]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'joined' && styles.activeTabText
          ]}>
            Joined ({joinedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {renderActivities()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height - 200, // Fixed height to avoid overlapping tab bar
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.textWhite,
  },
  activitiesList: {
    flex: 1,
  },
  activitiesContent: {
    paddingBottom: 100,
  },
  activityCard: {
    marginVertical: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MyActivitiesScreen;