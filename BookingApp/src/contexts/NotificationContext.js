import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // Khởi tạo unreadMessages từ storage
  useEffect(() => {
    const initUnreadMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem('unreadMessages');
        if (stored) setUnreadMessages(Number(stored));
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    };
    initUnreadMessages();
  }, []);

  // Xử lý socket và tin nhắn
  useEffect(() => {
    if (!user?.token) return;

    const socket = io('http://192.168.100.101:5000', {
      transports: ['websocket'],
      auth: { token: user?.token }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      const ADMIN_ID = '675be60b39fcd18e034a7a9d';
      const currentUserId = user?.user?._id;
      const roomId = `chat_${ADMIN_ID}_${currentUserId}`;
      
      socket.emit('join_chat', { room: roomId, userId: currentUserId });
    });

    socket.on('new_message', async message => {
      console.log('New message received:', message);
      if (message?.sender?._id === '675be60b39fcd18e034a7a9d') {
        const newCount = unreadMessages + 1;
        setUnreadMessages(newCount);
        try {
          await AsyncStorage.setItem('unreadMessages', String(newCount));
          console.log('Unread messages updated:', newCount);
        } catch (error) {
          console.error('Error saving unread count:', error);
        }
      }
    });

    return () => socket.disconnect();
  }, [user?.token, unreadMessages]);

  const resetUnreadMessages = useCallback(async () => {
    try {
      await AsyncStorage.setItem('unreadMessages', '0');
      setUnreadMessages(0);
      console.log('Reset unread messages');
    } catch (error) {
      console.error('Error resetting messages:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadMessages,
    loading,
    fetchNotifications,
    resetUnreadMessages
  }), [notifications, unreadMessages, loading, fetchNotifications, resetUnreadMessages]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};