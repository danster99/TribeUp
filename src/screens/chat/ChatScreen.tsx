import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/chatService';
import { activityService } from '../../services/activityService';
import { setMessages, addMessage, markAsRead } from '../../store/slices/chatSlice';
import { RootState } from '../../store';
import { RootStackParamList, Message } from '../../types';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { messageLogger } from '../../utils/messageLogger';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId, activityTitle } = route.params;
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionMonitorRef = useRef<(() => void) | null>(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const messages = useSelector((state: RootState) =>
    state.chat.messages[activityId] || [],
    (left, right) => JSON.stringify(left) === JSON.stringify(right)
  );

  // Create a reliable scroll function that accounts for keyboard height
  const scrollToLastMessage = (animated = true, force = false) => {
    if (!flatListRef.current || messages.length === 0) {
      return;
    }

    // Use scrollToEnd which is more reliable than scrollToIndex
    flatListRef.current.scrollToEnd({ animated });
  };

  useEffect(() => {
    navigation.setOptions({
      title: activityTitle || 'Group Chat',
    });

    loadActivity();
    initializeChat();

    // Add keyboard listeners with height tracking and scroll function
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      messageLogger.keyboardToggle(true, event.endCoordinates.height);
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => {
        scrollToLastMessage(true, true);
      }, 300);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      messageLogger.keyboardToggle(false);
      setKeyboardHeight(0);
      setTimeout(() => {
        scrollToLastMessage(true, true);
      }, 300);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (connectionMonitorRef.current) {
        connectionMonitorRef.current();
      }
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      chatService.cleanup();
    };
  }, [activityId, messages.length]);

  // Scroll to bottom when keyboard height changes
  useEffect(() => {
    if (messages.length > 0 && keyboardHeight > 0) {
      // When keyboard opens, scroll to bottom with a longer delay to ensure layout is complete
      setTimeout(() => {
        scrollToLastMessage(true, true);
      }, 300);
    }
  }, [keyboardHeight]);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (user && messages.length > 0) {
      // Add a delay to ensure the user is actually viewing the chat
      const markReadTimer = setTimeout(async () => {
        try {
          // Get the latest message ID to mark as read (regardless of sender)
          const latestMessage = messages[messages.length - 1];
          if (latestMessage) {
            await chatService.updateLastReadMessage(activityId, user.id, latestMessage.id);
            dispatch(markAsRead({ activityId }));
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }, 2000); // Reduced to 2 seconds

      return () => clearTimeout(markReadTimer);
    }
  }, [activityId, user, messages]);

  // Mark messages as read when user leaves the chat
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts (user leaves chat)
      if (user && messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          // Mark as read immediately when leaving
          chatService.updateLastReadMessage(activityId, user.id, latestMessage.id)
            .then(() => {
              dispatch(markAsRead({ activityId }));
            })
            .catch((error) => {
              console.error('Error marking messages as read on exit:', error);
            });
        }
      }
    };
  }, [activityId, user, messages, dispatch]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');

      // Check if user is authenticated first
      if (!user) {
        setConnectionStatus('disconnected');
        Alert.alert('Authentication Error', 'Please log in to access chat.');
        return;
      }

      // Load initial messages
      await loadMessages();

      // Subscribe to real-time messages
      const unsubscribe = chatService.subscribeToMessages(
        activityId,
        (newMessages: Message[]) => {
          dispatch(setMessages({ activityId, messages: newMessages }));
        }
      );

      unsubscribeRef.current = unsubscribe;

      // If we get here, connection is working
      setConnectionStatus('connected');

      // Start connection monitoring
      const connectionCleanup = chatService.monitorConnection((isConnected) => {
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      });
      connectionMonitorRef.current = connectionCleanup;
    } catch (error) {
      console.error('Error initializing chat:', error);
      setConnectionStatus('disconnected');
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const activityData = await activityService.getActivity(activityId);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chatMessages = await chatService.getMessages(activityId);
      dispatch(setMessages({ activityId, messages: chatMessages }));

    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't show error alert, just use cached messages or show empty state
      dispatch(setMessages({ activityId, messages: [] }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending || connectionStatus !== 'connected') {
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      await chatService.sendMessage(
        activityId,
        user.id,
        user.name,
        messageText
      );

      // Mark messages as read after sending (user has seen all messages)
      // Note: We need to wait a moment for the new message to appear in the messages array
      setTimeout(async () => {
        try {
          const updatedMessages = messages;
          if (updatedMessages.length > 0) {
            const latestMessage = updatedMessages[updatedMessages.length - 1];
            await chatService.updateLastReadMessage(activityId, user.id, latestMessage.id);
            dispatch(markAsRead({ activityId }));
          }
        } catch (error) {
          console.error('Error marking messages as read after sending:', error);
        }
      }, 1000); // Wait 1 second for the message to be added to the list
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', `Failed to send message: ${error.message || error}`);
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    let date: Date;
    if (timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => message.senderId === user?.id;

  const handleToggleNotifications = () => {
    // TODO: Implement push notifications for chat messages
    // TODO: Store notification preference in user settings/local storage
    // TODO: Register/unregister device for push notifications
    // TODO: Handle notification permissions (request if needed)
    // TODO: Send notification settings to backend/Firebase
    // TODO: Show confirmation toast when toggling notifications

    setNotificationsEnabled(!notificationsEnabled);

    // Placeholder logic - replace with actual implementation
    if (!notificationsEnabled) {
      // TODO: Enable push notifications for this chat
      // TODO: Call notification service to enable notifications
    } else {
      // TODO: Disable push notifications for this chat
      // TODO: Call notification service to disable notifications
    }
  };

  const renderMessage = React.useCallback(({ item: message, index }: { item: Message; index: number }) => {
    const isMe = isMyMessage(message);
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;

    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}>
        {!isMe && showAvatar && (
          <ProfileAvatar
            photoUrl={undefined}
            name={message.senderName}
            size="small"
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          !isMe && !showAvatar && styles.messageWithoutAvatar,
        ]}>
          {!isMe && showAvatar && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isMe ? styles.myMessageText : styles.otherMessageText,
          ]}>
            {message.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isMe ? styles.myMessageTime : styles.otherMessageTime,
          ]}>
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  }, [messages, user]);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Loading messages...</Text>
          <Text style={styles.emptySubtitle}>
            Please wait while we fetch your conversation
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Start the conversation!</Text>
        <Text style={styles.emptySubtitle}>
          Say hello to your activity group members
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 20}
      >
        {activity && (
          <View style={styles.activityInfo}>
            <View style={styles.titleRow}>
              <View style={styles.titleSection}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.participantsCount}>
                  {activity.participants.length} participants
                </Text>
              </View>
              <TouchableOpacity
                style={styles.notificationToggle}
                onPress={handleToggleNotifications}
              >
                <Ionicons
                  name={notificationsEnabled ? "notifications" : "notifications-off"}
                  size={20}
                  color={notificationsEnabled ? "#6366f1" : "#9ca3af"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => {
            scrollToLastMessage(true);
          }}
          onLayout={() => {
            scrollToLastMessage(false);
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={20}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 80, // Approximate message height
            offset: 80 * index,
            index,
          })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#6b7280"
            multiline
            maxLength={500}
            onFocus={() => {
              // Scroll immediately and again after keyboard animation
              scrollToLastMessage(false, true);
              setTimeout(() => {
                scrollToLastMessage(true, true);
              }, 500);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending || connectionStatus !== 'connected') && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending || connectionStatus !== 'connected'}
          >
            <Ionicons
              name={isSending ? "hourglass" : "send"}
              size={20}
              color={(newMessage.trim() && !isSending && connectionStatus === 'connected') ? '#ffffff' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
  },
  activityInfo: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  participantsCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  notificationToggle: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    paddingVertical: 0,
    backgroundColor: '#ffffff',
    minHeight: '70%',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: -10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
});

export default ChatScreen;