import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import api from '../services/api';

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {roomId} = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, roomId]);
  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews]),
  );
  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/room-reviews/room/${roomId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const filterReviews = rating => {
    setSelectedRating(rating);
  };

  const filteredReviews =
    selectedRating !== null
      ? reviews.filter(review => review.rating === selectedRating)
      : reviews;

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };
  const getAvatarSource = avatarUrl => {
    if (!avatarUrl) {
      return require('../assets/user.png');
    }

    // Nếu là URL Cloudinary
    if (avatarUrl.includes('cloudinary.com')) {
      return {uri: avatarUrl};
    }

    // Nếu là URL tương đối (bắt đầu bằng '/uploads')
    if (avatarUrl.startsWith('/uploads')) {
      return {
        uri: `https://backendbookingapp-2fav.onrender.com${avatarUrl}`,
      };
    }

    // Nếu là URL đầy đủ
    if (avatarUrl.startsWith('http')) {
      return {uri: avatarUrl};
    }

    return require('../assets/user.png');
  };

  const renderItem = ({item}) => {
    return (
      <View style={styles.reviewCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={getAvatarSource(item.user?.avatar)}
            style={styles.avatar}
            defaultSource={require('../assets/user.png')}
            onError={error => {
              console.log('Error loading avatar:', error.nativeEvent.error);
            }}
          />
        </View>
        <View style={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewName}>
              {item.user?.username || 'Người dùng'}
            </Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>★ {item.rating}</Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>
            {item.review_date
              ? new Date(item.review_date).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Không có ngày'}
          </Text>
          <Text style={styles.reviewComment}>{item.comment}</Text>
        </View>
      </View>
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Đánh giá</Text>
        {/* Chừa khoảng trống thay vì icon bên phải */}
        <View style={{width: 24}} />
      </View>

      {/* Rating Overview */}
      <View style={styles.ratingOverview}>
        <Text style={styles.averageRating}>★ {calculateAverageRating()}</Text>
        <Text style={styles.countText}>({reviews.length} đánh giá)</Text>
      </View>

      {/* Rating Filter */}
      <View style={styles.ratingFilter}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRating === null && styles.activeFilter,
          ]}
          onPress={() => filterReviews(null)}>
          <Text
            style={[
              styles.filterText,
              selectedRating === null && styles.activeFilterText,
            ]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        {[5, 4, 3].map(rating => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.filterButton,
              selectedRating === rating && styles.activeFilter,
            ]}
            onPress={() => filterReviews(rating)}>
            <Text
              style={[
                styles.filterText,
                selectedRating === rating && styles.activeFilterText,
              ]}>
              ★ {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danh sách review */}
      <FlatList
        data={filteredReviews}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Nút viết đánh giá */}
      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => navigation.navigate('WriteReview', {roomId})}>
        <Text style={styles.writeReviewText}>Viết đánh giá</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    elevation: 2, // độ nổi (Android)
    shadowColor: '#000', // iOS
    shadowOffset: {width: 0, height: 2}, // iOS
    shadowOpacity: 0.2, // iOS
    shadowRadius: 2, // iOS
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // Rating overview
  ratingOverview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB800',
    marginRight: 8,
  },
  countText: {
    color: '#666',
    fontSize: 16,
  },

  // Rating filter
  ratingFilter: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#FFF',
    fontWeight: '600',
  },

  // List Container
  listContainer: {
    padding: 10,
    paddingBottom: 80,
  },

  // Review Card
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    // Shadow (iOS & Android):
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  ratingBadgeText: {
    color: '#FFF',
    fontSize: 12,
  },
  reviewDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Button "Viết đánh giá"
  writeReviewButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center', // canh giữa ngang
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    // Shadow (Android & iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  writeReviewText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
