import React, { useContext } from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Thêm import Icon
import { AuthContext } from '../contexts/AuthContext';

// User Screens
import HomeScreen from '../screens/HomeScreen';
import SearchSrceen from '../screens/SearchSrceen';
import MyBookingScreen from '../screens/MyBookingScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Staff Screens
import QRScannerScreen from '../screens/staff/QRScannerScreen';
import ScanHistoryScreen from '../screens/staff/ScanHistoryScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { user } = useContext(AuthContext);
  const isStaff = user?.user?.role === 'staff';

  const getIcon = (route, focused) => {
    if (isStaff) {
      // Dùng vector icons cho staff
      let iconName;
      const size = 24;
      const color = focused ? '#007BFF' : '#666';

      if (route.name === 'Scanner') {
        iconName = 'scan';
      } else if (route.name === 'History') {
        iconName = 'time';
      } else if (route.name === 'StaffProfile') {
        iconName = 'person';
      }

      return <Icon name={iconName} size={size} color={color} />;
    } else {
      // Giữ nguyên icons cho user app
      let iconName;
      if (route.name === 'Home') {
        iconName = focused
          ? require('../assets/homeOpen.png')
          : require('../assets/homeClose.png');
      } else if (route.name === 'Search') {
        iconName = focused
          ? require('../assets/searchOpen.png')
          : require('../assets/searchClose.png');
      } else if (route.name === 'MyBooking') {
        iconName = focused
          ? require('../assets/BookingOn.png')
          : require('../assets/BookingOff.png');
      } else if (route.name === 'Profile') {
        iconName = focused
          ? require('../assets/profileOpen.png')
          : require('../assets/profileClose.png');
      }
      return <Image source={iconName} style={{width: 24, height: 24}} />;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({focused}) => getIcon(route, focused),
      })}>
      {isStaff ? (
        // Tab screens cho Staff
        <>
          <Tab.Screen
            name="Scanner"
            component={QRScannerScreen}
            options={{title: 'Quét vé'}}
          />
          <Tab.Screen
            name="History"
            component={ScanHistoryScreen}
            options={{title: 'Lịch sử'}}
          />
          <Tab.Screen
            name="StaffProfile"
            component={StaffProfileScreen}
            options={{title: 'Cá nhân'}}
          />
        </>
      ) : (
        // Tab screens cho User
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Trang Chủ'}}
          />
          <Tab.Screen
            name="Search"
            component={SearchSrceen}
            options={{title: 'Tìm kiếm'}}
          />
          <Tab.Screen
            name="MyBooking"
            component={MyBookingScreen}
            options={{title: 'Đặt Phòng'}}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{title: 'Cá Nhân'}}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default TabNavigator;