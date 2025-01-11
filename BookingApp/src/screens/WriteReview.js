import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

const windowWidth = Dimensions.get('window').width;

export default function WriteReview() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Lấy roomId từ params (thay vì booking)
  const { roomId } = route.params;

  // State để lưu rating, review người dùng nhập
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  // Thêm state để lưu thông tin phòng (room) & loading
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect để fetch detail room theo roomId
  useEffect(() => {
    fetchRoomDetail();
  }, [roomId]);

  const fetchRoomDetail = async () => {
    try {
      // Gọi API rooms/:id để lấy thông tin chi tiết phòng
      const response = await api.get(`/rooms/${roomId}`);
      // Ví dụ: response.data = { _id, room_images, room_name, address, price, ...}
      setRoom(response.data);
    } catch (error) {
      console.error('Lỗi khi fetch room detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin phòng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }
    if (!review.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nhận xét của bạn');
      return;
    }

    try {
      // Chỉ gửi roomId, không còn booking.room._id
      await api.post('/room-reviews', {
        room_id: roomId,
        rating: rating,
        comment: review,
      });

      Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    }
  };

  // Nếu đang loading (chờ fetch room detail)
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Đang tải thông tin phòng...</Text>
      </View>
    );
  }

  // roomDetail fetch xong, kiểm tra room
  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy thông tin phòng.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#007AFF' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.modalContent}>
        {/* Tiêu đề */}
        <Text style={styles.modalTitle}>Đánh giá phòng</Text>

        {/* Thông tin phòng */}
        <View style={styles.hotelInfo}>
          {/* Nếu room.room_images có tồn tại */}
          {room.room_images && room.room_images.length > 0 ? (
            <Image
              source={{ uri: room.room_images[0] }}
              style={styles.hotelImage}
            />
          ) : (
            <Image
              source={{ uri: 'https://via.placeholder.com/70' }}
              style={styles.hotelImage}
            />
          )}

          <View style={styles.hotelDetails}>
            <Text style={styles.hotelName}>{room.room_name}</Text>
            <Text style={styles.location}>{room.address}</Text>
            <Text style={styles.price}>
              {room.price?.toLocaleString()}đ/đêm
            </Text>
          </View>
        </View>

        {/* Nhãn mời đánh giá */}
        <Text style={styles.ratingLabel}>Vui lòng đánh giá và nhận xét</Text>

        {/* Chọn sao */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButtonContainer}>
              <Image
                source={
                  star <= rating
                    ? require('../assets/SaoOn.png')
                    : require('../assets/SaoOff.png')
                }
                style={styles.starButton}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Ô nhập nội dung nhận xét */}
        <View style={styles.reviewInputContainer}>
          <TextInput
            style={styles.reviewInput}
            placeholder="Viết đánh giá ở đây!"
            placeholderTextColor="#666"
            multiline={true}
            numberOfLines={3}
            value={review}
            onChangeText={setReview}
          />
        </View>

        {/* Nút gửi đánh giá */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
          <Text style={styles.submitButtonText}>Đánh giá ngay</Text>
        </TouchableOpacity>

        {/* Nút “Để sau” */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.laterButtonContainer}>
          <Text style={styles.laterButton}>Để sau</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --------------------------- STYLES ---------------------------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: windowWidth * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    // Shadow (iOS & Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  hotelInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  hotelImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
    resizeMode: 'cover',
  },
  hotelDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButtonContainer: {
    marginHorizontal: 4,
  },
  starButton: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  reviewInputContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 16,
    padding: 8,
  },
  reviewInput: {
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButtonContainer: {
    alignSelf: 'center',
  },
  laterButton: {
    fontSize: 14,
    color: '#007AFF',
  },
});
