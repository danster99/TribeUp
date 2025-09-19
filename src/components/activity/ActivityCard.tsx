import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity } from '../../types';
import Card from '../common/Card';
import { colors } from '../../utils/colors';
import { convertBase64StringToDataUri } from '../../utils/imageUtils';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  showJoinButton?: boolean;
  onJoin?: () => void;
  style?: any;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  showJoinButton = true,
  onJoin,
  style,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getActivityColor = (type: string) => {
    const typeKey = type?.toLowerCase() as keyof typeof colors;
    return colors[typeKey] || colors.primary;
  };

  const getActivityGradient = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'sports':
      case 'fitness':
        return [colors.sports, colors.error];
      case 'food':
      case 'cooking':
        return [colors.food, colors.warning];
      case 'music':
      case 'dancing':
        return [colors.music, colors.primaryLight];
      case 'art':
        return [colors.art, colors.secondary];
      case 'travel':
        return [colors.travel, colors.info];
      case 'technology':
        return [colors.technology, colors.success];
      case 'reading':
      case 'studygroups':
        return [colors.reading, colors.primary];
      default:
        return colors.gradients.primary;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not set';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Date not available';
    }
  };

  // Early return if activity is null/undefined or missing essential data
  if (!activity || typeof activity !== 'object') {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.content}>
          <Text style={styles.title}>Activity not found</Text>
          <Text style={styles.description}>This activity could not be loaded.</Text>
        </View>
      </Card>
    );
  }

  // Ensure all essential fields have safe values
  const safeTitle = activity.title || 'Untitled Activity';
  const safeDescription = activity.description || 'No description available';
  const safeType = activity.type || 'General';
  const safeParticipants = activity.participants || [];
  const safeMaxParticipants = activity.maxParticipants || 10;
  const safeLocation = activity.location || { address: 'Location not specified' };

  const spotsLeft = safeMaxParticipants - safeParticipants.length;
  
  // Get images array - support both old and new format
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

  const goToNextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const goToPrevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <Card style={[styles.container, style]}>
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        {/* Image section on top */}
        {images.length > 0 && (
          <View style={styles.imageSection}>
            <Image source={{ uri: images[currentImageIndex] }} style={styles.image} />
            
            
            {images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.imageNavButton, styles.prevButton]}
                  onPress={goToPrevImage}
                >
                  <Ionicons name="chevron-back" size={20} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.imageNavButton, styles.nextButton]}
                  onPress={goToNextImage}
                >
                  <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                </TouchableOpacity>
                
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {`${String(currentImageIndex + 1)}/${String(images.length)}`}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
        
        {/* Content section below image */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {safeTitle}
            </Text>
            <LinearGradient
              colors={getActivityGradient(safeType)}
              style={styles.typeContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.type}>
                {safeType}
              </Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {safeDescription}
          </Text>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={getActivityColor(safeType)} />
              <Text style={styles.detailText}>
                {String(formatDate(activity.date) || 'Date not available')}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={getActivityColor(safeType)} />
              <Text style={styles.detailText} numberOfLines={1}>
                {safeLocation.address}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={getActivityColor(safeType)} />
              <Text style={styles.detailText}>
                {`${String(safeParticipants.length)}/${String(safeMaxParticipants)} joined`}
              </Text>
            </View>
          </View>
          
          {activity.fee && activity.fee > 0 && (
            <View style={styles.feeContainer}>
              <Text style={styles.fee}>
                {`$${String(activity.fee)}`}
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <Text style={[
              styles.spotsLeft,
              spotsLeft === 0 && styles.spotsLeftFull
            ]}>
              {spotsLeft === 0 ? 'Full' : `${String(spotsLeft)} spots left`}
            </Text>
            
            {showJoinButton && spotsLeft > 0 && (
              <TouchableOpacity onPress={onJoin}>
                <LinearGradient
                  colors={getActivityGradient(safeType)}
                  style={styles.joinButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },
  prevButton: {
    left: 8,
  },
  nextButton: {
    right: 8,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  typeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  type: {
    fontSize: 11,
    color: colors.textWhite,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 2,
  },
  details: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  feeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  fee: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  spotsLeft: {
    fontSize: 15,
    color: colors.success,
    fontWeight: '700',
  },
  spotsLeftFull: {
    color: colors.error,
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButtonText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },
  content: {
    padding: 20,
  },
});

export default ActivityCard;