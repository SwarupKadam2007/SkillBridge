import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import CollegeScreen from '../screens/CollegeScreen';
import MainTabs from './Tabs';
import GigDetailsScreen from '../screens/GigDetailsScreen';
import GigApplicantsScreen from '../screens/GigApplicantsScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { session, isVerified, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={!session ? 'Auth' : isVerified ? 'Main' : 'College'}
      screenOptions={{
        headerTitleStyle: { fontWeight: '800', color: theme.colors.text },
        headerTintColor: theme.colors.primary,
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background }
      }}>
      {!session ? (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="College"
            component={CollegeScreen}
            options={{ title: 'Campus Verification', headerBackVisible: isVerified }}
          />
          <Stack.Screen
            name="GigDetails"
            component={GigDetailsScreen}
            options={{ title: 'Gig Details' }}
          />
          <Stack.Screen
            name="GigApplicants"
            component={GigApplicantsScreen}
            options={{ title: 'Student Applicants' }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ title: 'Order Details' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Campus Chat' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
