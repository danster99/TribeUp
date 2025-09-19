import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import activitiesSlice from './slices/activitiesSlice';
import chatSlice from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    activities: activitiesSlice,
    chat: chatSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'auth/setUser',
          'activities/setActivities',
          'activities/setNearbyActivities',
          'activities/addActivity',
        ],
        ignoredPaths: [
          'auth.user.createdAt',
          'activities.activities',
          'activities.nearbyActivities',
          'activities.currentActivity.date',
          'activities.currentActivity.createdAt',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;