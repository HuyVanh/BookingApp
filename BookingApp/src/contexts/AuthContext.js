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

  // Hàm đăng xuất
  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('token');
      setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error);
    }
  };

  // Hàm đăng nhập
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {username, password});
      const userData = response.data;
      setUser(userData);
      await AsyncStorage.setItem('token', userData.token);
      setAuthToken(userData.token);
    } catch (error) {
      console.error('Login error:', error);
      setError(error);
      throw error;
    }
  };

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
