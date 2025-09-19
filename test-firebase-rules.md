# Firebase Security Rules Testing Guide

## Step 1: Check if Rules Are Applied

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your TribeUp project
3. Go to **Firestore Database** → **Rules**
4. You should see rules that look like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Activities rules - simplified for testing
    match /activities/{activityId} {
      // Anyone authenticated can read activities
      allow read: if request.auth != null;
      
      // Only authenticated users can create activities
      allow create: if request.auth != null;
      
      // Allow authenticated users to update activities (for joining)
      allow update: if request.auth != null;
      
      // Only organizer can delete
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.organizerId;
    }

    // Chat messages rules
    match /chats/{activityId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.senderId;
    }

    // Default rule - deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 2: Apply Rules if Missing

If the rules are NOT there or different:

1. Copy the content from `firestore-simple.rules`
2. Paste into the Firebase Console Rules editor
3. Click **"Publish"**

## Step 3: Test Incremental Card Levels

The app is now using TestActivityCard with incremental levels:

- **Level 1**: Fixed text only - should work
- **Level 2**: Safe title from data - test if this works
- **Level 3**: Safe title + description - test if this works  
- **Level 4**: All safe values - test if this works

To change levels, update `testLevel={1}` to `testLevel={2}` etc. in HomeScreen.tsx

## Step 4: Debugging Process

1. Start with Level 1 - if this fails, the issue is with the Card component itself
2. If Level 1 works, try Level 2 - if this fails, the issue is with title rendering
3. Continue incrementally to find the exact point where it breaks

This systematic approach will help identify the exact cause of the text rendering issue.