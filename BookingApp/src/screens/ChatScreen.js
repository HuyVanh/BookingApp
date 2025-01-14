// src/screens/Chat.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import io from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chat = () => {
  const route = useRoute();
  const { userId: adminId, hotelName, roomId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const getStorageKey = () => {
    const userId = user?.user?._id;
    if (!userId || !adminId) return null;
    return `chat_messages_${userId}_${adminId}`;
  };

  const saveMessagesToStorage = async (messagesToSave) => {
    try {
      const storageKey = getStorageKey();
      if (!storageKey || !Array.isArray(messagesToSave)) return;

      if (messagesToSave.length > 0) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(messagesToSave));
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const loadMessagesFromStorage = async () => {
    try {
      const storageKey = getStorageKey();
      if (!storageKey) {
        return [];
      }

      const storedMessages = await AsyncStorage.getItem(storageKey);
      if (!storedMessages) {
        return [];
      }

      const parsedMessages = JSON.parse(storedMessages);
      if (!Array.isArray(parsedMessages)) {
        return [];
      }

      const validMessages = parsedMessages.filter(msg => 
        msg && msg._id && msg.content && 
        (msg.senderId || msg.sender) && 
        (msg.receiverId || msg.receiver)
      );

      return validMessages;
    } catch (error) {
      console.error('Error loading messages from storage:', error);
      return [];
    }
  };

  const fetchMessages = async () => {
    try {
      await AsyncStorage.removeItem(getStorageKey());
      
      const response = await api.get(`/messages/${adminId}`);

      
      if (response.data.success) {
        const apiMessages = response.data.messages || [];
        
        // Kiểm tra cấu trúc của mỗi tin nhắn
        const validMessages = apiMessages.map(msg => {
          return {
            _id: msg._id,
            content: msg.content,
            senderId: msg.sender?._id || msg.sender,
            receiverId: msg.receiver?._id || msg.receiver,
            sender: msg.sender, // Đảm bảo giữ toàn bộ thông tin sender
            receiver: msg.receiver, // Đảm bảo giữ toàn bộ thông tin receiver
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            room: msg.room
          };
        });
  
        setMessages(validMessages);
        
        if (validMessages.length > 0) {
          await saveMessagesToStorage(validMessages);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      // Load messages từ storage trước
      const storedMessages = await loadMessagesFromStorage();
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      }
      
      // Fetch từ API và merge với messages hiện tại
      await fetchMessages();
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = (chatRoomId) => {
    socketRef.current = io('https://backendbookingapp-2fav.onrender.com', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: user?.token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsConnected(true);

      socketRef.current.emit('join_chat', {
        room: chatRoomId,
        userId: user.user._id
      });
    });

    socketRef.current.on('new_message', message => {
      console.log('New message received:', message);
      if (message && message.room === chatRoomId) {
        setMessages(prev => {
          const prevMessages = Array.isArray(prev) ? prev : [];
          // Kiểm tra tin nhắn đã tồn tại
          if (prevMessages.some(msg => msg._id === message._id)) {
            return prevMessages;
          }
          const newMessages = [...prevMessages, message]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          saveMessagesToStorage(newMessages);
          return newMessages;
        });
        scrollToBottom();
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
      setIsConnected(false);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected || !socketRef.current) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        receiverId: adminId,
        senderId: user.user._id,
        room: roomId
      };

      console.log('Sending message:', messageData);

      const response = await api.post('/messages/send', messageData);
      console.log('Send message response:', response.data);

      if (response.data.success && response.data.message) {
        socketRef.current.emit('send_message', {
          ...response.data.message,
          room: roomId
        });

        setMessages(prev => {
          const prevMessages = Array.isArray(prev) ? prev : [];
          const newMessages = [...prevMessages, response.data.message]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          saveMessagesToStorage(newMessages);
          return newMessages;
        });
        
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (!user?.user?._id) return;

    console.log('Chat initialized with:', {
      roomId,
      adminId,
      currentUserId: user.user._id
    });

    initializeSocket(roomId);
    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_chat', { room: roomId });
        socketRef.current.disconnect();
      }
    };
  }, [user, roomId, adminId]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutes}`;
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender?._id === user.user._id;
    const timeString = formatTime(item.createdAt);
  
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.sender?.username}</Text>
        )}
        <View 
          style={[
            styles.messageContent,
            isMyMessage ? styles.myMessageContent : styles.otherMessageContent
          ]}>
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text 
              style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.otherTimeText
              ]}>
              {timeString}
            </Text>
            {isMyMessage && item.isRead && (
              <Icon name="checkmark-done" size={16} color="#34B7F1" />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{hotelName}</Text>
        {!isConnected && (
          <Text style={styles.connectionStatus}>Đang kết nối lại...</Text>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || !isConnected}>
            <Icon
              name="send"
              size={24}
              color={newMessage.trim() && isConnected ? '#fff' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
  },
  myMessageContent: {
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4, 
  },
  otherMessageContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4, 
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',  
  },
  otherMessageText: {
    color: '#000',  
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',  
  },
  otherTimeText: {
    color: 'rgba(0, 0, 0, 0.5)', 
  }, 
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#0084ff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});

export default Chat;