import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { store } from './src/store';
import { auth } from './src/services/firebase';
import { authService } from './src/services/authService';
import { setUser, setLoading, logout } from './src/store/slices/authSlice';
import RootNavigator from './src/navigation/RootNavigator';

const App: React.FC = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      store.dispatch(setLoading(true));
      
      try {
        if (firebaseUser) {
          // User is signed in
          const userData = await authService.getUserData(firebaseUser.uid);
          store.dispatch(setUser(userData));
        } else {
          // User is signed out
          store.dispatch(logout());
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        store.dispatch(logout());
      } finally {
        store.dispatch(setLoading(false));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <RootNavigator />
    </Provider>
  );
};

export default App;