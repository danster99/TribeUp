# TribeUp 🤝

TribeUp is a React Native social app that connects people through shared activities and interests. Built with Expo, Firebase, and Redux, it enables users to discover, create, and join local activities while staying connected through real-time chat.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure sign up/sign in with Firebase Auth
- **Activity Management** - Create, browse, and join local activities
- **Real-time Chat** - Group messaging for activity participants
- **Smart Notifications** - Red dot indicators for unread messages
- **Profile Management** - Customizable user profiles with interests
- **Image Handling** - Photo uploads for activities and profiles

### Activity Features
- **Activity Creation** - Rich activity creation with images, descriptions, and details
- **Location-based Discovery** - Find activities near you
- **Activity Types** - Categorized activities (sports, social, educational, etc.)
- **Participant Management** - Join/leave activities with participant limits
- **Activity Filtering** - Filter by type, date, and location

### Messaging System
- **Group Chat** - Real-time messaging for each activity
- **Unread Tracking** - Persistent unread message counts across app sessions
- **Message History** - Full conversation history with timestamp sorting
- **Smart Read Status** - Automatic mark-as-read when viewing/leaving conversations
- **Keyboard Optimization** - Smooth keyboard handling with auto-scroll

### User Experience
- **Custom Navigation** - Persistent tab bar with red dot notifications
- **Responsive Design** - Optimized for both iOS and Android
- **Offline Support** - Cached data for better performance
- **Real-time Updates** - Live data synchronization across devices

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for navigation

### Backend & Database
- **Firebase Authentication** for user management
- **Firebase Firestore** for user data and activities
- **Firebase Realtime Database** for real-time messaging
- **Firebase Storage** for image uploads

### Key Libraries
- `@reduxjs/toolkit` - State management
- `@react-navigation/native` - Navigation
- `expo-camera` - Camera access
- `expo-image-picker` - Image selection
- `react-native-safe-area-context` - Safe area handling

## 📱 App Architecture

### State Management
```
src/
├── store/
│   ├── index.ts           # Redux store configuration
│   └── slices/
│       ├── authSlice.ts   # User authentication state
│       └── chatSlice.ts   # Chat messages and unread counts
```

### Services
```
src/services/
├── authService.ts         # Authentication operations
├── activityService.ts     # Activity CRUD operations
├── chatService.ts         # Real-time messaging and unread tracking
└── firebase.ts            # Firebase configuration
```

### Screens & Navigation
```
src/screens/
├── auth/                  # Authentication screens
├── main/                  # Main app screens (Home, Messages, etc.)
├── activity/              # Activity management screens
├── chat/                  # Chat interface
└── profile/               # User profile screens
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Authentication, Firestore, and Realtime Database enabled

### Installation

1. **Clone and install dependencies**
   ```bash
   cd TribeUp
   npm install
   ```

2. **Firebase Configuration**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Realtime Database
   - Update `src/services/firebase.ts` with your Firebase config
   - Deploy the Firebase Realtime Database rules from `database.rules.json`

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/emulator**
   - Scan QR code with Expo Go app
   - Or use `npm run android` / `npm run ios`

## 🔥 Firebase Configuration

### Required Services
1. **Authentication** - Email/password authentication
2. **Firestore Database** - User profiles and activities
3. **Realtime Database** - Chat messages and read status
4. **Storage** - Image uploads

### Database Rules
Deploy the rules in `database.rules.json` to Firebase Realtime Database:

```bash
firebase deploy --only database
```

The rules ensure:
- Authenticated users can read/write messages
- Users can track their own read status
- Proper security for message access

## 📊 Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  availability: string[];
  createdAt: Timestamp;
}
```

### Activity
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  location: { lat: number; lng: number; address: string };
  date: Timestamp;
  maxParticipants: number;
  organizerId: string;
  participants: string[];
  createdAt: Timestamp;
  imageUrls?: string[];
}
```

### Message
```typescript
interface Message {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number | Timestamp;
}
```

### Last Read Tracking
```typescript
// Firebase Realtime Database structure
lastRead: {
  [activityId]: {
    [userId]: {
      messageId: string;
      timestamp: number;
    }
  }
}
```

## 🎯 Key Features Implementation

### Unread Message System
- **Database Tracking**: Each user's last read message per conversation stored in Firebase Realtime Database
- **Smart Counting**: Counts only messages from others after the user's last read message
- **Real-time Updates**: Automatic refresh when returning to conversation list
- **Persistent State**: Unread counts survive app restarts and user sessions

### Real-time Chat
- **Live Messaging**: Firebase Realtime Database for instant message delivery
- **Auto-scroll**: Automatic scroll to bottom on new messages and keyboard events
- **Read Status**: Messages marked as read after viewing for 2 seconds or when leaving chat
- **Keyboard Handling**: Smooth keyboard appearance with proper chat window adjustment

### Activity Management
- **Rich Creation**: Full-featured activity creation with images and details
- **Smart Filtering**: Filter activities by type, date, and location
- **Participant Management**: Join/leave with automatic participant counting
- **Image Support**: Multiple image uploads with compression and optimization

## 🐛 Debugging

### Message Logging
The app includes a comprehensive debug logging system:

```typescript
// Enable debug logging
messageLogger.enable();

// View logs
messageLogger.dumpLogs();

// Clear logs
messageLogger.clearLogs();
```

### Console Debugging
- Unread count calculations are logged to console
- Last read message updates are tracked
- Database operations include detailed logging

## 🔮 Future Enhancements

- Push notifications for new messages
- Activity recommendations based on interests
- Location-based activity discovery
- Social features (friend system, activity reviews)
- Advanced filtering and search
- Calendar integration
- Offline message queuing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using React Native, Expo, and Firebase
