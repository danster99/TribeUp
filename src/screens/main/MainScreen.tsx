import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors } from '../../utils/colors';
import { RootState } from '../../store';

// Import all screen components
import HomeScreen from './HomeScreen';
import ComingSoonScreen from './ComingSoonScreen';
import MessagesScreen from './MessagesScreen';
import MyActivitiesScreen from './MyActivitiesScreen';
import CreateActivityScreen from '../activity/CreateActivityScreen';
import ActivityDetailsScreen from '../activity/ActivityDetailsScreen';
import EditActivityScreen from '../activity/EditActivityScreen';
import ChatScreen from '../chat/ChatScreen';
import ProfileScreen from './ProfileScreen';
import EditProfileScreen from '../profile/EditProfileScreen';

// Import the persistent tab bar and discrete header
import PersistentTabBar from '../../components/navigation/PersistentTabBar';
import DiscreteHeader from '../../components/common/DiscreteHeader';

export type ScreenName =
  | 'Home'
  | 'ComingSoon'
  | 'Messages'
  | 'Create'
  | 'MyActivities'
  | 'ActivityDetails'
  | 'CreateActivity'
  | 'EditActivity'
  | 'Chat'
  | 'Profile'
  | 'EditProfile';

interface MainScreenProps {
  route?: any;
  navigation?: any;
}

const MainScreen: React.FC<MainScreenProps> = ({ route, navigation }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenName>('Home');
  const [screenParams, setScreenParams] = useState<any>(null);

  // Get unread message counts from Redux
  const { unreadCounts } = useSelector((state: RootState) => state.chat);
  const hasUnreadMessages = Object.values(unreadCounts).some(count => count > 0);


  // Function to change screens programmatically (mimics React Navigation)
  const navigateToScreen = (screenName: ScreenName | string, params?: any) => {
    // Map React Navigation screen names to our screen names
    const screenNameMap: { [key: string]: ScreenName } = {
      'ActivityDetails': 'ActivityDetails',
      'EditActivity': 'EditActivity',
      'Chat': 'Chat',
      'Profile': 'Profile',
      'EditProfile': 'EditProfile',
      'CreateActivity': 'CreateActivity', // Separate screen for create activity
      'Home': 'Home',
      'ComingSoon': 'ComingSoon',
      'Messages': 'Messages',
      'MyActivities': 'MyActivities',
    };

    const mappedScreenName = screenNameMap[screenName as string] || screenName as ScreenName;
    setActiveScreen(mappedScreenName);
    setScreenParams(params);
  };

  // Create custom navigation object
  const customNavigation = {
    // Preserve any other navigation methods that might be needed FIRST
    ...(navigation || {}),
    // Then override with our custom methods (this ensures they take precedence)
    navigate: (screenName: string, params?: any) => {
      navigateToScreen(screenName, params);
    },
    goBack: () => {
      // Go back to the appropriate tab screen or Home
      if (['ActivityDetails', 'CreateActivity', 'EditActivity', 'Chat', 'Profile', 'EditProfile'].includes(activeScreen)) {
        setActiveScreen('Home');
        setScreenParams(null);
      }
    },
    push: (screenName: string, params?: any) => {
      navigateToScreen(screenName, params);
    },
    replace: (screenName: string, params?: any) => {
      navigateToScreen(screenName, params);
    },
    reset: () => {
      setActiveScreen('Home');
      setScreenParams(null);
    },
    // Navigation state properties
    canGoBack: () => activeScreen !== 'Home',
    isFocused: () => true,
  };

  // Render the appropriate screen based on activeScreen
  const renderCurrentScreen = () => {

    const screenProps = {
      route: { params: screenParams },
      navigation: customNavigation
    };

    switch (activeScreen) {
      case 'Home':
        return <HomeScreen {...screenProps} />;
      case 'ComingSoon':
        return <ComingSoonScreen {...screenProps} />;
      case 'Messages':
        return <MessagesScreen {...screenProps} />;
      case 'Create':
        return <CreateActivityScreen {...screenProps} />;
      case 'MyActivities':
        return <MyActivitiesScreen {...screenProps} />;
      case 'ActivityDetails':
        return <ActivityDetailsScreen {...screenProps} />;
      case 'CreateActivity':
        return <CreateActivityScreen {...screenProps} />;
      case 'EditActivity':
        return <EditActivityScreen {...screenProps} />;
      case 'Chat':
        return <ChatScreen {...screenProps} />;
      case 'Profile':
        return <ProfileScreen {...screenProps} />;
      case 'EditProfile':
        return <EditProfileScreen {...screenProps} />;
      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  // Determine which tab should be highlighted
  const getActiveTab = (): 'ComingSoon' | 'Messages' | 'Home' | 'Create' | 'MyActivities' => {
    // Secondary screens should highlight their parent tab
    switch (activeScreen) {
      case 'ActivityDetails':
      case 'EditActivity':
        return 'MyActivities'; // Activity-related screens highlight MyActivities
      case 'Chat':
      case 'Profile':
      case 'EditProfile':
        return 'Home'; // Other secondary screens default to Home
      case 'CreateActivity':
        return 'Create'; // CreateActivity highlights the Create tab
      case 'Home':
      case 'ComingSoon':
      case 'Messages':
      case 'Create':
      case 'MyActivities':
        return activeScreen;
      default:
        return 'Home';
    }
  };

  // Get the appropriate title for the current screen
  const getScreenTitle = (): string => {
    switch (activeScreen) {
      case 'Home':
        return 'Home';
      case 'ComingSoon':
        return 'New Feature';
      case 'Messages':
        return 'Messages';
      case 'Create':
        return 'Create Activity';
      case 'MyActivities':
        return 'My Activities';
      case 'ActivityDetails':
        return 'Activity Details';
      case 'CreateActivity':
        return 'Create Activity';
      case 'EditActivity':
        return 'Edit Activity';
      case 'Chat':
        return 'Chat';
      case 'Profile':
        return 'Profile';
      case 'EditProfile':
        return 'Edit Profile';
      default:
        return 'TribeUp';
    }
  };

  // Handle back button for specific screens
  const getBackButtonProps = () => {
    if (activeScreen === 'ActivityDetails') {
      return {
        showBackButton: true,
        onBackPress: () => {
          setActiveScreen('MyActivities');
        }
      };
    } else if (activeScreen === 'EditActivity') {
      return {
        showBackButton: true,
        onBackPress: () => {
          setActiveScreen('ActivityDetails');
        }
      };
    } else if (activeScreen === 'Chat') {
      return {
        showBackButton: true,
        onBackPress: () => {
          setActiveScreen('Messages');
        }
      };
    }
    return {
      showBackButton: false,
      onBackPress: undefined
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <DiscreteHeader
        title={getScreenTitle()}
        navigation={customNavigation}
        {...getBackButtonProps()}
      />

      <View style={[styles.screenContainer, activeScreen === 'Chat' && styles.chatScreenContainer]}>
        {renderCurrentScreen()}
      </View>

      {activeScreen !== 'Chat' && (
        <PersistentTabBar
          activeTab={getActiveTab()}
          onTabPress={(tabName) => {
            setActiveScreen(tabName);
            setScreenParams(null);
          }}
          hasUnreadMessages={hasUnreadMessages}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 60, // Further reduced space for tab bar
  },
  chatScreenContainer: {
    paddingBottom: 0, // Remove bottom padding for chat screen
    margin: 0,
    padding: 0,
  },
});

export default MainScreen;