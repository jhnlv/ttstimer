import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import CustomNotification from './popup'; // Import the CustomNotification component
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const event = {
  title: 'BELLE',
  description: 'Hello everyone! My name is BELLE. I am an AI that will assist you with your scheduling plans. Reminder: I am here to help you stay on track!',
  alarm_time: new Date('2024-05-15T03:59:00'), // Set the alarm time to a specific date and time
};

export default function App() {
  const [notificationReceived, setNotificationReceived] = useState(false);
  const [speakingInterval, setSpeakingInterval] = useState(null);
  const [snoozeInterval, setSnoozeInterval] = useState(null);

  

  useEffect(() => {
    console.log('Configuring notifications...');
    configureNotifications();
  }, []);

  const configureNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => {
        console.log('Notification received');
        setNotificationReceived(true); // Set notification received state
       const timeinterval = setInterval(() => {
          speakEvent();
        }, 3000);
        setSpeakingInterval(timeinterval)
          speakEvent(); // Call speakEvent function when a notification is received
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    scheduleAlarm(event);
  };

  const scheduleAlarm = async (event) => {
    try {
      console.log('Scheduling alarm...');
      const trigger = new Date(event.alarm_time);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: event.title,
          body: event.description,
          sound: 'default',
        },
        trigger: {
          date: trigger,
        },
      });
    } catch (error) {
      console.error('Error scheduling alarm:', error);
    }
  };

  const handleSnooze = async () => {
    try {
      console.log('Handling snooze...');
      Speech.stop();
      clearInterval(speakingInterval);
      setSpeakingInterval(null);
      clearInterval(snoozeInterval); // Clear existing snooze interval
      setSnoozeInterval(null); // Reset snooze interval state
      setNotificationReceived(false); // Reset notification received state
  
      
  
      // Schedule a new notification for 5 minutes from now
      const snoozeTrigger = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: event.title,
          body: event.description,
          sound: 'default',
        },
        trigger: {
          date: snoozeTrigger,
        },
      });

      // Set a new snooze interval
      const newSnoozeInterval = setInterval(() => {
        console.log('Snoozing alarm...');
        Speech.speak(event.description);
      }, 5 * 60 * 1000);
      setSnoozeInterval(newSnoozeInterval);
    } catch (error) {
      console.error('Error snoozing alarm:', error);
    }
  };
  
  const handleStop = async () => {
    console.log('Handling stop...');
    Speech.stop();
    setNotificationReceived(false); // Reset notification received state
    //await Notifications.cancelAllScheduledNotificationsAsync();
    
    clearInterval(snoozeInterval);clearInterval(speakingInterval);
  };

  const speakEvent = () => {
    console.log('Speaking event...');
    Speech.speak(event.description, {
      onDone: () => {
        // If notification is received, speak again
        if (notificationReceived) {
          speakEvent();
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      {notificationReceived && (
        <CustomNotification
          message={event.description}
          onSnooze={handleSnooze}
          onStop={handleStop}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});