// index.js
import {AppRegistry} from 'react-native';
import React from 'react';
import App from './App';
import {name as appName} from './app.json';
import {AuthProvider} from './src/contexts/AuthContext';
import {NotificationProvider} from './src/contexts/NotificationContext';

const Root = () => (
  <AuthProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </AuthProvider>
);

AppRegistry.registerComponent(appName, () => Root);
