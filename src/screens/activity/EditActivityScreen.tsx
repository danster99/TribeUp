import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import MapLocationSelector from '../../components/common/MapLocationSelector';
import { activityService } from '../../services/activityService';
import { updateActivity } from '../../store/slices/activitiesSlice';
import { RootState } from '../../store';
import { RootStackParamList } from '../../types';
import { colors } from '../../utils/colors';
import { compressAndConvertImage, convertBase64ToDataUri, convertBase64StringToDataUri, ImageData } from '../../utils/imageUtils';
import { getCurrencyForLocation } from '../../utils/currencyUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'EditActivity'>;

const ACTIVITY_TYPES = [
  'Sports', 'Food', 'Music', 'Art', 'Travel', 'Technology',
  'Reading', 'Movies', 'Gaming', 'Fitness', 'Photography', 'Cooking',
  'Dancing', 'Hiking', 'Volunteering', 'Study Groups', 'Other'
];

const EditActivityScreen: React.FC<Props> = ({ navigation, route }) => {
  const { activityId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [fee, setFee] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [currency, setCurrency] = useState('$');

  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      setIsLoadingActivity(true);
      const activity = await activityService.getActivity(activityId);
      
      if (activity) {
        setTitle(activity.title || '');
        setDescription(activity.description || '');
        setSelectedType(activity.type || '');
        
        // Convert Firebase timestamp to Date
        const activityDate = activity.date?.toDate ? activity.date.toDate() : new Date(activity.date);
        setDate(activityDate);
        
        setMaxParticipants(String(activity.maxParticipants || 10));
        const activityLocation = activity.location?.address || '';
        setLocation(activityLocation);
        setCurrency(getCurrencyForLocation(activityLocation));
        setCoordinates(activity.location ? { lat: activity.location.lat, lng: activity.location.lng } : null);
        setFee(activity.fee ? String(activity.fee) : '');
        setIsOnline(activity.isOnline || false);
        
        // Handle both new base64 and legacy image formats
        if (activity.imageBase64 && activity.imageBase64.length > 0 && activity.imageMetadata) {
          // Convert base64 data back to ImageData format for editing
          const imageDataArray = activity.imageBase64.map((base64, index) => ({
            id: activity.imageMetadata![index].id,
            base64,
            mimeType: activity.imageMetadata![index].mimeType,
            originalName: activity.imageMetadata![index].originalName || ''
          }));
          setSelectedImages(imageDataArray);
        } else {
          // Legacy format - no images for editing yet (would need conversion)
          setSelectedImages([]);
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      Alert.alert('Error', 'Failed to load activity details');
      navigation.goBack();
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    const typeKey = type?.toLowerCase() as keyof typeof colors;
    return colors[typeKey] || colors.primary;
  };


  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to photos to add an image');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedImages.length, // Allow selection up to remaining slots
      });

      if (!result.canceled && result.assets) {
        setIsLoading(true);
        try {
          const imageUris = result.assets.map(asset => asset.uri);

          // Compress each new image
          const compressionPromises = imageUris.map(uri => compressAndConvertImage(uri));
          const newImageDataArray = await Promise.all(compressionPromises);

          // Filter out any failed conversions
          const validNewImages = newImageDataArray.filter((img): img is ImageData => img !== null);

          if (validNewImages.length !== imageUris.length) {
            Alert.alert('Warning', 'Some images could not be processed and were skipped');
          }

          // Add new images to existing ones, ensuring max 5 total
          setSelectedImages(prev => [...prev, ...validNewImages].slice(0, 5));
        } catch (conversionError) {
          console.error('Image conversion error:', conversionError);
          Alert.alert('Error', 'Failed to process selected images');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeAllImages = () => {
    setSelectedImages([]);
  };

  const geocodeLocation = async (address: string) => {
    try {
      const geocodeResult = await Location.geocodeAsync(address);
      if (geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        setCoordinates({ lat: latitude, lng: longitude });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Geocoding error:', error);
      return false;
    }
  };

  const handleLocationChange = (text: string) => {
    setLocation(text);
    setCurrency(getCurrencyForLocation(text));
    // Clear coordinates when manually editing location
    // This ensures geocoding will happen during validation
    if (coordinates) {
      setCoordinates(null);
    }
  };

  const openMapSelector = () => {
    setShowMapSelector(true);
  };

  const handleMapLocationSelect = (location: { address: string; coordinates: { lat: number; lng: number } }) => {
    setLocation(location.address);
    setCurrency(getCurrencyForLocation(location.address));
    setCoordinates(location.coordinates);
    setShowMapSelector(false);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      if (addressResult.length > 0) {
        const addr = addressResult[0];
        address = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');
      }

      setLocation(address);
      setCurrency(getCurrencyForLocation(address));
      setCoordinates({ lat: latitude, lng: longitude });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!selectedType) {
      Alert.alert('Error', 'Please select an activity type');
      return false;
    }
    if (!isOnline) {
      if (!location.trim()) {
        Alert.alert('Error', 'Please enter a location');
        return false;
      }
      
      // If coordinates are not set, try to geocode the location
      if (!coordinates) {
        const geocoded = await geocodeLocation(location.trim());
        if (!geocoded) {
          Alert.alert('Error', 'Could not find the specified location. Please check the spelling or be more specific.');
          return false;
        }
      }
    }
    if (!maxParticipants || parseInt(maxParticipants) < 2) {
      Alert.alert('Error', 'Maximum participants must be at least 2');
      return false;
    }
    if (date <= new Date()) {
      Alert.alert('Error', 'Please select a future date');
      return false;
    }
    return true;
  };

  const handleUpdateActivity = async () => {
    const isValid = await validateForm();
    if (!isValid || !user) return;

    setIsLoading(true);

    try {
      // Double-check coordinates are available for on-site activities
      if (!isOnline && !coordinates) {
        Alert.alert('Error', 'Location coordinates are not available. Please try again.');
        setIsLoading(false);
        return;
      }

      const activityData: any = {
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        date: date as any,
        maxParticipants: parseInt(maxParticipants),
        isOnline,
      };

      // Only add location data for on-site activities
      if (!isOnline && coordinates) {
        activityData.location = {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: location.trim(),
        };
      }

      // Set fee or clear it if empty
      if (fee && fee.trim()) {
        activityData.fee = parseFloat(fee);
      } else {
        activityData.fee = 0; // Clear fee when empty
      }

      // Only add images if there are images (using new base64 format)
      if (selectedImages.length > 0) {
        activityData.imageBase64 = selectedImages.map(imageData => imageData.base64);
        activityData.imageMetadata = selectedImages.map(imageData => ({
          id: imageData.id,
          mimeType: imageData.mimeType,
          originalName: imageData.originalName || ''
        }));
      }

      await activityService.updateActivity(activityId, activityData);
      const updatedActivity = { 
        id: activityId, 
        ...activityData,
        date: activityData.date.getTime() // Convert Date to timestamp for Redux
      };
      
      dispatch(updateActivity(updatedActivity as any));
      
      navigation.navigate('ActivityDetails', { activityId });
    } catch (error) {
      console.error('Update activity error:', error);
      Alert.alert('Error', 'Failed to update activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Only close on Android when dismissed, keep open for continuous selection
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    // Update the date but keep picker open for multi-field selection
    if (selectedDate) {
      setDate(selectedDate);
    }
  };


  if (isLoadingActivity) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50}
        enabled
      >
        <ScrollView 
          contentContainerStyle={[styles.content, styles.contentWithTabs, { paddingBottom: 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >

        <Input
          label="Activity Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter activity title"
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your activity..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos (Optional) - Up to 5</Text>
          
          {selectedImages.length > 0 ? (
            <View>
              <View style={styles.imagePreviewContainer}>
                {selectedImages.map((imageData, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: convertBase64StringToDataUri(imageData.base64, imageData.mimeType) }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              <View style={styles.imageActions}>
                {selectedImages.length < 5 && (
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={styles.addMoreText}>Add More</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.removeAllButton}
                  onPress={removeAllImages}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.removeAllText}>Remove All</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={32} color={colors.primary} />
              <Text style={styles.addImageText}>Add Photos</Text>
              <Text style={styles.addImageSubtext}>Select up to 5 photos to showcase your activity</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activity Type</Text>
          <View style={styles.typeContainer}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
              >
                <LinearGradient
                  colors={selectedType === type ? [getActivityTypeColor(type), getActivityTypeColor(type) + 'CC'] : [colors.gray100, colors.gray100]}
                  style={[
                    styles.typeChip,
                    selectedType === type && styles.typeChipSelected,
                  ]}
                >
                  <Text style={[
                    styles.typeChipText,
                    selectedType === type && styles.typeChipTextSelected,
                  ]}>
                    {type}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date & Time</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker(true);
              }}
            >
              <View style={styles.dateTimeContent}>
                <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                <View style={styles.dateTimeText}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeValue}>
                    {date.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(true);
              }}
            >
              <View style={styles.dateTimeContent}>
                <Ionicons name="time-outline" size={20} color="#6366f1" />
                <View style={styles.dateTimeText}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeValue}>
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activity Format</Text>
          <View style={styles.onlineContainer}>
            <View style={styles.onlineOption}>
              <Text style={styles.onlineLabel}>Online Activity</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                thumbColor={isOnline ? colors.primary : colors.gray500}
              />
            </View>
            <Text style={styles.onlineDescription}>
              {isOnline 
                ? 'This activity will be conducted online (virtual meeting)'
                : 'This activity will be conducted at a physical location'
              }
            </Text>
          </View>

          {!isOnline && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Location</Text>
              <View style={styles.locationContainer}>
                <TouchableOpacity
                  style={styles.selectLocationButton}
                  onPress={openMapSelector}
                >
                  <Ionicons name="map-outline" size={20} color={colors.primary} />
                  <Text style={styles.selectLocationText}>
                    {location ? 'Change Location' : 'Select Location on Map'}
                  </Text>
                </TouchableOpacity>
                
                {location ? (
                  <View style={styles.selectedLocationContainer}>
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <Text style={styles.selectedLocationText} numberOfLines={2}>
                      {location}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={getCurrentLocation}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={isLoading ? "refresh" : "location"} 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={styles.currentLocationButtonText}>
                    {isLoading ? "Getting..." : "Use Current Location"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.row}>
          <Input
            label="Max Participants"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="numeric"
            placeholder="10"
            containerStyle={styles.halfWidth}
          />

          <Input
            label={`Fee (Optional) (${currency})`}
            value={fee}
            onChangeText={setFee}
            keyboardType="numeric"
            placeholder="0.00"
            containerStyle={styles.halfWidth}
          />
        </View>

        <Button
          title="Update Activity"
          onPress={handleUpdateActivity}
          disabled={isLoading}
          style={styles.createButton}
        />
        </ScrollView>
      </KeyboardAvoidingView>

      {(showDatePicker || showTimePicker) && (
        <View style={styles.dateTimePickerContainer}>
          {showDatePicker && (
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.pickerButton}
                >
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.pickerButton}
                >
                  <Text style={[styles.pickerButtonText, styles.doneButton]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()} // Today and future only
                  maximumDate={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)} // 10 years from now
                  style={styles.picker}
                  textColor="#111827"
                  accentColor="#6366f1"
                />
              </View>
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.pickerButtonText, styles.doneButton]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={date}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  style={styles.picker}
                  textColor="#111827"
                  accentColor="#6366f1"
                />
              </View>
            </View>
          )}
        </View>
      )}

      <MapLocationSelector
        visible={showMapSelector}
        onLocationSelect={handleMapLocationSelect}
        onCancel={() => setShowMapSelector(false)}
        initialLocation={coordinates}
      />
    </View>
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
  contentWithTabs: {
    paddingBottom: 20, // Reduced padding for tab bar + safe area
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  typeChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeChipText: {
    fontSize: 14,
    color: '#374151',
  },
  typeChipTextSelected: {
    color: '#ffffff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  locationInputWrapper: {
    flex: 1,
  },
  locationInputContainer: {
    marginBottom: 0,
  },
  locationButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minWidth: 80,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMoreText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  removeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  removeAllText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  addImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  addImageText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
  },
  createButton: {
    marginTop: 8,
  },
  dateTimePickerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  pickerWrapper: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  doneButton: {
    fontWeight: '600',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  picker: {
    backgroundColor: colors.white,
    height: 108, // Half the original height for more compact appearance
    width: '100%',
    color: colors.textPrimary,
    alignSelf: 'center',
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  timePicker: {
    height: 200,
    width: 320,
    alignSelf: 'center',
  },
  onlineContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  onlineOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  onlineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  onlineDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  selectLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  currentLocationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default EditActivityScreen;