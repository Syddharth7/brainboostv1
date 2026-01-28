import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { useAuthStore } from './src/store/authStore';
import { api } from './src/services/api';
import Constants from 'expo-constants';

// Conditionally import notifications (may not work in Expo Go)
let Notifications = null;
let Device = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Configure notification handler - this enables notifications when app is in FOREGROUND
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('Notifications not available:', error);
}

// Register for push notifications
async function registerForPushNotificationsAsync() {
  if (!Notifications || !Device) {
    console.log('Notifications not available in this environment');
    return null;
  }

  let token = null;

  try {
    // Set up Android notification channel (required for Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // CRITICAL: For production builds, you MUST provide the projectId
      // This is your EAS project ID from app.json -> extra.eas.projectId
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('No projectId found - using default Expo token (may not work in production)');
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId || '0ee1986c-d00b-4402-b526-89a21a09e981', // Fallback to your project ID
      })).data;

      console.log('Push token:', token);
      console.log('Project ID used:', projectId || '0ee1986c-d00b-4402-b526-89a21a09e981');
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log('Error getting push token:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
  }

  return token;
}

// Notification registration component
function NotificationHandler() {
  const notificationListenerRef = useRef(null);
  const responseListenerRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Skip if notifications not available
    if (!Notifications) {
      console.log('Notifications not available, skipping registration');
      return;
    }

    // Register push token when user is logged in
    const registerToken = async () => {
      if (user?.id) {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await api.users.registerPushToken(user.id, token);
            console.log('Push token registered for user:', user.id);
          }
        } catch (error) {
          console.error('Error registering push token:', error);
        }
      }
    };

    registerToken();

    // Handle notification received while app is open
    try {
      if (Notifications.addNotificationReceivedListener) {
        notificationListenerRef.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });
      }

      // Handle notification tap
      if (Notifications.addNotificationResponseReceivedListener) {
        responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification tapped:', response);
        });
      }
    } catch (error) {
      console.log('Error setting up notification listeners:', error);
    }

    return () => {
      // Cleanup - safely remove subscriptions
      try {
        if (notificationListenerRef.current && notificationListenerRef.current.remove) {
          notificationListenerRef.current.remove();
        }
        if (responseListenerRef.current && responseListenerRef.current.remove) {
          responseListenerRef.current.remove();
        }
      } catch (error) {
        console.log('Error cleaning up notification listeners:', error);
      }
    };
  }, [user]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <NotificationHandler />
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
