import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

// Conditional import for maps to handle native module issues
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('React Native Maps not available:', error);
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface MapLocationSelectorProps {
  visible: boolean;
  onLocationSelect: (location: { address: string; coordinates: { lat: number; lng: number } }) => void;
  onCancel: () => void;
  initialLocation?: { lat: number; lng: number };
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({
  visible,
  onLocationSelect,
  onCancel,
  initialLocation,
}) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setRegion({
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        updateLocationFromCoordinates(initialLocation.lat, initialLocation.lng);
        setIsLoading(false);
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        // Default to San Francisco
        setRegion({
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        updateLocationFromCoordinates(37.7749, -122.4194);
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

      // Get address for current location
      await updateLocationFromCoordinates(latitude, longitude);
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
      updateLocationFromCoordinates(37.7749, -122.4194);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocationFromCoordinates = async (lat: number, lng: number) => {
    try {
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const address = addressResult[0]
        ? [
            addressResult[0].name,
            addressResult[0].street,
            addressResult[0].city,
            addressResult[0].region,
            addressResult[0].country
          ].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setSelectedLocation({
        lat,
        lng,
        address,
      });
    } catch (error) {
      console.error('Error getting address:', error);
      setSelectedLocation({
        lat,
        lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    // Update selected location based on center of map
    updateLocationFromCoordinates(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No location selected', 'Please select a location first');
      return;
    }
    
    onLocationSelect({
      address: selectedLocation.address,
      coordinates: {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      },
    });
  };

  const handleCurrentLocationPress = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);
      await updateLocationFromCoordinates(latitude, longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !region) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Fallback UI if Maps is not available
  if (!MapView) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapFallbackContainer}>
            <Ionicons name="map-outline" size={64} color="#d1d5db" />
            <Text style={styles.mapFallbackTitle}>Map Not Available</Text>
            <Text style={styles.mapFallbackSubtitle}>
              Maps require additional setup for Expo development
            </Text>
            
            {selectedLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Selected Location:</Text>
                <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
                <Text style={styles.locationCoords}>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleCurrentLocationPress}
              style={styles.currentLocationFallbackButton}
            >
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.currentLocationFallbackText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={handleRegionChange}
            showsUserLocation
            showsMyLocationButton={false}
          />
          
          {/* Center pin */}
          <View style={styles.centerPin}>
            <Ionicons name="location" size={40} color={colors.primary} />
          </View>

          {/* Current location button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleCurrentLocationPress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {selectedLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Selected Location:</Text>
            <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
            <Text style={styles.locationCoords}>
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.gray100,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  confirmText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 16,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  locationCoords: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
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
  currentLocationFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentLocationFallbackText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default MapLocationSelector;