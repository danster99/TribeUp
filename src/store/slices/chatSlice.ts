import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';
import { messageLogger } from '../../utils/messageLogger';

interface ChatState {
  messages: Record<string, Message[]>; // activityId -> messages
  unreadCounts: Record<string, number>; // activityId -> unread count
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  unreadCounts: {},
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMessages: (state, action: PayloadAction<{ activityId: string; messages: Message[] }>) => {
      const { activityId, messages } = action.payload;
      state.messages[activityId] = messages;
      state.isLoading = false;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (!state.messages[message.activityId]) {
        state.messages[message.activityId] = [];
      }
      state.messages[message.activityId].push(message);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUnreadCounts: (state, action: PayloadAction<Record<string, number>>) => {
      state.unreadCounts = action.payload;
    },
    updateUnreadCount: (state, action: PayloadAction<{ activityId: string; count: number }>) => {
      const { activityId, count } = action.payload;
      state.unreadCounts[activityId] = count;
    },
    markAsRead: (state, action: PayloadAction<{ activityId: string }>) => {
      const { activityId } = action.payload;
      state.unreadCounts[activityId] = 0;
    },
    clearChatData: (state) => {
      // Clear all chat data when user logs out
      state.messages = {};
      state.unreadCounts = {};
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setMessages,
  addMessage,
  setUnreadCounts,
  updateUnreadCount,
  markAsRead,
  setError,
  clearError,
  clearChatData,
} = chatSlice.actions;

export default chatSlice.reducer;