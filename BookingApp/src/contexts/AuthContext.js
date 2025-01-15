// src/contexts/AuthContext.js
import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {setAuthToken} from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Hàm lấy danh sách vé
  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error);
    }
  };

  // Hàm lấy thông báo
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error);
    }
  };
    // Hàm kiểm tra và cập nhật trạng thái user
    const checkUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setAuthToken(token);
          const response = await api.get('/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        // Nếu có lỗi, xóa token và reset user
        await AsyncStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    // Hàm đăng xuất
    const logout = async () => {
      setLoading(true);
      try {
        await AsyncStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setLoading(false);
      }
    };

   // Hàm đăng nhập
   const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {username, password});
      const userData = response.data;
      
      await AsyncStorage.setItem('token', userData.token);
      setAuthToken(userData.token);
      
      // Fetch user profile sau khi login
      const profileResponse = await api.get('/auth/me');
      setUser(profileResponse.data);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setAuthToken(token);
          const response = await api.get('/auth/me');
          
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        checkUser,
        fetchTickets,
        tickets,
        fetchNotifications,
        notifications,
        error,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
