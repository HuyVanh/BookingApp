import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import api from '../services/api';

const WishlistScreen = () => {
  const [bookmarkedHotels, setBookmarkedHotels] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    loadBookmarkedHotels();

    const unsubscribe = navigation.addListener('focus', () => {
      loadBookmarkedHotels();
    });
    return unsubscribe;
  }, [navigation]);

  // Gọi API GET /user/favorites
  const loadBookmarkedHotels = async () => {
    try {
      const response = await api.get('/user/favorites');
      setBookmarkedHotels(response.data.favorites || []);
    } catch (error) {
      console.error('Error loading bookmarked hotels:', error);
    }
  };

  // Gọi API DELETE /user/favorites/:roomId để xóa phòng khỏi yêu thích
  const removeFromWishlist = async roomId => {
    try {
      await api.delete(`/user/favorites/${roomId}`);
      setBookmarkedHotels(prev => prev.filter(hotel => hotel._id !== roomId));
      Alert.alert('Thành công', 'Đã xóa phòng khỏi danh sách yêu thích!');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Lỗi', 'Không thể xóa phòng khỏi danh sách yêu thích.');
    }
  };

  const navigateToHotelDetail = room => {
    navigation.navigate('HotelDetail', {roomId: room._id});
  };

  // Hàm render cho FlatList
  const renderHotelItem = ({item}) => {
    const hotelImage =
      item.room_images && item.room_images.length > 0
        ? {uri: item.room_images[0]}
        : {uri: 'https://example.com/no_image.png'};

    const hotelName = item.room_name || 'Không có tên';
    const hotelAddress = item.address || 'Không có địa chỉ';
    const hotelPrice = item.price
      ? `${item.price.toLocaleString('vi-VN')}₫/đêm`
      : 'Liên hệ';
    const hotelRating = item.rating || 'N/A';

    return (
      <View style={styles.hotelItem}>
        {/* Chạm vào phần này => chuyển sang HotelDetail */}
        <TouchableOpacity
          style={{flex: 1}}
          onPress={() => navigateToHotelDetail(item)}>
          <View style={{flexDirection: 'row'}}>
            <Image source={hotelImage} style={styles.hotelImage} />
            <View style={styles.hotelDetails}>
              <Text style={styles.hotelName}>{hotelName}</Text>
              <Text style={styles.hotelAddress}>{hotelAddress}</Text>
              <Text style={styles.hotelPrice}>{hotelPrice}</Text>
              <Text style={styles.hotelRating}>★ {hotelRating}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Icon wishlistOff để xóa (bỏ yêu thích) */}
        <TouchableOpacity
          style={styles.removeIconTouchable}
          onPress={() => {
            Alert.alert(
              'Xác nhận',
              'Bạn có chắc muốn xóa phòng khỏi danh sách yêu thích không?',
              [
                {text: 'Hủy', style: 'cancel'},
                {
                  text: 'Đồng ý',
                  onPress: () => removeFromWishlist(item._id),
                },
              ],
            );
          }}>
          <Image
            source={require('../assets/wishlistOff.png')}
            style={styles.removeIconImage}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Danh sách yêu thích</Text>
      {bookmarkedHotels.length > 0 ? (
        <FlatList
          data={bookmarkedHotels}
          renderItem={renderHotelItem}
          keyExtractor={item => item._id.toString()}
        />
      ) : (
        <Text style={styles.emptyMessage}>
          Danh sách yêu thích của bạn trống
        </Text>
      )}
    </View>
  );
};

export default WishlistScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
  },
  hotelItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    alignItems: 'center', 
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  hotelDetails: {
    marginLeft: 15,
    flex: 1,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  hotelAddress: {
    color: '#888888',
    marginTop: 5,
  },
  hotelPrice: {
    fontWeight: 'bold',
    color: '#4A7DFF',
    marginTop: 5,
  },
  hotelRating: {
    color: '#FFA500',
    marginTop: 5,
  },
  emptyMessage: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    marginTop: 50,
  },
  removeIconTouchable: {
    padding: 10,
  },
  removeIconImage: {
    width: 25,
    height: 25,
  },
});
