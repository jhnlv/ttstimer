// alarmService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

// Function to set the alarm
export const setAlarm = async (time, callback) => {
  try {
    // Save the alarm time in AsyncStorage
    await AsyncStorage.setItem('alarmTime', JSON.stringify(Date.now() + time));

    // Schedule the alarm callback
    setTimeout(() => {
      callback();
      // Schedule a notification for the alarm
      scheduleNotification();
    }, time);
  } catch (error) {
    console.error('Error setting alarm:', error);
  }
};

// Function to clear the alarm
export const clearAlarm = async () => {
  try {
    // Remove the alarm time from AsyncStorage
    await AsyncStorage.removeItem('alarmTime');

    // Cancel any scheduled notifications
    PushNotification.cancelAllLocalNotifications();
  } catch (error) {
    console.error('Error clearing alarm:', error);
  }
};

// Function to check if the alarm is set
export const isAlarmSet = async () => {
  try {
    // Check if alarm time exists in AsyncStorage
    const alarmTime = await AsyncStorage.getItem('alarmTime');
    return alarmTime !== null;
  } catch (error) {
    console.error('Error checking alarm:', error);
    return false;
  }
};

// Function to schedule a notification for the alarm
const scheduleNotification = () => {
  PushNotification.localNotificationSchedule({
    message: 'Alarm! Wake up!',
    date: new Date(Date.now()), // Alarm time
    actions: ['Snooze', 'Stop'], // Snooze and Stop actions
  });
};

// Function to handle user interaction with notification
export const handleNotification = (notification) => {
  // Handle user interaction with notification
  if (notification.action === 'Snooze') {
    // Snooze action
    // Implement snooze functionality here
    // For demonstration, let's snooze for 5 minutes
    const snoozeTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    setAlarm(snoozeTime, () => {
      // Callback function for snooze
      console.log('Alarm snoozed');
    });
  } else if (notification.action === 'Stop') {
    // Stop action
    clearAlarm();
  }
};
