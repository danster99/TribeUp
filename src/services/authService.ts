import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

class AuthService {
  async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const user: User = {
        id: firebaseUser.uid,
        name: userData.name || '',
        email: firebaseUser.email || '',
        bio: userData.bio || '',
        interests: userData.interests || [],
        availability: userData.availability || [],
        createdAt: new Date() as any,
      };

      // Only add photoUrl if it exists
      if (userData.photoUrl || firebaseUser.photoURL) {
        user.photoUrl = userData.photoUrl || firebaseUser.photoURL;
      }
      
      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      return await this.getUserData(firebaseUser.uid);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<User> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<void> {
    try {
      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(doc(db, 'users', userId), filteredData, { merge: true });
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();