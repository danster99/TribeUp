# TribeUp - Social Activity Matching Platform

TribeUp is a React Native mobile application that combines Tinder's swipe UX with Meetup's activity discovery, allowing users to create, discover, and join activities nearby, form temporary groups (tribes), and chat with participants.

## 🌟 Features

- **Activity Discovery**: Tinder-style swipe interface to discover nearby activities
- **Activity Creation**: Create and organize activities with location, date, and participant limits
- **Real-time Chat**: Group messaging for activity participants
- **Map View**: Visualize nearby activities on an interactive map
- **Profile Management**: Customize interests, availability, and personal information
- **Authentication**: Secure login with Firebase Auth

## 🛠 Tech Stack

- **Framework**: React Native with Expo (latest)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Maps**: React Native Maps
- **Styling**: NativeWind (Tailwind for React Native)
- **Icons**: Expo Vector Icons

## 📱 App Structure

### Main Navigation Tabs

1. **Home**: Activity feed with swipe interface
2. **Map**: Map view of nearby activities with pins
3. **Create**: Activity creation form
4. **Messages**: List of group chats for joined activities
5. **Profile**: User profile and settings

### Authentication Flow

- Onboarding with app introduction
- Email/password signup and login
- Profile setup with interests and availability
- Firebase authentication integration

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Studio

### Installation

1. Clone the repository:
   ```bash
   cd TribeUp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Realtime Database for chat
   - Update `src/services/firebase.ts` with your Firebase config

4. Start the development server:
   ```bash
   npm run start
   ```

5. Run on device/simulator:
   ```bash
   npm run ios    # iOS
   npm run android # Android
   npm run web     # Web
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, Card, etc.)
│   ├── activity/       # Activity-specific components
│   └── profile/        # Profile-specific components
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── main/          # Main tab screens
│   ├── activity/      # Activity-related screens
│   ├── chat/          # Chat screens
│   └── profile/       # Profile screens
├── services/          # Firebase and API services
├── store/             # Redux store and slices
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

## 🔥 Firebase Configuration

### Required Firebase Services

1. **Authentication**:
   - Email/Password provider
   - Google Sign-In (optional)

2. **Firestore Collections**:
   - `users`: User profiles and settings
   - `activities`: Activity data and metadata

3. **Realtime Database**:
   - `messages/{activityId}`: Chat messages for each activity

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.organizerId;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.organizerId ||
        request.auth.uid in resource.data.participants
      );
    }
  }
}
```

### Realtime Database Security Rules

```json
{
  "rules": {
    "messages": {
      "$activityId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## 🎨 Key Components

### ActivityCard
Displays activity information in both swipe cards and list views with join/leave functionality.

### SwipeCards Integration
Uses `react-native-deck-swiper` for Tinder-style activity discovery with overlay labels.

### Real-time Chat
Implements Firebase Realtime Database for instant messaging with proper user attribution.

### Map Integration
Uses `react-native-maps` with custom markers color-coded by activity type.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id
```

### App Configuration

Key settings in `app.json`:
- Permissions for location, camera, and notifications
- iOS and Android specific configurations
- Map provider settings

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
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  date: Timestamp;
  maxParticipants: number;
  organizerId: string;
  participants: string[];
  createdAt: Timestamp;
  fee?: number;
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
  createdAt: Timestamp;
}
```

## 🚧 Future Enhancements

- Push notifications for new messages and activity reminders
- Photo sharing in activities and chat
- Activity ratings and reviews
- Advanced filtering and search
- Social features (follow users, friends)
- Payment integration with Stripe
- Activity recommendations based on ML
- Offline support with data synchronization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💫 Acknowledgments

- Expo team for the amazing development platform
- Firebase for backend services
- React Native community for excellent libraries
- Tinder and Meetup for UX inspiration

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**TribeUp** - Connecting people through shared activities! 🎉