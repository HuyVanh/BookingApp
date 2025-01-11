import React, { createContext, useState } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Giữ nguyên state notifications cho thông báo hiện tại
  const [notifications, setNotifications] = useState([]);
  // Thêm state cho tin nhắn chưa đọc
  const [unreadMessages, setUnreadMessages] = useState(0);

  const addNotification = (message, message2) => {
    const newNotification = {
      id: Date.now().toString(),
      message: message,
      message2: message2,
      timestamp: new Date(),
    };
    setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
  };

  // Thêm functions cho việc quản lý tin nhắn
  const increaseUnreadMessages = () => {
    setUnreadMessages(prev => prev + 1);
  };

  const resetUnreadMessages = () => {
    setUnreadMessages(0);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification,
        unreadMessages,
        increaseUnreadMessages,
        resetUnreadMessages 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};