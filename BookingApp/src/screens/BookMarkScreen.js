import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';

const BookMarkScreen = () => {
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchBookmarkedRooms();
  }, []);

  const fetchBookmarkedRooms = async () => {
    try {
      const response = await api.get('/bookings/user-bookings');
      const rooms = response.data;
      console.log('Dữ liệu phòng đã đặt:', rooms);

      if (Array.isArray(rooms)) {
        const formattedRooms = rooms.map(room => ({
          ...room,
          id: room.id || room.bookingId || room._id || Math.random().toString(),
          image:
            room.room?.room_images && room.room.room_images.length > 0
              ? room.room.room_images[0]
              : null,
        }));
        setRoomData(formattedRooms);
      } else {
        throw new Error('Dữ liệu trả về không phải là mảng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu phòng đã đặt:', error);
      setError(error.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };
  const goBack = () => {
    navigation.goBack();
  };

  const handleRoomPress = room => {
    navigation.navigate('ViewTicket', {booking: room.id});
  };

  const renderRoomItem = ({item}) => {
    const roomImage = item.image
      ? typeof item.image === 'string'
        ? {uri: item.image}
        : item.image
      : {uri: 'https://via.placeholder.com/100'};

    const roomName = item.room?.room_name || 'Không có tên';
    const roomAddress = item.room?.address || 'Không có địa chỉ';
    const branchName = item.room?.hotel?.name || 'Chi nhánh không xác định';
    const roomPrice =
      item.room?.price !== undefined
        ? `${item.room.price.toLocaleString('vi-VN')}₫/Ngay`
        : 'Liên hệ';

    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={{flex: 1}}
          onPress={() => handleRoomPress(item)}>
          <View style={{flexDirection: 'row'}}>
            <Image
              source={roomImage}
              style={styles.roomImage}
              resizeMode="cover"
            />
            <View style={styles.roomDetails}>
              <Text style={styles.roomName}>{roomName}</Text>
              <Text style={styles.roomAddress}>{branchName}</Text>
              <Text style={styles.roomAddress}>{roomAddress}</Text>
              <View style={styles.bookingDates}>
                <Text style={styles.dateText}>
                  Check-in:{' '}
                  {new Date(item.check_in).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.dateText}>
                  Check-out:{' '}
                  {new Date(item.check_out).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Text style={styles.roomPrice}>{roomPrice}</Text>
              <Text style={styles.roomStatus}>
                {item.payment_status === 'paid'
                  ? 'Đã thanh toán'
                  : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image
            style={styles.btn}
            source={require('../assets/iconback.png')}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách phòng đã đặt</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lỗi: {error}</Text>
          <TouchableOpacity
            onPress={fetchBookmarkedRooms}
            style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={roomData}
          renderItem={renderRoomItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
  },
  headerTitle: {
    fontSize: 20,
    left: 10,
    fontWeight: 'bold',
    color: 'black',
  },
  listContent: {
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  roomImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 15,
  },
  roomDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  roomAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 4,
  },
  roomStatus: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 4,
  },
  bookingDates: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  btn: {
    width: 25,
    height: 26,
  },
});

export default BookMarkScreen;
