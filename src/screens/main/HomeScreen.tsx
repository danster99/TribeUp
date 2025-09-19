import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../utils/colors';
import { useDispatch, useSelector } from 'react-redux';
import SwipeCards from 'react-native-deck-swiper';
import ActivityCard from '../../components/activity/ActivityCard';
import { activityService } from '../../services/activityService';
import { setActivities, joinActivity } from '../../store/slices/activitiesSlice';
import { RootState } from '../../store';
import { Activity } from '../../types';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [cardIndex, setCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const swiperRef = useRef<any>(null);
  
  const dispatch = useDispatch();
  const { activities } = useSelector((state: RootState) => state.activities);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const fetchedActivities = await activityService.getActivities();
      
      //console.log('Fetched activities:', fetchedActivities);
      
      // Filter out activities user already joined or organized and validate data
      const filteredActivities = fetchedActivities.filter(activity => {
        // Basic validation
        if (!activity || !activity.id || !activity.title) {
          console.warn('Invalid activity data:', activity);
          return false;
        }
        
        const isOwnActivity = activity.organizerId === user?.id;
        const isParticipant = activity.participants && activity.participants.includes(user?.id || '');
        
        return !isOwnActivity && !isParticipant;
      });
      
      //console.log('Filtered activities:', filteredActivities);
      dispatch(setActivities(filteredActivities));
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeRight = async (cardIdx: number) => {
    const activity = activities[cardIdx];
    if (activity && user) {
      try {
        await activityService.joinActivity(activity.id, user.id);
        dispatch(joinActivity({ activityId: activity.id, userId: user.id }));
        Alert.alert('Success', `You've joined "${activity.title}"!`);
      } catch (error) {
        console.error('Error joining activity:', error);
        Alert.alert('Error', 'Failed to join activity');
      }
    }
  };

  const handleSwipeLeft = (cardIdx: number) => {
    console.log('Skipped activity:', activities[cardIdx]?.title);
  };

  const handleSwipedAll = () => {
    Alert.alert(
      'All caught up!',
      "You've seen all available activities. Check back later for new ones!",
      [{ text: 'Refresh', onPress: loadActivities }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No activities available</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new activities or create your own!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <SwipeCards
        ref={swiperRef}
        cards={activities}
        containerStyle={styles.swiperContainer}
        renderCard={(activity: Activity) => {
          if (!activity || typeof activity !== 'object') {
            return (
              <View style={styles.card}>
                <Text style={styles.loadingText}>Loading activity...</Text>
              </View>
            );
          }

          // Create a safe activity object with all required fields
          const safeActivity = {
            id: activity.id || '',
            title: activity.title || 'Untitled Activity',
            description: activity.description || 'No description',
            type: activity.type || 'General',
            date: activity.date || new Date(),
            location: activity.location || { address: 'Location not set', lat: 0, lng: 0 },
            maxParticipants: activity.maxParticipants || 10,
            participants: activity.participants || [],
            organizerId: activity.organizerId || '',
            imageUrls: activity.imageUrls || [],
            imageUrl: activity.imageUrl || null,
            imageBase64: activity.imageBase64 || undefined,
            imageMetadata: activity.imageMetadata || undefined,
            fee: activity.fee || 0,
            createdAt: activity.createdAt || new Date(),
          };

          // Restore full ActivityCard with safe structure
          return (
            <ActivityCard
              activity={safeActivity}
              showJoinButton={false}
              style={styles.card}
            />
          );
        }}
        onSwipedRight={handleSwipeRight}
        onSwipedLeft={handleSwipeLeft}
        onSwipedAll={handleSwipedAll}
        cardIndex={cardIndex}
        backgroundColor={'transparent'}
        stackSize={3}
        stackSeparation={15}
        animateOverlayLabelsOpacity={true}
        animateCardOpacity={true}
        swipeBackCard={true}
        useViewOverflow={false}
        verticalSwipe={false}
        horizontalSwipe={true}
        showSecondCard={true}
        disableBottomSwipe={true}
        disableTopSwipe={true}
        overlayLabels={{
          left: {
            title: '✖️ Skip',
            style: {
              label: {
                backgroundColor: '#FF0000',
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 'bold',
                padding: 20,
                borderRadius: 10,
              },
              wrapper: {
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 0, 0, 0.7)',
                borderRadius: 24,
                borderWidth: 10,
                borderColor: 'rgba(200, 0, 0, 1.0)',
                width: width - 32,
                height: height * 0.6,
                marginTop: 10,
                marginLeft: 0,
              },
            },
          },
          right: {
            title: '✅ Join',
            style: {
              label: {
                backgroundColor: '#00FF00',
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 'bold',
                padding: 20,
                borderRadius: 10,
              },
              wrapper: {
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 255, 0, 0.7)',
                borderRadius: 24,
                borderWidth: 10,
                borderColor: 'rgba(0, 200, 0, 1.0)',
                width: width - 32,
                height: height * 0.6,
                marginTop: 10,
                marginLeft: 0,
              },
            },
          },
        }}
      />

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          👈 Swipe left to skip • Swipe right to join 👉
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardContainer: {
    height: height - 200, // Fixed height to avoid overlapping tab bar
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden', // Prevent touch events from escaping
  },
  swiperContainer: {
    height: height * 0.7, // Specific height to prevent overflow
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none', // Allow touch events to pass through where there's no content
  },
  card: {
    width: width - 32,
    height: height * 0.6,
    borderRadius: 24,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HomeScreen;