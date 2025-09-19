import { Timestamp } from 'firebase/firestore';
import { ImageData } from '../utils/imageUtils';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  availability: string[];
  createdAt: Timestamp;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  date: Timestamp;
  maxParticipants: number;
  organizerId: string;
  participants: string[];
  createdAt: Timestamp;
  fee?: number;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // Legacy field for URL-based images
  imageBase64?: string[]; // New field for base64 images stored in database
  imageMetadata?: Array<{
    id: string;
    mimeType: string;
    originalName?: string;
  }>; // Metadata for base64 images
}

export interface Message {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number | Timestamp;
}

export interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

export interface Interest {
  id: string;
  name: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ProfileSetup: undefined;
};