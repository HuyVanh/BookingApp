import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import React, {useState, useContext, useEffect} from 'react';
import {NotificationContext} from '../navigation/NotificationContext';
import Icon from 'react-native-vector-icons/Ionicons'; 
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {AuthContext} from '../contexts/AuthContext';
import api from '../services/api';


const MyBookingScreen = () => {
  const {user} = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState('Đang chờ');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const {addNotification} = useContext(NotificationContext);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  

  useEffect(() => {
    if (isFocused) {
      fetchBookings();
    }
  }, [isFocused]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/user-bookings');
      if (Array.isArray(response.data)) {
        const bookingsWithTickets = await Promise.all(
          response.data.map(async (booking) => {
            try {
              const ticketResponse = await api.get(`/tickets/booking/${booking._id}`);
              return {
                ...booking,
                is_used: ticketResponse.data?.is_used || false
              };
            } catch (error) {
              return {
                ...booking,
                is_used: false
              };
            }
          })
        );
        setBookings(bookingsWithTickets);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu đặt phòng:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = booking => {
    setSelectedBooking(booking);
    setIsModalVisible(true);
  };

  const handleCancelBooking = async () => {
    if (selectedBooking) {
      try {
        const response = await api.delete(`/bookings/${selectedBooking._id}`);

        if (response.data) {
          setBookings(prevBookings =>
            prevBookings.map(booking =>
              booking._id === selectedBooking._id
                ? {...booking, status: 'canceled'}
                : booking,
            ),
          );
          // Thêm thông báo khi hủy phòng thành công
          await api.post('/notifications/booking-notification', {
            title: 'Hủy phòng thành công',
            content: `Bạn đã hủy phòng ${
              selectedBooking.room?.room_name || selectedBooking.room?.title
            } thành công`,
            type: 'info',
          });

          setIsModalVisible(false);
          setIsSuccessModalVisible(true);
          setSelectedCategory('Đã huỷ');

          addNotification(
            `Giao dịch đã huỷ`,
            `Bạn đã huỷ đặt phòng ${selectedBooking.room?.room_name}`,
          );

          await fetchBookings();
        }
      } catch (error) {
        console.error('Error details:', error.response?.data);
        Alert.alert(
          'Lỗi',
          error.response?.data?.message ||
            'Không thể hủy đặt phòng. Vui lòng thử lại sau.',
        );
      }
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
  };

  const filteredBookings = bookings.filter(booking => {
    const roomName = booking.room?.room_name?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    return roomName.includes(searchLower);
  });

  const pendingBookings = filteredBookings.filter(
    booking => booking.status !== 'canceled' && !booking.is_used
  );
  const completedBookings = filteredBookings.filter(
    booking => booking.status !== 'canceled' && booking.is_used === true
  );
  const canceledBookings = filteredBookings.filter(
    booking => booking.status === 'canceled' || booking.status === 'cancelled',
  );

  const renderBookingCard = booking => {
    const roomImage = booking.room?.room_images?.[0]
      ? {uri: booking.room.room_images[0]}
      : require('../assets/hotel2.jpg');

    return (
      <View style={styles.card}>
      <View style={styles.box}>
        <View style={styles.box1}>
          <View style={styles.item1}>
            <Image source={roomImage} style={styles.no1cardImage} />
          </View>
          <View style={styles.item2}>
            <Text style={styles.no1cardTitle}>{booking.room?.room_name}</Text>
            <Text style={styles.no1cardAddress}>{booking.room?.address}</Text>
            <View style={[styles.no1cardstatus, 
              booking.is_used && styles.scannedStatus]}>
              <Text style={[styles.no1txt, 
                booking.is_used && styles.scannedStatusText]}>
                {booking.is_used ? 'Đã quét mã' : (
                  booking.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
                )}
              </Text>
            </View>
          </View>
        </View>

          {selectedCategory === 'Đang chờ' && (
            <View style={styles.no1buttonContent}>
              <TouchableOpacity
                style={styles.no1carbtn1}
                onPress={() => openCancelModal(booking)}>
                <Text style={styles.no1btnText}>Huỷ đặt phòng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.no1carbtn2}
                onPress={() =>
                  navigation.navigate('ViewTicket', {
                    booking: booking.id || booking._id,
                  })
                }>
                <Text style={styles.no1btnText2}>Xem vé</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedCategory === 'Đã đặt' && (
            <View style={styles.no1buttonContent}>
              <TouchableOpacity
                style={styles.ratingButton}
                onPress={() =>
                  navigation.navigate('ReviewScreen', {roomId: booking.room._id })
                }>
                <Icon name="star-outline" size={24} color="gold" />
                <Text style={styles.ratingText}>Đánh giá</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.no1carbtn2}
                onPress={() =>
                  navigation.navigate('ViewTicket', {
                    booking: booking.id || booking._id,
                  })
                }>
                <Text style={styles.no1btnText2}>Xem vé</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedCategory === 'Đã huỷ' && (
            <View style={styles.no3cardstatus2}>
              <Image
                source={require('../assets/icones2.png')}
                style={styles.no2icon}
              />
              <Text style={styles.no2txt2}>Bạn đã huỷ đặt cho phòng này.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header phần giữ nguyên */}
      <View style={styles.header}>
        <Image source={require('../assets/IconLogo.png')} style={styles.logo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Đặt Phòng</Text>
        </View>
        <View style={styles.iconsContainer}>
          <TouchableOpacity onPress={() => setIsSearchActive(!isSearchActive)}>
            <Image
              source={require('../assets/searchClose.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {isSearchActive && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
          />
        </View>
      )}

      {/* Categories */}
      <View style={styles.categories}>
        {['Đang chờ', 'Đã đặt', 'Đã huỷ'].map(category => (
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

      <ScrollView
        marginVertical
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardContainer}>
        {selectedCategory === 'Đang chờ' &&
          pendingBookings.map(booking => (
            <View key={`pending-${booking._id || booking.id}`}>
              {renderBookingCard(booking)}
            </View>
          ))}
        {selectedCategory === 'Đã đặt' &&
          completedBookings.map(booking => (
            <View key={`completed-${booking._id || booking.id}`}>
              {renderBookingCard(booking)}
            </View>
          ))}
        {selectedCategory === 'Đã huỷ' &&
          canceledBookings.map(booking => (
            <View key={`canceled-${booking._id || booking.id}`}>
              {renderBookingCard(booking)}
            </View>
          ))}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Huỷ đặt phòng</Text>
            <Text style={styles.modalMessage}>
              Bạn có chắc chắn muốn huỷ đặt phòng khách sạn không?
            </Text>
            <Text style={styles.modalMessage2}>
              Theo chính sách của chúng tôi, bạn chỉ có thế hoàn lại 80% số tiền
              đã thanh toán.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleCancelBooking}>
                <Text style={styles.modalButtonTextConfirm}>Đồng ý</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Thoát</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={isSuccessModalVisible}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}>
        <View style={styles.modalContainer2}>
          <View style={styles.modalContent2}>
            <Image
              source={require('../assets/iconmodal.png')}
              style={styles.modalimg}
            />
            <Text style={styles.modalTitle2}>Thành công !!!</Text>
            <Text style={styles.modalMessage3}>
              Bạn sẽ được hoàn lại 100% số tiền đã thanh toán trong thời gian sớm
              nhất.
            </Text>
            <TouchableOpacity
              style={styles.modalButtonConfirm2}
              onPress={handleSuccessModalClose}>
              <Text style={styles.modalButtonTextConfirm2}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 40,
  },
  logo: {
    width: 40,
    height: 40,
    top: 20,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 15,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
    top: 25,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    top: 25,
  },
  icon: {
    width: 25,
    height: 25,
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  searchIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  scannedStatus: {
    backgroundColor: '#E3F2FD',
  },
  scannedStatusText: {
    color: '#1976D2',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryButton: {
    width: 110,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  card: {
    borderRadius: 10,
    width: '100%',
    height: 210,
    marginBottom: 25,
    backgroundColor: '#ffffff',
  },

  //Đang chờ
  no1cardImage: {
    width: 110,
    height: 110,
    left: 10,
    borderRadius: 10,
  },
  no1cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  no1cardAddress: {
    top: 6,
    fontSize: 14,
    color: '#777777',
    marginVertical: 2,
  },
  no1cardstatus: {
    width: 190,
    height: 35,
    top: 10,
    left: -10,
    fontSize: 15,
    borderRadius: 10,
    backgroundColor: '#C0DCDC',
    marginVertical: 2,
  },
  no1txt: {
    top: 3,
    left: 7,
    fontSize: 15,
    borderRadius: 7,
    color: '#777777',
    alignItems: 'center',
    marginVertical: 2,
  },
  no1buttonContent: {
    justifyContent: 'center',
    width: '100%',
    height: '20%',
    borderRadius: 10,
    margin: 'auto',
    bottom: 10,
    flexDirection: 'row',
  },
  no1carbtn1: {
    width: '47%',
    height: '100%',
    right: 12,
    backgroundColor: '#ddd',
    borderRadius: 25,
    alignItems: 'center',
  },
  no1carbtn2: {
    width: '47%',
    height: '100%',
    left: 12,
    backgroundColor: '#007BFF',
    borderRadius: 25,
    alignItems: 'center',
  },
  no1btnText: {
    color: '#007BFF',
    fontSize: 16,
    top: 5,
    fontWeight: 'bold',
  },
  no1btnText2: {
    color: '#FFFFFF',
    fontSize: 16,
    top: 5,
    fontWeight: 'bold',
  },

  //Đã đặt
  box: {
    borderRadius: 10,
    width: '100%',
    height: 210,
    marginTop: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    padding: 15,
  },
  box1: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
    // backgroundColor: '#C0DCDC',
    flexDirection: 'row',
  },
  box2: {
    width: '100%',
    height: '20%',
    fontSize: 15,
    borderRadius: 10,
    margin: 'auto',
    bottom: 10,
    backgroundColor: '#C0DCDC',
    flexDirection: 'row',
  },
  item1: {
    width: '40%',
    height: '100%',
  },
  item2: {
    width: '60%',
    left: 20,
  },
  no2cardImage: {
    width: 110,
    height: 110,
    left: 10,
    borderRadius: 10,
  },
  no2cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  no2cardAddress: {
    top: 5,
    fontSize: 14,
    color: '#777777',
    marginVertical: 2,
  },
  no2cardstatus: {
    width: 190,
    height: 35,
    top: 10,
    left: -10,
    fontSize: 15,
    borderRadius: 10,
    backgroundColor: '#C0DCDC',
    marginVertical: 2,
  },
  no2icon: {
    width: 25,
    height: 25,
    marginLeft: 5,
    marginTop: 8,
  },
  no2txt: {
    top: 3,
    left: 7,
    fontSize: 15,
    borderRadius: 7,
    color: '#777777',
    alignItems: 'center',
    marginVertical: 2,
  },
  no2txt2: {
    top: 7,
    left: 4,
    fontSize: 15,
    borderRadius: 7,
    color: '#777777',
    alignItems: 'center',
    marginVertical: 2,
  },

  //Đã huỷ
  no3cardImage: {
    width: 110,
    height: 110,
    left: 10,
    borderRadius: 10,
  },
  no3cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  no3cardAddress: {
    top: 5,
    fontSize: 14,
    color: '#777777',
    marginVertical: 2,
  },
  no3cardstatus: {
    width: 190,
    height: 35,
    top: 10,
    left: -10,
    fontSize: 15,
    borderRadius: 10,
    backgroundColor: '#ffcccc',
    marginVertical: 2,
  },
  no3cardstatus2: {
    width: '100%',
    height: '20%',
    fontSize: 15,
    borderRadius: 10,
    margin: 'auto',
    bottom: 10,
    backgroundColor: '#ffcccc',
    flexDirection: 'row',
  },
  no3icon: {
    width: 25,
    height: 25,
    marginLeft: 5,
    marginTop: 8,
  },
  no3txt: {
    top: 3,
    left: 7,
    fontSize: 15,
    borderRadius: 7,
    color: '#777777',
    alignItems: 'center',
    marginVertical: 2,
  },
  no3txt2: {
    top: 7,
    left: 4,
    fontSize: 15,
    borderRadius: 7,
    color: '#777777',
    alignItems: 'center',
    marginVertical: 2,
  },

  //Modal thông báo
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    height: 350,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 21,
    color: 'red',
    fontWeight: 'bold',
  },
  modalMessage: {
    padding: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#555',
  },
  modalMessage2: {
    marginLeft: 25,
    marginRight: 25,
    textAlign: 'center',
    fontSize: 14,
    color: '#777777',
    marginBottom: 40,
  },
  modalButtons: {
    flexDirection: 'column',
  },
  modalButtonCancel: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 20,
    width: 300,
    height: 45,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
    width: 300,
    height: 45,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },

  // modal thành công
  modalContainer2: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent2: {
    backgroundColor: 'white',
    margin: 40,
    height: 500,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle2: {
    fontSize: 30,
    top: 50,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  modalMessage3: {
    padding: 20,
    top: 50,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#777777',
  },
  modalButtonConfirm2: {
    backgroundColor: '#007BFF',
    padding: 10,
    top: 60,
    borderRadius: 20,
    width: 250,
    height: 55,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalButtonTextConfirm2: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  modalimg: {
    width: 250,
    height: 200,
    top: 40,
  },
  ratingButton: {
    width: '47%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'gold',
    marginRight: 12,
  },
  ratingText: {
    color: 'gold',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  
});

export default MyBookingScreen;
