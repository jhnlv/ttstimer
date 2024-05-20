import { registerTaskAsync } from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { schedulePushNotification } from './App'; // Import your notification scheduling function

// Define a unique task name
const BACKGROUND_TASK_NAME = 'BACKGROUND_TASK_NAME';

// Register the background task
registerTaskAsync(BACKGROUND_TASK_NAME, async () => {
  try {
    // Handle background task logic here, such as handling notifications
    await schedulePushNotification(); // Example: Schedule a notification
    console.log('Background task executed successfully');
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Error executing background task:', error);
    return BackgroundFetch.Result.Failed;
  }
});

// Function to start background task
const startBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60, // Interval in minutes
      stopOnTerminate: false, // Keep the task running even when the app is terminated
      startOnBoot: true, // Start the task when the device boots up
    });
    console.log('Background task registered successfully');
  } catch (error) {
    console.error('Error registering background task:', error);
  }
};

// Call the function to start the background task
startBackgroundTask();
