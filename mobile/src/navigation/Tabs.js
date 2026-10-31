import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CreateGigScreen from '../screens/CreateGigScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import MyWorkScreen from '../screens/MyWorkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopColor: theme.colors.border
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11
        },
        tabBarIcon: ({ focused }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🔍';
          else if (route.name === 'Chats') icon = '💬';
          else if (route.name === 'Post') icon = '➕';
          else if (route.name === 'My Work') icon = '💼';
          else if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>{icon}</Text>;
        }
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chats" component={ConversationsScreen} />
      <Tab.Screen name="Post" component={CreateGigScreen} />
      <Tab.Screen name="My Work" component={MyWorkScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
