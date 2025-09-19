import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAcC6AyyIWRf5YhRG3UuhQqzmkznCTRbDk",
  authDomain: "tribeup-acff6.firebaseapp.com",
  databaseURL: "https://tribeup-acff6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tribeup-acff6",
  storageBucket: "tribeup-acff6.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;