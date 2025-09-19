import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import MapLocationSelector from '../../components/common/MapLocationSelector';
import { activityService } from '../../services/activityService';
import { addActivity } from '../../store/slices/activitiesSlice';
import { RootState } from '../../store';
import { RootStackParamList } from '../../types';
import { colors } from '../../utils/colors';
import { compressAndConvertImage, convertBase64ToDataUri, ImageData } from '../../utils/imageUtils';
import { getCurrencyForLocation } from '../../utils/currencyUtils';
import { set } from 'firebase/database';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateActivity'>;

const ACTIVITY_TYPES = [
  'Sports', 'Food', 'Music', 'Art', 'Travel', 'Technology',
  'Reading', 'Movies', 'Gaming', 'Fitness', 'Photography', 'Cooking',
  'Dancing', 'Hiking', 'Volunteering', 'Study Groups', 'Other'
];

const CreateActivityScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  // Separate date and time state
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Reset to midnight for date only
    return tomorrow;
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    const defaultTime = new Date();
    defaultTime.setHours(12, 0, 0, 0); // Default to 12:00 PM
    return defaultTime;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [fee, setFee] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [currency, setCurrency] = useState('$');

  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const getActivityTypeColor = (type: string) => {
    const typeKey = type?.toLowerCase() as keyof typeof colors;
    return colors[typeKey] || colors.primary;
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to create activities');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      
      setCoordinates({ lat: latitude, lng: longitude });
      
      // Reverse geocoding to get address
      const addressResult = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResult.length > 0) {
        const address = addressResult[0];
        const formattedAddress = `${address.street || ''} ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;
        const newLocation = formattedAddress.trim();
        setLocation(newLocation);
        setCurrency(getCurrencyForLocation(newLocation));
      }
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
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
        allowsEditing: false, // Cannot use editing with multiple selection
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        setIsLoading(true);
        try {
          const imageUris = result.assets.map(asset => asset.uri);

          // Compress each image individually to reduce size
          const compressionPromises = imageUris.map(uri => compressAndConvertImage(uri));
          const imageDataArray = await Promise.all(compressionPromises);

          // Filter out any failed conversions
          const validImages = imageDataArray.filter((img): img is ImageData => img !== null);

          if (validImages.length !== imageUris.length) {
            Alert.alert('Warning', 'Some images could not be processed and were skipped');
          }

          setSelectedImages(validImages);
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

  const handleMapLocationSelect = (location: { address: string; coordinates: { lat: number; lng: number } }) => {
    setLocation(location.address);
    setCurrency(getCurrencyForLocation(location.address));
    setCoordinates(location.coordinates);
    setShowMapSelector(false);
  };

  const openMapSelector = () => {
    setShowMapSelector(true);
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
    // Only validate location for on-site activities
    if (!isOnline) {
      if (!location.trim()) {
        Alert.alert('Error', 'Please set a location for on-site activities');
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
    // Combine date and time for validation
    const combinedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );

    if (combinedDateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }
    return true;
  };

  const handleCreateActivity = async () => {
    const isValid = await validateForm();
    if (!isValid || !user) return;

    setIsLoading(true);

    try {
      // Double-check coordinates are available
      if (!coordinates) {
        Alert.alert('Error', 'Location coordinates are not available. Please try again.');
        setIsLoading(false);
        return;
      }


      const activityData: any = {
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        isOnline,
        date: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          0,
          0
        ),
        maxParticipants: parseInt(maxParticipants),
        organizerId: user.id,
        participants: [user.id],
      };

      // Only add location for on-site activities
      if (!isOnline && coordinates) {
        activityData.location = {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: location.trim(),
        };
      }

      // Only add fee if it has a value
      if (fee && fee.trim()) {
        activityData.fee = parseFloat(fee);
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

      const activityId = await activityService.createActivity(activityData);
      const newActivity = { 
        id: activityId, 
        ...activityData,
        date: activityData.date.getTime() // Convert Date to timestamp for Redux
      };
      
      dispatch(addActivity(newActivity as any));
      
      // Navigate to MyActivities screen showing created activities
      navigation.navigate('MyActivities');
    } catch (error) {
      console.error('Create activity error:', error);
      Alert.alert('Error', 'Failed to create activity');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 40}
        enabled
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
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
                  <View key={imageData.id} style={styles.imageContainer}>
                    <Image source={{ uri: convertBase64ToDataUri(imageData) }} style={styles.selectedImage} />
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
                    {selectedDate.toLocaleDateString()}
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
                    {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          title="Create Activity"
          onPress={handleCreateActivity}
          disabled={isLoading}
          style={styles.createButton}
        />
        </ScrollView>
      </KeyboardAvoidingView>

      {(showDatePicker || showTimePicker) && (
        <View style={styles.dateTimePickerContainer}>
          <DatePicker
            modal
            open={showDatePicker}
            date={selectedDate}
            mode="date"
            onConfirm={(date) => {
              setShowDatePicker(false);
              setSelectedDate(date);
            }}
            onCancel={() => {
              setShowDatePicker(false);
            }}
          />

          <DatePicker
            modal
            open={showTimePicker}
            date={selectedTime}
            mode="time"
            onConfirm={(time) => {
              setShowTimePicker(false);
              setSelectedTime(time);
            }}
            onCancel={() => {
              setShowTimePicker(false);
            }}
          />
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
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
  onlineContainer: {
    marginBottom: 16,
  },
  onlineOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  onlineDescription: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  locationContainer: {
    gap: 12,
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: colors.white,
    gap: 8,
  },
  selectLocationText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 8,
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
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    backgroundColor: colors.white,
    gap: 6,
  },
  currentLocationButtonText: {
    fontSize: 14,
    color: colors.primary,
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
    marginTop: 24,
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
});

export default CreateActivityScreen;