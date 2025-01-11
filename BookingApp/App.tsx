// App.js
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import Navigation from './src/navigation/NavigationContainer'; 

const App = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_51QaDsZFjlg4xit6tIo2lhs9PWKeXEpAJQhnw8Ci7Y9NYdE2OB0HRUdQFUX88Zl2k5SjL9oi8adpowzbM2cn5Qct700jqGaHIHG">
      <Navigation />
    </StripeProvider>
  );
};

export default App;
