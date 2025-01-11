// App.js
import React from 'react';
import {AuthProvider} from './src/contexts/AuthContext';
import {NotificationProvider} from './src/contexts/NotificationContext';
import MainNavigator from './src/navigation/MainNavigator';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
