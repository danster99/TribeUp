# 🛠️ TribeUp Debugging Guide

## 🎯 Current Issues
1. **Text Rendering**: "Text strings must be rendered within a <Text> component" errors
2. **Firebase Permissions**: "Missing or insufficient permissions" when joining activities

## 🔍 Text Rendering Debug Process

The app now uses `TestActivityCard` with incremental levels to isolate the issue:

### Step 1: Test Level 1 (Fixed Text)
- Current setting: `testLevel={1}` in `HomeScreen.tsx`
- **What it does**: Shows only hardcoded "TEST LEVEL 1" text
- **Expected**: Should work without errors
- **If fails**: Issue is with Card component or SwipeCards library

### Step 2: Test Level 2 (Dynamic Title)
- Change to: `testLevel={2}` in `HomeScreen.tsx` line 162
- **What it does**: Shows dynamic title from activity data
- **Expected**: Should show actual activity titles
- **If fails**: Issue is with title data rendering

### Step 3: Test Level 3 (Title + Description)
- Change to: `testLevel={3}` in `HomeScreen.tsx` line 162
- **What it does**: Shows title and description
- **If fails**: Issue is with description data rendering

### Step 4: Test Level 4 (All Data)
- Change to: `testLevel={4}` in `HomeScreen.tsx` line 162
- **What it does**: Shows all safe data fields
- **If fails**: Issue is with type data rendering

## 📊 Debug Logs to Watch For

### Text Rendering Logs:
```
🎯 ActivityCard rendering with: {...}  // Basic activity info
🧪 TestActivityCard Level X rendering: {...}  // Test component info
🔧 Level X safe values: {...}  // Safe value creation
```

### Firebase Auth Logs:
```
🚀 Attempting to join activity: {...}
📄 Activity data: {...}
🔐 Current user attempting join: ...
👤 Activity organizer: ...
👥 Current participants: [...]
🔒 Firebase auth state check...
🔒 Current auth user: ...
🔒 Auth user matches?: true/false
```

## 🔥 Firebase Permissions Fix

### Check Current Rules:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Firestore Database** → **Rules**

### Apply Simple Rules:
Copy this into Firebase Console Rules editor and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.organizerId;
    }
    match /chats/{activityId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🧪 Testing Workflow

1. **Start with TestLevel 1** - verify basic rendering works
2. **Increment levels gradually** - find exact point of failure  
3. **Check Firebase auth logs** - ensure user is properly authenticated
4. **Apply Firebase rules** - ensure permissions are correct
5. **Test joining activities** - should work after rules are applied

## 📝 Next Steps After Testing

Once you identify the issue:
- **If Level 1 fails**: Issue is with SwipeCards or Card component
- **If Level 2+ fails**: Issue is with specific data rendering
- **For Firebase**: Auth logs will show if user authentication is the problem

Report back with the specific level where it breaks and I'll provide targeted fixes!