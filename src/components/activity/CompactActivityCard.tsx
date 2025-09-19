import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity } from '../../types';
import { colors } from '../../utils/colors';
import { convertBase64StringToDataUri } from '../../utils/imageUtils';

interface CompactActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  onActionPress?: (action: 'view' | 'delete' | 'leave') => void;
  showCreatedActions?: boolean;
  style?: any;
}

const CompactActivityCard: React.FC<CompactActivityCardProps> = ({
  activity,
  onPress,
  onActionPress,
  showCreatedActions = false,
  style,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not set';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Date not available';
    }
  };

  const getActivityColor = (type: string) => {
    const typeKey = type?.toLowerCase() as keyof typeof colors;
    return colors[typeKey] || colors.primary;
  };

  // Ensure all essential fields have safe values
  const safeTitle = activity.title || 'Untitled Activity';
  const safeType = activity.type || 'General';
  const safeParticipants = activity.participants || [];
  const safeMaxParticipants = activity.maxParticipants || 10;

  // Get first image - support both old and new format
  const getFirstImage = () => {
    // Priority: new base64 images -> legacy imageUrls -> legacy imageUrl
    if (activity.imageBase64 && activity.imageBase64.length > 0 && activity.imageMetadata) {
      const base64 = activity.imageBase64[0];
      const metadata = activity.imageMetadata[0];
      return convertBase64StringToDataUri(base64, metadata.mimeType);
    }
    const legacyImages = activity.imageUrls || (activity.imageUrl ? [activity.imageUrl] : []);
    return legacyImages[0];
  };

  const firstImage = getFirstImage();

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Larger Image on Left */}
        <View style={styles.imageContainer}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.image} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: getActivityColor(safeType) + '20' }]}>
              <Ionicons 
                name="image-outline" 
                size={36} 
                color={getActivityColor(safeType)} 
              />
            </View>
          )}
        </View>

        {/* Activity Info and Small Buttons on Right */}
        <View style={styles.rightContainer}>
          {/* Activity Info */}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={2}>
                {safeTitle}
              </Text>
              <LinearGradient
                colors={[getActivityColor(safeType), getActivityColor(safeType) + 'CC']}
                style={styles.typeContainer}
              >
                <Text style={styles.type}>
                  {safeType}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {formatDate(activity.date)}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {`${safeParticipants.length}/${safeMaxParticipants} joined`}
                </Text>
              </View>
            </View>
          </View>

          {/* Small Action Buttons on Right */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => onActionPress?.('view')}
            >
              <Ionicons name="eye-outline" size={14} color={colors.primary} />
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            
            {showCreatedActions ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onActionPress?.('delete')}
              >
                <Ionicons name="trash-outline" size={14} color={colors.error} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={() => onActionPress?.('leave')}
              >
                <Ionicons name="exit-outline" size={14} color={colors.textWhite} />
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  typeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  type: {
    fontSize: 10,
    color: colors.textWhite,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
    minWidth: 70,
  },
  viewButton: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  viewButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.error,
  },
  leaveButtonText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CompactActivityCard;