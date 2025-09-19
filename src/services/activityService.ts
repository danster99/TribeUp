import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import { Activity } from '../types';

class ActivityService {
  private collectionName = 'activities';

  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<string> {
    try {
      const activity = {
        ...activityData,
        createdAt: Timestamp.now(),
      };

      // Remove undefined values
      const filteredActivity = Object.fromEntries(
        Object.entries(activity).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, this.collectionName), filteredActivity);
      return docRef.id;
    } catch (error) {
      console.error('Create activity error:', error);
      throw error;
    }
  }

  async getActivity(activityId: string): Promise<Activity | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, activityId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Activity;
      }
      return null;
    } catch (error) {
      console.error('Get activity error:', error);
      throw error;
    }
  }

  async getActivities(limitCount: number = 50): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error('Get activities error:', error);
      throw error;
    }
  }

  async getNearbyActivities(lat: number, lng: number, radius: number = 10): Promise<Activity[]> {
    try {
      // This is a simplified version. For production, consider using GeoFirestore for proper geoqueries
      const activities = await this.getActivities();
      
      return activities.filter(activity => {
        const distance = this.calculateDistance(
          lat, lng,
          activity.location.lat, activity.location.lng
        );
        return distance <= radius;
      });
    } catch (error) {
      console.error('Get nearby activities error:', error);
      throw error;
    }
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizerId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      
      // Sort in memory to avoid index requirement
      return activities.sort((a, b) => {
        const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Get user activities error:', error);
      throw error;
    }
  }

  async getJoinedActivities(userId: string): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('participants', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      
      // Sort in memory to avoid index requirement
      return activities.sort((a, b) => {
        const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Get joined activities error:', error);
      throw error;
    }
  }

  async joinActivity(activityId: string, userId: string): Promise<void> {
    try {
      const activityRef = doc(db, this.collectionName, activityId);
      const activityDoc = await getDoc(activityRef);
      
      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }
      
      const activity = activityDoc.data() as Activity;
      
      if ((activity.participants?.length || 0) >= activity.maxParticipants) {
        throw new Error('Activity is full');
      }
      
      if (activity.participants?.includes(userId)) {
        return; // User already joined
      }
      
      // Update participants array
      const currentParticipants = activity.participants || [];
      const updatedParticipants = [...currentParticipants, userId];
      
      await updateDoc(activityRef, {
        participants: updatedParticipants,
      });
    } catch (error) {
      console.error('Join activity error:', error);
      throw error;
    }
  }

  async leaveActivity(activityId: string, userId: string): Promise<void> {
    try {
      const activityRef = doc(db, this.collectionName, activityId);
      const activityDoc = await getDoc(activityRef);
      
      if (activityDoc.exists()) {
        const activity = activityDoc.data() as Activity;
        const updatedParticipants = activity.participants.filter(id => id !== userId);
        
        await updateDoc(activityRef, {
          participants: updatedParticipants,
        });
      }
    } catch (error) {
      console.error('Leave activity error:', error);
      throw error;
    }
  }

  async updateActivity(activityId: string, updates: Partial<Activity>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, activityId), updates);
    } catch (error) {
      console.error('Update activity error:', error);
      throw error;
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, activityId));
    } catch (error) {
      console.error('Delete activity error:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const activityService = new ActivityService();