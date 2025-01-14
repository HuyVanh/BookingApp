import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';
import {AuthContext} from '../contexts/AuthContext';
import {NotificationContext} from '../navigation/NotificationContext';
import io from 'socket.io-client';

const LoadingSkeleton = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    // Cleanup khi component unmount
    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonCard = () => (
    <View style={styles.card}>
      <Animated.View
        style={[
          styles.skeletonImage,
          {
            opacity,
          },
        ]}
      />
      <View style={styles.cardDetails}>
        <Animated.View
          style={[
            styles.skeletonText,
            {
              opacity,
              width: '70%',
              height: 20,
              marginBottom: 8,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            {
              opacity,
              width: '90%',
              height: 16,
              marginBottom: 4,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            {
              opacity,
              width: '50%',
              height: 16,
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardContainer}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    </View>
  );
};

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

    const newSocket = io('https://backendbookingapp-2fav.onrender.com', {
      transports: ['websocket'],
      auth: {
        token: user?.token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected in Home:', newSocket.id);
      const ADMIN_ID = '675be60b39fcd18e034a7a9d';
      const currentUserId = user?.user?._id;
      const roomId = `chat_${ADMIN_ID}_${currentUserId}`;

      newSocket.emit('join_chat', {
        room: roomId,
        userId: currentUserId,
      });
      console.log('Joined chat room:', roomId);
    });

    newSocket.on('new_message', message => {
      console.log('Raw message received:', message);
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

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, increaseUnreadMessages]);

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

  const handleWishlist = () => {
    navigation.navigate('Wishlist', {bookmarkedHotels: []});
  };

  const handleHotelPress = room => {
    navigation.getParent().navigate('HotelDetail', {roomId: room._id});
  };

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
      setBookedRoomsData([]);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBookedRooms();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (user?.user) {
      setCurrentUser(user.user);
      console.log('User data updated:', user.user);
    }
  }, [user]);

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
                <Text
                  style={[
                    styles.cardStatus,
                    booking.payment_status === 'paid'
                      ? styles.paidStatus
                      : styles.unpaidStatus,
                  ]}>
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

      {/* Danh sách phòng */}
      <View style={styles.bookingHeader}>
        <Text style={styles.BookingText}>Danh sách phòng</Text>
        <TouchableOpacity onPress={handleViewAllroom}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton />
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
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cardContainer}>
            {renderBookingCards(bookedRoomsData)}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
};

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

  skeletonImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E1E9EE',
    borderRadius: 20,
  },
  skeletonText: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginVertical: 5,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
    top: -25,
  },
  paidStatus: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  unpaidStatus: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
});

export default HomeScreen;
