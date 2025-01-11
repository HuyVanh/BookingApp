// src/navigation/MainNavigator.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import NotificationScreen from '../screens/NotificationScreen';
import { NotificationProvider } from '../navigation/NotificationContext';  // Import NotificationProvider

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <NavigationContainer>
      <NotificationProvider>  {/* Wrap Stack.Navigator bằng NotificationProvider */}
        <Stack.Navigator>
          <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
          />
        </Stack.Navigator>
      </NotificationProvider>
    </NavigationContainer>
  );
};

export default MainNavigator;