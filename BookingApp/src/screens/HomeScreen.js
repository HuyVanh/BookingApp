import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';
import {AuthContext} from '../contexts/AuthContext';
import {NotificationContext} from '../navigation/NotificationContext';
import io from 'socket.io-client';

const HomeScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigation = useNavigation();
  const [allRooms, setAllRooms] = useState([]);
  const [suggestedRooms, setSuggestedRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [bookedRoomsData, setBookedRoomsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const {
    notifications,
    unreadMessages,
    increaseUnreadMessages,
    resetUnreadMessages,
  } = useContext(NotificationContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const {user} = useContext(AuthContext);
  const userData = user?.user;

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const count = response.data.filter(noti => !noti.is_read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);
  useEffect(() => {
    if (!user?.token) return;

    // Khởi tạo socket connection
    const newSocket = io('http://192.168.100.101:5000', {
      transports: ['websocket'],
      auth: {
        token: user?.token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected in Home:', newSocket.id);

      // Join room khi kết nối thành công
      const ADMIN_ID = '675be60b39fcd18e034a7a9d';
      const currentUserId = user?.user?._id;
      const roomId = `chat_${ADMIN_ID}_${currentUserId}`;

      newSocket.emit('join_chat', {
        room: roomId,
        userId: currentUserId,
      });
      console.log('Joined chat room:', roomId);
    });

    // Sửa lại phần lắng nghe tin nhắn mới
    newSocket.on('new_message', message => {
      console.log('Raw message received:', message);

      // Kiểm tra chi tiết message
      if (!message || !message.sender) {
        console.log('Invalid message format');
        return;
      }

      const isFromAdmin = message.sender._id === '675be60b39fcd18e034a7a9d';
      console.log('Message is from admin:', isFromAdmin);

      if (isFromAdmin) {
        console.log('Increasing unread count due to admin message');
        increaseUnreadMessages();
      }
    });

    // Thêm socket event handlers khác
    newSocket.on('room_joined', data => {
      console.log('Successfully joined room:', data);
    });

    newSocket.on('connect_error', error => {
      console.log('Socket connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected in Home');
    });

    setSocket(newSocket);

    // Cleanup khi component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        
      }
    };
  }, [user, increaseUnreadMessages]);

  // Thêm log để theo dõi unreadMessages
  useEffect(() => {
    
  }, [unreadMessages]); 

  useEffect(() => {
    
  }, [unreadMessages]);

  const handleViewAll = () => {
    navigation.navigate('BookMark');
  };
  const handleViewAllroom = () => {
    navigation.navigate('AllroomScreen');
  };
  const handleNotification = () => {
    navigation.navigate('Notification');
  };
  const handleChat = () => {
    const ADMIN_ID = '674eb2757ea4d3821cb1624e';
    const currentUserId = user?.user?._id;
    const roomId = `chat_${ADMIN_ID}_${currentUserId}`;
    resetUnreadMessages();

    navigation.navigate('Chat', {
      userId: ADMIN_ID,
      hotelName: 'Hỗ trợ khách hàng',
      roomId: roomId,
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });

    return unsubscribe;
  }, [navigation]);
  useEffect(() => {
    fetchNotifications();
  }, []);
  const handleWishlist = () => {
    navigation.navigate('Wishlist', {bookmarkedHotels: []});
  };
  const handleHotelPress = room => {
    navigation.getParent().navigate('HotelDetail', {roomId: room._id});
  };

  // Lấy dữ liệu từ API
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [allRes, popularRes, trendingRes, suggestedRes] = await Promise.all(
        [
          api.get('/rooms', {params: {isActive: true}}),
          api.get('/rooms/popular', {params: {isActive: true}}),
          api.get('/rooms/trending', {params: {isActive: true}}),
          api.get('/rooms/suggested', {params: {isActive: true}}),
        ],
      );

      setAllRooms(allRes.data || []);
      setPopularRooms(popularRes.data || []);
      setTrendingRooms(trendingRes.data || []);
      setSuggestedRooms(suggestedRes.data || []);
    } catch (error) {
      console.error('Error:', error);
      setAllRooms([]);
      setPopularRooms([]);
      setTrendingRooms([]);
      setSuggestedRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedRooms = async () => {
    try {
      const response = await api.get('/bookings/user-bookings');
      const activeBookings = response.data.filter(
        booking => booking.status !== 'canceled',
      );
      setBookedRoomsData(activeBookings);
    } catch (error) {
      console.error('Error fetching booked rooms:', error);
      if (error.response) {
      }
      setBookedRoomsData([]);
    }
  };
  useEffect(() => {
    fetchRooms();
    fetchBookedRooms();
  }, []);

  const renderRoomCards = rooms => {
    if (!Array.isArray(rooms)) return null;
    return rooms.map((room, index) => {
      if (!room) return null;
      const roomImage =
        room.room_images && room.room_images[0]
          ? room.room_images[0]
          : 'https://example.com/default_image.jpg';

      const roomName = room.room_name || 'Không có tên';
      const roomAddress = room.address || 'Không có địa chỉ';
      const roomPrice =
        room.price !== undefined
          ? room.price.toLocaleString('vi-VN')
          : 'Liên hệ';
      const roomRating =
        room.rating !== undefined ? room.rating : 'Chưa có đánh giá';
      const branchName =
        room.hotel && room.hotel.name
          ? room.hotel.name
          : 'Chi nhánh không xác định';

      return (
        <TouchableOpacity
          key={room._id || index}
          onPress={() => handleHotelPress(room)}>
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              <Image source={{uri: roomImage}} style={styles.cardImage} />
              <View style={styles.cardDetails}>
                <TouchableOpacity style={styles.wishlistButton}>
                  <Image
                    source={require('../assets/wishlistOn.png')}
                    style={styles.cardWishlistIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.cardTitle}>{roomName}</Text>
                <Text style={styles.cardAddress}>{branchName}</Text>
                <Text style={styles.cardAddress}>{roomAddress}</Text>
                <Text style={styles.cardPrice}>{roomPrice}₫/Ngày</Text>
                <Text style={styles.cardRating}>★ {roomRating}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderBookingCards = bookings => {
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return (
        <View style={styles.emptyBooking}>
          <Text style={styles.emptyText}>Chưa có phòng nào được đặt</Text>
        </View>
      );
    }

    return bookings.map((booking, index) => {
      const room = booking.room;
      if (!room) return null;

      const roomImage =
        room.room_images && room.room_images[0]
          ? room.room_images[0]
          : 'https://example.com/default_image.jpg';

      return (
        <TouchableOpacity
          key={booking._id || index}
          onPress={() =>
            navigation.navigate('ViewTicket', {booking: booking._id})
          }>
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              <Image source={{uri: roomImage}} style={styles.cardImage} />
              <View style={styles.cardDetails}>
                <TouchableOpacity style={styles.wishlistButton}>
                  <Image
                    source={require('../assets/wishlistOn.png')}
                    style={styles.cardWishlistIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.cardTitle}>{room.room_name}</Text>
                <Text style={styles.cardAddress}>{room.address}</Text>
                <Text style={styles.cardPrice}>
                  {room.price?.toLocaleString('vi-VN')}₫/Ngày
                </Text>
                <Text style={styles.cardStatus}>
                  {booking.payment_status === 'paid'
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const getCategoryData = () => {
    if (selectedCategory === 'All') return allRooms || [];
    if (selectedCategory === 'Gợi ý cho bạn') return suggestedRooms || [];
    if (selectedCategory === 'Phổ biến') return popularRooms || [];
    if (selectedCategory === 'Xu hướng') return trendingRooms || [];
    return [];
  };
  useEffect(() => {
  }, [unreadMessages]);
  useEffect(() => {
    if (user?.user) {
      setCurrentUser(user.user);
      console.log("User data updated:", user.user); // Debug log
    }
  }, [user]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/IconLogo.png')} style={styles.logo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Smart Hotel</Text>
          <Text style={styles.subHeaderText}>
            {userData?.username
              ? `Hello, ${userData.username}`
              : 'Hello, My Friend'}
          </Text>
        </View>
        <View style={styles.iconsContainer}>
          <TouchableOpacity onPress={handleNotification}>
            <View style={styles.notificationContainer}>
              <Image
                source={
                  unreadCount > 0
                    ? require('../assets/notificationOn.webp')
                    : require('../assets/notificationOff.png')
                }
                style={styles.icon}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChat}>
            <View style={styles.notificationContainer}>
              <Image
                source={require('../assets/messages.png')}
                style={styles.icon}
              />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWishlist}>
            <Image
              source={require('../assets/wishlistOff.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Categories */}
      <View style={styles.categories}>
        {['Gợi ý cho bạn', 'Phổ biến', 'Xu hướng'].map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bookingHeader}>
        <Text style={styles.BookingText}>Danh sách phòng</Text>
        <TouchableOpacity onPress={handleViewAllroom}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardContainer}>
          {renderRoomCards(getCategoryData())}
        </ScrollView>
      )}

      {/* Phòng Đặt Trước */}
      <View style={styles.BookingContainer}>
        <View style={styles.bookingHeader}>
          <Text style={styles.BookingText}>Phòng bạn đã đặt</Text>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardContainer}>
          {renderBookingCards(bookedRoomsData)}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 15,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
    top: 20,
  },
  subHeaderText: {
    fontSize: 26,
    color: 'black',
    fontWeight: 'bold',
    top: 25,
    right: 50,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 25,
    height: 25,
    marginLeft: 15,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    top: 15,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  selectedCategoryButton: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#000',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  cardContainer: {
    flexDirection: 'row',
  },
  card: {
    marginRight: 20,
    borderRadius: 20,
    position: 'relative',
    width: 250,
    height: 450,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    top: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  cardDetails: {
    padding: 10,
    top: -100,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    top: -30,
  },
  cardAddress: {
    width: 250,
    height: 20,
    fontSize: 14,
    color: 'white',
    marginVertical: 2,
    top: -25,
  },
  cardPrice: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginVertical: 2,
    top: -25,
  },
  cardRating: {
    borderRadius: 8,
    width: 50,
    borderWidth: 1,
    borderColor: '#4A7DFF',
    backgroundColor: '#4A7DFF',
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 5,
    top: -300,
    left: 170,
  },
  wishlistButton: {
    position: 'absolute',
    top: 60,
    right: 10,
  },
  cardWishlistIcon: {
    width: 25,
    height: 25,
  },

  // Phòng Đặt Trước
  BookingContainer: {
    marginTop: -80,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 10,
  },
  BookingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  viewAllText: {
    fontSize: 20,
    color: '#007BFF',
    fontWeight: '600',
  },
  emptyBooking: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  bookingInfo: {
    marginTop: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    top: -20,
  },
  bookingDate: {
    fontSize: 14,
    color: 'white',
    marginVertical: 2,
  },
  bookingStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bookingDates: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    top: -25,
  },
  dateText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
    top: -25,
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});
