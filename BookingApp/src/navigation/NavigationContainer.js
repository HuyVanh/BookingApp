// src/navigation/NavigationContainer.js
import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationProvider } from '../navigation/NotificationContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardScreen from '../screens/OnboardScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPassword';
import NextForgotPassWord from '../screens/NextForgotPassWord';
import NewForgotPassWord from '../screens/NewForgotPassWord';
import HomeScreen from '../screens/HomeScreen';
import TabNavigator from './TabNavigator';
import BookMarkScreen from '../screens/BookMarkScreen';
import InfoProfileScreen from '../screens/InfoProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import InputSearch from '../screens/InputSearch';
import WishlistScreen from '../screens/WishlistScreen';
import HotelDetailScreen from '../screens/HotelDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import AlbumScreen from '../screens/AlbumScreen';
import Payment from '../screens/Payment';
import ViewTicket from '../screens/ViewTicket';
import SelectDate from '../screens/SelectDate';
import InfoScreen from '../screens/InfoScreen';
import AllRoomScreen from '../screens/AllRoomsScreen';
import { AuthContext } from '../contexts/AuthContext';
import EmailForgotPassWordScreen from '../screens/EmailForgotPasswordScreen';
import WriteReview from '../screens/WriteReview';
import ChatScreen from '../screens/ChatScreen';

const AuthStack = createNativeStackNavigator();

const AuthStackScreen = () => (
  <AuthStack.Navigator initialRouteName="WelcomeScreen">
    <AuthStack.Screen
      name="WelcomeScreen"
      component={WelcomeScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="OnBoard"
      component={OnboardScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{
        headerTitle: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'black' }}>
            Quên mật khẩu
          </Text>
        ),
      }}
    />
    <AuthStack.Screen
      name="NextForgotPassWord"
      component={NextForgotPassWord}
      options={{
        headerTitle: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'black' }}>
            Quên mật khẩu
          </Text>
        ),
      }}
    />
    <AuthStack.Screen
      name="NewForgotPassWord"
      component={NewForgotPassWord}
      options={{
        headerTitle: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'black' }}>
            Quên mật khẩu
          </Text>
        ),
      }}
    />
    <AuthStack.Screen
      name="EmailForgotPassWordScreen"
      component={EmailForgotPassWordScreen}
      options={{
        headerTitle: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'black' }}>
            Nhập thông tin
          </Text>
        ),
      }}
    />
    {/* Thêm các màn hình khác nếu cần */}
  </AuthStack.Navigator>
);

const AppStack = createNativeStackNavigator();

const AppStackScreen = () => (
  <AppStack.Navigator initialRouteName="Tabs">
    <AppStack.Screen
      name="Tabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="BookMark"
      component={BookMarkScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="InfoProfile"
      component={InfoProfileScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="Notification"
      component={NotificationScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{  title: 'Chat với Admin',
        headerShown: true }}
    />
    <AppStack.Screen
      name="Wishlist"
      component={WishlistScreen}
      options={{  title: 'Chat với Admin',
          headerShown: true}}
    />
    <AppStack.Screen
      name="Payment"
      component={Payment}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="ViewTicket"
      component={ViewTicket}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="HotelDetail"
      component={HotelDetailScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="ReviewScreen"
      component={ReviewScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="AllroomScreen"
      component={AllRoomScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="AlbumScreen"
      component={AlbumScreen}
      options={{
        title: 'Thư viện ảnh',
        headerShown: true,
      }}
    />
    <AppStack.Screen
      name="SelectDate"
      component={SelectDate}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="InfoScreen"
      component={InfoScreen}
      options={{ headerShown: false }}
    />
      <AppStack.Screen
      name="WriteReview"
      component={WriteReview}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="InputSearch"
      component={InputSearch}
      options={{
        headerTitle: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: 'black' }}>
            Tìm kiếm
          </Text>
        ),
      }}
    />
    {/* Thêm các màn hình khác nếu cần */}
  </AppStack.Navigator>
);

const Navigation = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
   
    return null;
  }

  return (
    <NotificationProvider>
      <NavigationContainer>
        {user ? <AppStackScreen /> : <AuthStackScreen />}
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default Navigation;
