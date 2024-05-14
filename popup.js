import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';

const CustomNotification = ({ message, onSnooze, onStop }) => {
    useEffect(() => {
        console.log('Setting timeout...');
        const timeout = setTimeout(() => {
          console.log('Timeout expired. Closing notification...');
          onStop();
        }, 120000); // Change the timeout duration as needed
      
        return () => {
          console.log('Clearing timeout...');
          clearTimeout(timeout);
        };
      }, [onStop]);

  return (
    <View style={styles.notification}>
      <Text>{message}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Snooze" onPress={onSnooze} />
        <Button title="Stop" onPress={onStop} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    zIndex: 9999,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default CustomNotification;
