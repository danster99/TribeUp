import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { activityService } from '../../services/activityService';
import { joinActivity, leaveActivity } from '../../store/slices/activitiesSlice';
import { RootState } from '../../store';
import { Activity, RootStackParamList } from '../../types';
import { colors } from '../../utils/colors';
import Button from '../../components/common/Button';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import Card from '../../components/common/Card';
import DiscreteHeader from '../../components/common/DiscreteHeader';
import { convertBase64StringToDataUri } from '../../utils/imageUtils';
import { getCurrencyForLocation } from '../../utils/currencyUtils';

const { height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetails'>;

const ActivityDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      const activityData = await activityService.getActivity(activityId);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading activity:', error);
      Alert.alert('Error', 'Failed to load activity details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    if (!activity || !user) return;

    if (activity.participants.length >= activity.maxParticipants) {
      Alert.alert('Activity Full', 'This activity is already at maximum capacity');
      return;
    }

    setActionLoading(true);

    try {
      await activityService.joinActivity(activity.id, user.id);
      dispatch(joinActivity({ activityId: activity.id, userId: user.id }));
      
      // Update local state
      setActivity(prev => prev ? {
        ...prev,
        participants: [...prev.participants, user.id]
      } : null);

      Alert.alert('Success', `You've joined "${activity.title}"!`);
    } catch (error) {
      console.error('Error joining activity:', error);
      Alert.alert('Error', 'Failed to join activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveActivity = async () => {
    if (!activity || !user) return;

    Alert.alert(
      'Leave Activity',
      'Are you sure you want to leave this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await activityService.leaveActivity(activity.id, user.id);
              dispatch(leaveActivity({ activityId: activity.id, userId: user.id }));
              
              // Update local state
              setActivity(prev => prev ? {
                ...prev,
                participants: prev.participants.filter(id => id !== user.id)
              } : null);

              Alert.alert('Left Activity', 'You have left the activity');
            } catch (error) {
              console.error('Error leaving activity:', error);
              Alert.alert('Error', 'Failed to leave activity');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = () => {
    if (!activity) return;
    
    navigation.navigate('Chat', {
      activityId: activity.id,
      activityTitle: activity.title,
    });
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToImage = (index: number) => {
    const imageWidth = width - 32; // Account for lateral padding
    scrollViewRef.current?.scrollTo({
      x: index * imageWidth,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageWidth = width - 32;
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentImageIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity details...</Text>
        </View>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Activity not found</Text>
        </View>
      </View>
    );
  }

  const isOrganizer = activity.organizerId === user?.id;
  const isParticipant = user ? activity.participants.includes(user.id) : false;
  const canJoin = !isOrganizer && !isParticipant && activity.participants.length < activity.maxParticipants;
  const spotsLeft = activity.maxParticipants - activity.participants.length;

  const handleBackPress = () => {
    // Navigate back to the appropriate section in MyActivities
    if (isOrganizer) {
      // User came from created activities - navigate to MyActivities with created tab
      navigation.navigate('MyActivities', { defaultTab: 'created' });
    } else if (isParticipant) {
      // User came from joined activities - navigate to MyActivities with joined tab
      navigation.navigate('MyActivities', { defaultTab: 'joined' });
    } else {
      // User came from somewhere else (like Home) - just go back
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>

        {/* Image Gallery */}
        {(() => {
          // Support both new base64 and legacy URL formats
          const getImageSources = () => {
            // Priority: new base64 images -> legacy imageUrls -> legacy imageUrl
            if (activity.imageBase64 && activity.imageBase64.length > 0 && activity.imageMetadata) {
              return activity.imageBase64.map((base64, index) => {
                const metadata = activity.imageMetadata![index];
                return convertBase64StringToDataUri(base64, metadata.mimeType);
              });
            }
            return activity.imageUrls || (activity.imageUrl ? [activity.imageUrl] : []);
          };

          const images = getImageSources();
          if (images.length === 0) return null;
          
          return (
            <View style={styles.imageGallery}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
              >
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.headerImage} />
                  </View>
                ))}
              </ScrollView>
              
              {images.length > 1 && (
                <>
                  {/* Navigation Arrows */}
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.prevButton]}
                    onPress={() => {
                      const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
                      setCurrentImageIndex(newIndex);
                      scrollToImage(newIndex);
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.nextButton]}
                    onPress={() => {
                      const newIndex = (currentImageIndex + 1) % images.length;
                      setCurrentImageIndex(newIndex);
                      scrollToImage(newIndex);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  
                  {/* Image Counter */}
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1} / {images.length}
                    </Text>
                  </View>
                  
                  {/* Dot Indicators */}
                  <View style={styles.imageIndicators}>
                    {images.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentImageIndex && styles.activeIndicator
                        ]}
                        onPress={() => {
                          setCurrentImageIndex(index);
                          scrollToImage(index);
                        }}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })()}

        <View style={styles.content}>
          {/* Key Details */}
          <Card style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Text style={styles.titleText}>{activity.title}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
              <Text style={styles.detailText}>{formatDate(activity.date)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#6366f1" />
              <Text style={styles.detailText}>
                {activity.isOnline ? 'Online Activity' : activity.location?.address || 'Location not specified'}
              </Text>
            </View>

            {activity.fee && activity.fee > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="card" size={20} color="#6366f1" />
                <Text style={styles.detailText}>
                  {getCurrencyForLocation(activity.location?.address || '')}{activity.fee}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color="#6366f1" />
              <Text style={styles.detailText}>
                {activity.participants.length}/{activity.maxParticipants} participants
              </Text>
              {spotsLeft > 0 && (
                <Text style={styles.spotsLeftText}>
                  ({spotsLeft} spots left)
                </Text>
              )}
            </View>
          </Card>

          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>About this activity</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </Card>

          {/* Participants */}
          <Card style={styles.participantsCard}>
            <Text style={styles.sectionTitle}>
              Participants ({activity.participants.length})
            </Text>
            
            <View style={styles.participantsList}>
              {activity.participants.slice(0, 8).map((participantId, index) => (
                <View key={participantId} style={styles.participantItem}>
                  <ProfileAvatar
                    photoUrl={undefined}
                    name={`Participant ${index + 1}`}
                    size="medium"
                  />
                  <Text style={styles.participantName}>
                    {participantId === activity.organizerId ? 'Organizer' : `Member ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>

            {activity.participants.length > 8 && (
              <Text style={styles.moreParticipantsText}>
                +{activity.participants.length - 8} more participants
              </Text>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {canJoin && (
              <Button
                title="Join Activity"
                onPress={handleJoinActivity}
                disabled={actionLoading}
                size="large"
                style={styles.actionButton}
              />
            )}

            {isParticipant && !isOrganizer && (
              <>
                <Button
                  title="Open Group Chat"
                  onPress={handleOpenChat}
                  size="large"
                  style={styles.actionButton}
                />
                <Button
                  title="Leave Activity"
                  onPress={handleLeaveActivity}
                  disabled={actionLoading}
                  variant="outline"
                  size="large"
                  style={styles.leaveButton}
                />
              </>
            )}

            {isOrganizer && (
              <>
                <Button
                  title="Open Group Chat"
                  onPress={handleOpenChat}
                  size="large"
                  style={styles.actionButton}
                />
                <Button
                  title="Edit Activity"
                  onPress={() => navigation.navigate('EditActivity', { activityId: activity.id })}
                  variant="outline"
                  size="large"
                  style={styles.actionButton}
                />
              </>
            )}

            {!canJoin && !isParticipant && !isOrganizer && (
              <View style={styles.unavailableContainer}>
                <Text style={styles.unavailableText}>
                  {spotsLeft === 0 ? 'Activity is full' : 'Activity unavailable'}
                </Text>
              </View>
            )}
          </View>
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
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  imageGallery: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    width: Dimensions.get('window').width - 32,
    marginHorizontal: 0,
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  typeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  type: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
    flex: 1,
  },
  spotsLeftText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  descriptionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  participantsCard: {
    marginBottom: 24,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  participantItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  participantName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  moreParticipantsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
  leaveButton: {
    borderColor: '#ef4444',
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  unavailableText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default ActivityDetailsScreen;