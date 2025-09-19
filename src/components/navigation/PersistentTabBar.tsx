import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../utils/colors';

type TabName = 'ComingSoon' | 'Messages' | 'Home' | 'Create' | 'MyActivities';

type TabItem = {
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const tabs: TabItem[] = [
  {
    name: 'ComingSoon',
    label: 'New Feature',
    icon: 'rocket-outline',
    activeIcon: 'rocket',
    color: colors.secondary,
  },
  {
    name: 'Messages',
    label: 'Messages',
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
    color: colors.pink,
  },
  {
    name: 'Home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    color: colors.primary,
  },
  {
    name: 'Create',
    label: 'Create',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
    color: colors.accent,
  },
  {
    name: 'MyActivities',
    label: 'My Activities',
    icon: 'grid-outline',
    activeIcon: 'grid',
    color: colors.blue,
  },
];

interface PersistentTabBarProps {
  activeTab: TabName;
  onTabPress: (tabName: TabName) => void;
  hasUnreadMessages?: boolean;
}

const PersistentTabBar: React.FC<PersistentTabBarProps> = ({ activeTab, onTabPress, hasUnreadMessages = false }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: 70 + Math.max(insets.bottom - 8, 0),
        }
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.name === activeTab;
        const iconColor = isActive ? tab.color : colors.gray400;
        const iconSize = isActive && tab.name === 'Home' ? 26 : 22;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={iconSize}
                color={iconColor}
              />
              {tab.name === 'Messages' && hasUnreadMessages && (
                <View style={styles.unreadDot} />
              )}
            </View>
            <Text style={[
              styles.tabLabel,
              {
                color: iconColor,
                fontWeight: isActive ? '700' : '600',
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PersistentTabBar;