import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const AllRoomsScreen = () => {
  const navigation = useNavigation();
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Mảng string ID
  const [favoriteRooms, setFavoriteRooms] = useState([]);

  const goBack = () => {
    navigation.goBack();
  };

  // Gọi API /rooms để lấy danh sách tất cả phòng
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rooms');
      const data = response.data;
      if (Array.isArray(data)) {
        setAllRooms(data);
      } else {
        setAllRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setAllRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API /user/favorites để lấy danh sách ID phòng
  const fetchFavoriteRooms = async () => {
    try {
      const response = await api.get('/user/favorites');
      const favoritesArray = response.data.favorites || [];
      const favoriteIds = favoritesArray.map((roomObj) => roomObj._id);
      setFavoriteRooms(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorite rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchFavoriteRooms();
  }, []);

  // Thêm phòng vào favorites
  const addFavorite = async (roomId) => {
    try {
      await api.post('/user/favorites', { roomId });
      setFavoriteRooms((prev) => [...prev, roomId]);
      Alert.alert('Thành công', 'Đã thêm phòng vào danh sách yêu thích!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm phòng vào danh sách yêu thích.');
    }
  };

  // Xóa khỏi favorites
  const removeFavorite = async (roomId) => {
    try {
      await api.delete(`/user/favorites/${roomId}`);
      setFavoriteRooms((prev) => prev.filter((id) => id !== roomId));
      Alert.alert('Thành công', 'Đã xóa phòng khỏi danh sách yêu thích!');
    } catch (error) {
      console.log('Error removing favorite:', error);
      Alert.alert('Lỗi', 'Không thể xóa phòng khỏi danh sách yêu thích.');
    }
  };

  // Toggle
  const toggleFavorite = (roomId) => {
    const isFavorite = favoriteRooms.includes(roomId);
    if (isFavorite) {
      removeFavorite(roomId);
    } else {
      addFavorite(roomId);
    }
  };

  const handleHotelPress = (room) => {
    navigation.navigate('HotelDetail', {roomId: room._id});
  };

  // Render 1 phòng
  const renderRoomItem = ({ item: room }) => {
    const roomImage =
      room.room_images?.length > 0
        ? room.room_images[0]
        : 'https://example.com/default_image.jpg';

    const roomName = room.room_name || 'Không có tên';
    const roomAddress = room.address || 'Không có địa chỉ';
    const roomPrice =
      room.price !== undefined
        ? `${room.price.toLocaleString('vi-VN')}₫/Ngày`
        : 'Liên hệ';
    const roomRating = room.rating !== undefined
      ? room.rating
      : 'Chưa có đánh giá';
    const branchName = room.hotel?.name || 'Chi nhánh không xác định';

    // Kiểm tra phòng này có trong favorites hay không
    const isFavorite = favoriteRooms.includes(room._id);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => handleHotelPress(room)}
        >
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: roomImage }} style={styles.cardImage} />
            <View style={styles.cardDetails}>
              <Text style={styles.cardTitle}>{roomName}</Text>
              <Text style={styles.cardAddress}>{branchName}</Text>
              <Text style={styles.cardAddress}>{roomAddress}</Text>
              <Text style={styles.cardRating}>★ {roomRating}</Text>
              <Text style={styles.cardPrice}>{roomPrice}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Icon bookmark */}
        <TouchableOpacity
          style={styles.bookmarkTouchable}
          onPress={() => toggleFavorite(room._id)}
        >
          <Image
            source={
              isFavorite
                ? require('../assets/wishlistOn.png')
                : require('../assets/wishlistOff.png')
            }
            style={styles.listBookmarkIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Lọc phòng theo search
  const filteredRooms = allRooms.filter((room) =>
    room.room_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    room.address?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image
            style={styles.btn}
            source={require('../assets/iconback.png')}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách phòng</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TouchableOpacity>
          <Image
            source={require('../assets/searchClose.png')}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Loading */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default AllRoomsScreen;

// Styles
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
  btn: {
    width: 25,
    height: 26,
  },
  listBookmarkIcon: {
    width: 25,
    height: 25,
    left: 10,
  },
  bookmarkTouchable: {
    position: 'absolute',
    top: 70,
    right: 10,
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    margin: 10,
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
  listContent: {
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  cardAddress: {
    color: '#888',
  },
  cardPrice: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  cardRating: {
    color: '#f39c12',
  },
});