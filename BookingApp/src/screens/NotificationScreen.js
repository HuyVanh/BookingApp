import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      // Sau khi đánh dấu đã đọc, fetch lại dữ liệu mới
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  useEffect(() => {
    fetchNotifications();
    markAllAsRead();
  }, []);

  // Hàm định dạng ngày
  const formatDate = timestamp => {
    const today = new Date();
    const notificationDate = new Date(timestamp);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    if (notificationDate >= todayStart) {
      return 'Hôm nay';
    } else if (notificationDate >= yesterdayStart) {
      return 'Hôm qua';
    } else {
      return notificationDate.toLocaleDateString('vi-VN');
    }
  };

  // Nhóm thông báo theo ngày
  const groupedNotifications = notifications.reduce((acc, item) => {
    const dateLabel = formatDate(item.created_at);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(item);
    return acc;
  }, {});

  const goBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image
            style={styles.btn}
            source={require('../assets/iconback.png')}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NotifiScreen')}>
          <Image
            style={styles.btn2}
            source={require('../assets/iconmenu.png')}
          />
        </TouchableOpacity>
      </View>

      {/* Nội dung chính */}
      {notifications.length === 0 ? (
        // Không có thông báo
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có thông báo nào.</Text>
        </View>
      ) : (
        // Có thông báo
        <ScrollView contentContainerStyle={styles.maincontent}>
          {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
            <View key={dateLabel}>
              <Text style={styles.dateHeader}>{dateLabel}</Text>
              {items.map(item => (
                <View key={item._id} style={styles.no1}>
                  <View style={styles.no1img}>
                    <Image
                      source={
                        item.type === 'success'
                          ? require('../assets/icones1.png')
                          : item.content.includes('hủy phòng')
                          ? require('../assets/icones2.png')
                          : require('../assets/smss.png')
                      }
                      style={styles.no1icon}
                    />
                  </View>
                  <View style={styles.no1title}>
                    <Text style={styles.no1txt}>{item.title}</Text>
                    <Text style={styles.no1txt2}>{item.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  header: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
  },
  btn: {
    width: 25,
    height: 26,
  },
  btn2: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#000000',
  },
  maincontent: {
    padding: 10,
  },
  dateHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  no1: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
  },
  no1img: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6A6A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  no1icon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  no1title: {
    flex: 1,
  },
  no1txt: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  no1txt2: {
    fontSize: 14,
    color: '#777777',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#777',
  },
});

export default NotificationScreen;
