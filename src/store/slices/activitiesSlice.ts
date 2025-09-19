import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Activity } from '../../types';

interface ActivitiesState {
  activities: Activity[];
  nearbyActivities: Activity[];
  userActivities: Activity[];
  currentActivity: Activity | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ActivitiesState = {
  activities: [],
  nearbyActivities: [],
  userActivities: [],
  currentActivity: null,
  isLoading: false,
  error: null,
};

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
      state.isLoading = false;
    },
    setNearbyActivities: (state, action: PayloadAction<Activity[]>) => {
      state.nearbyActivities = action.payload;
    },
    setUserActivities: (state, action: PayloadAction<Activity[]>) => {
      state.userActivities = action.payload;
    },
    setCurrentActivity: (state, action: PayloadAction<Activity | null>) => {
      state.currentActivity = action.payload;
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
    },
    updateActivity: (state, action: PayloadAction<Activity>) => {
      const index = state.activities.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
    },
    joinActivity: (state, action: PayloadAction<{ activityId: string; userId: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity && !activity.participants.includes(action.payload.userId)) {
        activity.participants.push(action.payload.userId);
      }
    },
    leaveActivity: (state, action: PayloadAction<{ activityId: string; userId: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity) {
        activity.participants = activity.participants.filter(id => id !== action.payload.userId);
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setActivities,
  setNearbyActivities,
  setUserActivities,
  setCurrentActivity,
  addActivity,
  updateActivity,
  joinActivity,
  leaveActivity,
  setError,
  clearError,
} = activitiesSlice.actions;

export default activitiesSlice.reducer;