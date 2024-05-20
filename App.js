import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_TASK_NAME = 'BACKGROUND_TASK';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  console.log('Running background task');

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Background Alarm',
        body: 'Time to wake up!',
        data: { alarmId: '123' },
      },
      trigger: { seconds: 2, repeats: false },
    });

    await Speech.speak('Time to wake up!', { rate: 0.8, pitch: 1.2 });
  } catch (error) {
    console.error('Error in background task:', error);
  }
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const speaking = useRef(false);
  const speechTimer = useRef(null);
  const snoozeTimer = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
          if (notification) {
            speakNotification(notification);
          }
        });
        

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
          if (response.actionIdentifier === 'SNOOZE') {
            handleSnooze();
          } else if (response.actionIdentifier === 'STOP') {
            handleStop();
          }
        });

        schedulePushNotification();
        startBackgroundTask();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      clearTimeout(speechTimer.current);
      clearTimeout(snoozeTimer.current);
    };
  }, []);

  const startBackgroundTask = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (foregroundStatus === 'granted' && backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(BACKGROUND_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          deferredUpdatesInterval: 1000,
          showsBackgroundLocationIndicator: true,
        });
      } else {
        console.error('Permission to access location was denied');
      }
    } catch (error) {
      console.error('Error starting background task:', error);
    }
  };

  const schedulePushNotification = async () => {
    try {
      const date = new Date();
      date.setHours(2); // Set the hour to 20 (8 PM)
      date.setMinutes(17); // Set the minutes to 45

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Alarm',
          body: 'Time to wake up!',
          data: { alarmId: '123' },
          actions: [
            { identifier: 'SNOOZE', title: 'Snooze', foreground: true },
            { identifier: 'STOP', title: 'Stop', foreground: true },
          ],
        },
        trigger: { date, repeats: false },
      });
    } catch (error) {
      console.error('Error scheduling push notification:', error);
    }
  };

  const handleSnooze = async () => {
    try {
      speaking.current = false;
      clearTimeout(speechTimer.current);
      clearTimeout(snoozeTimer.current);
      
      const snoozeDuration = 2 * 60000; // 2 minutes
      snoozeTimer.current = setTimeout(() => {
        schedulePushNotification();
        speakNotification(notification);
      }, snoozeDuration);
  
      console.log('Alarm snoozed');
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  };
  
  const handleStop = async () => {
    try {
      speaking.current = false;
      clearTimeout(speechTimer.current);
      clearTimeout(snoozeTimer.current);
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Scheduled notification canceled');
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
    }
  };

  const speakNotification = async notification => {
    try {
      if (!notification || !notification.request || !notification.request.content || !notification.request.content.body) {
        // Handle the case where notification is null or its properties are not available
        console.error('Notification object or its properties are null.');
        return;
      }
  
      speaking.current = true;
      const speakOptions = { rate: 0.8, pitch: 1.2 };
      await Speech.speak(notification.request.content.body, speakOptions);
  
      speechTimer.current = setTimeout(() => {
        repeatSpeech(notification.request.content.body, 3000);
      }, 3000);
  
      snoozeTimer.current = setTimeout(() => {
        handleSnooze();
      }, 30000); // 30 seconds
    } catch (error) {
      console.error('Error speaking notification:', error);
    }
  };

  const repeatSpeech = async (text, interval) => {
    try {
      await Speech.speak(text);
      speechTimer.current = setTimeout(() => {
        repeatSpeech(text, interval);
      }, interval);
    } catch (error) {
      console.error('Error repeating speech:', error);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
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
      alert('Failed to get push token for push notification!');
      return;
    }
    // Replace 'your-project-id' with your actual project ID
    token = (await Notifications.getExpoPushTokenAsync({ projectId: 'e0ce0f9e-ebb3-42a3-b08e-e075a0055b65' })).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
