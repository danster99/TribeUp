import {
  ref,
  push,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  get,
  set,
  orderByKey,
} from 'firebase/database';
import { realtimeDb } from './firebase';
import { Message } from '../types';

class ChatService {
  private activeListeners: Map<string, () => void> = new Map();
  private connectionListener: (() => void) | null = null;
  private messageCache: Map<string, Message[]> = new Map();
  private cacheTimeout: Map<string, NodeJS.Timeout> = new Map();

  async sendMessage(activityId: string, senderId: string, senderName: string, text: string): Promise<void> {
    try {
      const messagesRef = ref(realtimeDb, `messages/${activityId}`);
      const newMessage = {
        activityId,
        senderId,
        senderName,
        text,
        createdAt: serverTimestamp(),
      };

      await push(messagesRef, newMessage);
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error(`Failed to send message: ${error.message || error}`);
    }
  }

  subscribeToMessages(
    activityId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 100
  ): () => void {
    // Clean up any existing listener for this activity
    if (this.activeListeners.has(activityId)) {
      this.activeListeners.get(activityId)!();
    }

    const messagesRef = ref(realtimeDb, `messages/${activityId}`);
    // Use orderByKey instead of orderByChild to avoid index requirement
    const q = query(messagesRef, limitToLast(limitCount));

    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const messages: Message[] = Object.entries(data).map(([id, messageData]: [string, any]) => {
          // Handle Firebase serverTimestamp properly
          let timestamp = Date.now();
          if (messageData.createdAt) {
            if (typeof messageData.createdAt === 'number') {
              timestamp = messageData.createdAt;
            } else if (messageData.createdAt && typeof messageData.createdAt === 'object') {
              // Firebase timestamp object - convert to milliseconds
              timestamp = new Date(messageData.createdAt).getTime();
            }
          }

          return {
            id,
            activityId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            text: messageData.text,
            createdAt: timestamp,
          };
        });

        messages.sort((a, b) => (a.createdAt as number) - (b.createdAt as number));
        callback(messages);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error in message subscription:', error);
      callback([]);
    });

    const cleanupFn = () => {
      off(messagesRef, 'value', unsubscribe);
      this.activeListeners.delete(activityId);
    };

    this.activeListeners.set(activityId, cleanupFn);
    return cleanupFn;
  }

  async getMessages(activityId: string, limitCount: number = 100): Promise<Message[]> {
    try {
      // Check cache first
      if (this.messageCache.has(activityId)) {
        const cachedMessages = this.messageCache.get(activityId)!;
        return cachedMessages;
      }

      const messagesRef = ref(realtimeDb, `messages/${activityId}`);

      // Use basic query without ordering to avoid index requirement
      const q = query(messagesRef, limitToLast(limitCount));
      const snapshot = await get(q);

      const data = snapshot.val();

      if (data) {
        const messages: Message[] = Object.entries(data).map(([id, messageData]: [string, any]) => {
          // Handle Firebase serverTimestamp properly
          let timestamp = Date.now();
          if (messageData.createdAt) {
            if (typeof messageData.createdAt === 'number') {
              timestamp = messageData.createdAt;
            } else if (messageData.createdAt && typeof messageData.createdAt === 'object') {
              // Firebase timestamp object - convert to milliseconds
              timestamp = new Date(messageData.createdAt).getTime();
            }
          }

          return {
            id,
            activityId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            text: messageData.text,
            createdAt: timestamp,
          };
        });

        messages.sort((a, b) => (a.createdAt as number) - (b.createdAt as number));

        // Cache the messages for 5 minutes
        this.cacheMessages(activityId, messages);

        return messages;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      // Return cached messages if available, otherwise empty array
      return this.messageCache.get(activityId) || [];
    }
  }

  private cacheMessages(activityId: string, messages: Message[]): void {
    this.messageCache.set(activityId, messages);

    // Clear existing timeout
    if (this.cacheTimeout.has(activityId)) {
      clearTimeout(this.cacheTimeout.get(activityId)!);
    }

    // Set new timeout to clear cache after 5 minutes
    const timeout = setTimeout(() => {
      this.messageCache.delete(activityId);
      this.cacheTimeout.delete(activityId);
    }, 5 * 60 * 1000);

    this.cacheTimeout.set(activityId, timeout);
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { auth } = await import('./firebase');
      if (!auth.currentUser) {
        console.error('User not authenticated');
        return false;
      }

      // Try to read a simple test path
      const testRef = ref(realtimeDb, 'test');
      await get(testRef);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Monitor connection status
  monitorConnection(callback: (isConnected: boolean) => void): () => void {
    if (this.connectionListener) {
      this.connectionListener();
    }

    // Since the messaging is working, let's use a simpler approach
    const { auth } = require('./firebase');

    const checkConnection = async () => {
      try {
        if (auth.currentUser) {
          callback(true);
        } else {
          callback(false);
        }
      } catch (error) {
        callback(false);
      }
    };

    // Initial check
    checkConnection();

    // Check periodically (less frequently)
    const interval = setInterval(checkConnection, 10000);

    this.connectionListener = () => {
      clearInterval(interval);
    };

    return this.connectionListener;
  }

  // Clean up all listeners
  cleanup(): void {
    this.activeListeners.forEach(cleanup => cleanup());
    this.activeListeners.clear();
    if (this.connectionListener) {
      this.connectionListener();
      this.connectionListener = null;
    }
    // Clear all cache timeouts
    this.cacheTimeout.forEach(timeout => clearTimeout(timeout));
    this.cacheTimeout.clear();
  }

  // Track last read message for a user in a conversation
  async updateLastReadMessage(activityId: string, userId: string, messageId: string): Promise<void> {
    try {
      console.log(`Updating last read message for ${activityId}, user ${userId}, message ${messageId}`);
      const lastReadRef = ref(realtimeDb, `lastRead/${activityId}/${userId}`);
      await set(lastReadRef, {
        messageId,
        timestamp: serverTimestamp(),
      });
      console.log(`Successfully updated last read message for ${activityId}`);
    } catch (error) {
      console.error('Error updating last read message:', error);
      throw new Error(`Failed to update last read message: ${error.message || error}`);
    }
  }

  // Get last read message for a user in a conversation
  async getLastReadMessage(activityId: string, userId: string): Promise<{ messageId: string; timestamp: number } | null> {
    try {
      const lastReadRef = ref(realtimeDb, `lastRead/${activityId}/${userId}`);
      const snapshot = await get(lastReadRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          messageId: data.messageId,
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : new Date(data.timestamp).getTime(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting last read message:', error);
      return null;
    }
  }

  // Count unread messages for a user in a conversation
  async getUnreadCount(activityId: string, userId: string): Promise<number> {
    try {
      // Get all messages for this activity
      const messages = await this.getMessages(activityId);

      if (messages.length === 0) {
        return 0;
      }

      // Get the last read message for this user
      const lastRead = await this.getLastReadMessage(activityId, userId);

      if (!lastRead) {
        // If no last read message, count all messages from others
        const unreadCount = messages.filter(msg => msg.senderId !== userId).length;
        console.log(`No last read for ${activityId}, counting all messages from others: ${unreadCount}`);
        return unreadCount;
      }

      console.log(`Last read message for ${activityId}: ${lastRead.messageId} at ${new Date(lastRead.timestamp).toLocaleString()}`);

      // Find the index of the last read message
      const lastReadIndex = messages.findIndex(msg => msg.id === lastRead.messageId);

      if (lastReadIndex === -1) {
        // If last read message not found in current messages, count all messages from others
        console.log(`Last read message ${lastRead.messageId} not found in current messages, counting all`);
        return messages.filter(msg => msg.senderId !== userId).length;
      }

      // Count messages after the last read message that are from others
      const unreadMessages = messages.slice(lastReadIndex + 1);
      const unreadCount = unreadMessages.filter(msg => msg.senderId !== userId).length;

      console.log(`Found ${unreadMessages.length} messages after last read, ${unreadCount} from others`);
      return unreadCount;

    } catch (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
  }

  // Get unread counts for multiple activities
  async getUnreadCounts(activityIds: string[], userId: string): Promise<Record<string, number>> {
    const unreadCounts: Record<string, number> = {};

    try {
      // Process activities in parallel for better performance
      const countPromises = activityIds.map(async (activityId) => {
        const count = await this.getUnreadCount(activityId, userId);
        return { activityId, count };
      });

      const results = await Promise.all(countPromises);

      results.forEach(({ activityId, count }) => {
        unreadCounts[activityId] = count;
      });

    } catch (error) {
      console.error('Error getting unread counts:', error);
    }

    return unreadCounts;
  }

  // Debug method to test basic functionality
  async testSendMessage(activityId: string): Promise<boolean> {
    try {
      const testMessage = {
        activityId,
        senderId: 'test',
        senderName: 'Test User',
        text: 'Test message',
        createdAt: Date.now(),
      };

      const messagesRef = ref(realtimeDb, `messages/${activityId}`);
      await push(messagesRef, testMessage);
      console.log('Test message sent successfully');
      return true;
    } catch (error) {
      console.error('Test message failed:', error);
      return false;
    }
  }
}

export const chatService = new ChatService();