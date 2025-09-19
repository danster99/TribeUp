import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { activityService } from '../../services/activityService';
import { chatService } from '../../services/chatService';
import { setMessages, setUnreadCounts } from '../../store/slices/chatSlice';
import { RootState } from '../../store';
import { Activity } from '../../types';
import Card from '../../components/common/Card';

const { height } = Dimensions.get('window');

interface MessagesScreenProps {
  navigation: any;
  route?: any;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCounts } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    loadJoinedActivities();
  }, []);

  // Refresh unread counts when screen comes into focus (after returning from chat)
  useEffect(() => {
    const refreshUnreadCounts = async () => {
      if (user && joinedActivities.length > 0) {
        const activityIds = joinedActivities.map(activity => activity.id);
        const unreadCounts = await chatService.getUnreadCounts(activityIds, user.id);
        dispatch(setUnreadCounts(unreadCounts));
      }
    };

    // Create a navigation listener that refreshes counts when returning to this screen
    const unsubscribe = navigation?.addListener('focus', refreshUnreadCounts);

    return unsubscribe;
  }, [user, joinedActivities, navigation, dispatch]);

  // Start periodic check after activities are loaded (only once)
  useEffect(() => {
    if (user && joinedActivities.length > 0 && !checkIntervalRef.current) {
      checkIntervalRef.current = setInterval(() => {
        checkForNewMessages();
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, joinedActivities.length]); // Use length instead of array to prevent excessive updates

  const checkForNewMessages = async () => {
    if (!user || joinedActivities.length === 0) return;


    // Check messages for each joined activity
    for (const activity of joinedActivities) {
      try {
        const messages = await chatService.getMessages(activity.id);
        dispatch(setMessages({ activityId: activity.id, messages }));
      } catch (error) {
        console.error(`Error checking messages for activity ${activity.id}:`, error);
      }
    }
  };

  const loadJoinedActivities = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const activities = await activityService.getJoinedActivities(user.id);

      // Filter out past activities (older than 24 hours after the event)
      const now = new Date();
      const activeActivities = activities.filter(activity => {
        const activityDate = activity.date.toDate ? activity.date.toDate() : new Date(activity.date);
        const dayAfterActivity = new Date(activityDate.getTime() + 24 * 60 * 60 * 1000);
        return dayAfterActivity > now;
      });

      setJoinedActivities(activeActivities);

      // Load unread counts for all activities
      if (activeActivities.length > 0) {
        const activityIds = activeActivities.map(activity => activity.id);
        const unreadCounts = await chatService.getUnreadCounts(activityIds, user.id);
        dispatch(setUnreadCounts(unreadCounts));
      }
    } catch (error) {
      console.error('Error loading joined activities:', error);
      Alert.alert('Error', 'Failed to load your activities');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48 && diffInHours > 24) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const navigateToChat = (activity: Activity) => {
    navigation.navigate('Chat', {
      activityId: activity.id,
      activityTitle: activity.title,
    });
  };

  const renderActivity = ({ item: activity }: { item: Activity }) => {
    const unreadCount = unreadCounts[activity.id] || 0;

    return (
      <TouchableOpacity onPress={() => navigateToChat(activity)}>
        <Card style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
              <Text style={styles.activityLocation}>{activity.location.address}</Text>
            </View>

            <View style={styles.activityMeta}>
              <View style={styles.participantsBadge}>
                <Ionicons name="people" size={12} color="#6b7280" />
                <Text style={styles.participantsText}>
                  {activity.participants.length}
                </Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          </View>

          <View style={styles.activityType}>
            <Text style={styles.typeText}>{activity.type}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No active conversations</Text>
      <Text style={styles.emptySubtitle}>
        Join activities to start chatting with other participants
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.exploreButtonText}>Explore Activities</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={joinedActivities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          joinedActivities.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
    marginRight: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityMeta: {
    alignItems: 'center',
    gap: 8,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  activityType: {
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessagesScreen;