import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Conditional import for maps to handle native module issues
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('React Native Maps not available:', error);
}
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { activityService } from '../../services/activityService';
import { setNearbyActivities } from '../../store/slices/activitiesSlice';
import { RootState } from '../../store';
import { Activity } from '../../types';
import ActivityCard from '../../components/activity/ActivityCard';
import ProfileHeaderButton from '../../components/common/ProfileHeaderButton';
import { colors } from '../../utils/colors';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MapScreen: React.FC = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const dispatch = useDispatch();
  const { nearbyActivities } = useSelector((state: RootState) => state.activities);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (region) {
      loadNearbyActivities(region.latitude, region.longitude);
    }
  }, [region]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        // Default to a general location (e.g., San Francisco)
        setRegion({
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location');
      // Fallback to default location
      setRegion({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadNearbyActivities = async (lat: number, lng: number) => {
    try {
      const activities = await activityService.getNearbyActivities(lat, lng, 25); // 25km radius
      
      // Filter out user's own activities and already joined ones
      const filteredActivities = activities.filter(activity => 
        activity.organizerId !== user?.id
      );
      
      dispatch(setNearbyActivities(filteredActivities));
    } catch (error) {
      console.error('Error loading nearby activities:', error);
    }
  };

  const handleMarkerPress = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleJoinActivity = async (activity: Activity) => {
    if (!user) return;

    try {
      await activityService.joinActivity(activity.id, user.id);
      Alert.alert('Success', `You've joined "${activity.title}"!`);
      setSelectedActivity(null);
      // Refresh activities
      if (region) {
        loadNearbyActivities(region.latitude, region.longitude);
      }
    } catch (error) {
      console.error('Error joining activity:', error);
      Alert.alert('Error', 'Failed to join activity');
    }
  };

  const getMarkerColor = (activityType: string): string => {
    const typeKey = activityType?.toLowerCase() as keyof typeof colors;
    return colors[typeKey] || colors.primary;
  };

  if (isLoading || !region) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback UI if Maps is not available
  if (!MapView) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={colors.gradients.ocean}
          style={styles.header}
        >
          <Text style={styles.title}>Nearby Activities</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => region && loadNearbyActivities(region.latitude, region.longitude)}
          >
            <Ionicons name="refresh" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </LinearGradient>
        
        <View style={styles.mapFallbackContainer}>
          <Ionicons name="map-outline" size={64} color="#d1d5db" />
          <Text style={styles.mapFallbackTitle}>Map Not Available</Text>
          <Text style={styles.mapFallbackSubtitle}>
            Maps require additional setup for Expo development
          </Text>
          
          {nearbyActivities.length > 0 && (
            <View style={styles.activitiesList}>
              <Text style={styles.activitiesListTitle}>Nearby Activities:</Text>
              {nearbyActivities.slice(0, 5).map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityListItem}
                  onPress={() => handleMarkerPress(activity)}
                >
                  <Text style={styles.activityListTitle}>{activity.title}</Text>
                  <Text style={styles.activityListLocation}>{activity.location.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.ocean}
        style={styles.header}
      >
        <ProfileHeaderButton style={styles.profileButton} />
        <Text style={styles.title}>Nearby Activities</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => region && loadNearbyActivities(region.latitude, region.longitude)}
        >
          <Ionicons name="refresh" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </LinearGradient>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {nearbyActivities.map((activity) => (
          <Marker
            key={activity.id}
            coordinate={{
              latitude: activity.location.lat,
              longitude: activity.location.lng,
            }}
            title={activity.title}
            description={activity.description}
            pinColor={getMarkerColor(activity.type)}
            onPress={() => handleMarkerPress(activity)}
          />
        ))}
      </MapView>

      {selectedActivity && (
        <View style={styles.bottomSheet}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedActivity(null)}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <ActivityCard
            activity={selectedActivity}
            onJoin={() => handleJoinActivity(selectedActivity)}
            showJoinButton={
              !selectedActivity.participants.includes(user?.id || '') &&
              selectedActivity.participants.length < selectedActivity.maxParticipants
            }
            style={styles.activityCard}
          />
        </View>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Activity Types</Text>
        <View style={styles.legendItems}>
          {['Sports', 'Food', 'Music', 'Technology'].map((type) => (
            <View key={type} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getMarkerColor(type) }
                ]}
              />
              <Text style={styles.legendText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  profileButton: {
    position: 'absolute',
    left: 24,
    zIndex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '50%',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: colors.gray100,
    borderRadius: 20,
    padding: 8,
  },
  activityCard: {
    marginHorizontal: 0,
    marginVertical: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0,
  },
  legend: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mapFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mapFallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  mapFallbackSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  activitiesList: {
    width: '100%',
    maxWidth: 300,
  },
  activitiesListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  activityListItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  activityListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activityListLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default MapScreen;