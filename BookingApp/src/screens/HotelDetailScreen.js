import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';
import {AuthContext} from '../contexts/AuthContext';
import MapView, {Marker, UrlTile} from 'react-native-maps';

const windowWidth = Dimensions.get('window').width;

export default function HotelDetailScreen({route}) {
  const {roomId} = route.params;
  const navigation = useNavigation();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const {user} = useContext(AuthContext);
  const [adminId, setAdminId] = useState(null);

  // Fetch thông tin phòng
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await api.get(`/rooms/${roomId}?populate=services`);
        setHotel(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin phòng:', error);
        Alert.alert(
          'Lỗi',
          'Không thể lấy thông tin phòng. Vui lòng thử lại sau.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);
  useEffect(() => {
    const getAdminId = async () => {
      try {
        const response = await api.get('/user/admin');
        console.log('Admin response:', response.data);
        if (response.data.user && response.data.user._id) {
          setAdminId(response.data.user._id);
          console.log('Admin ID set to:', response.data.user._id);
        }
      } catch (error) {
        console.error('Error getting admin:', error);
      }
    };

    getAdminId();
  }, []);

  // Fetch review
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('Fetching reviews for Room ID:', roomId);
        // Thay đổi endpoint nếu khác
        const res = await api.get(`/room-reviews/room/${roomId}`);
        console.log('Reviews response:', res.data);
        setReviews(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy đánh giá:', err);
      }
    };
    fetchReviews();
  }, [roomId]);
  console.log('adminId:', adminId); 
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text>Đang tải thông tin phòng...</Text>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy phòng.</Text>
      </View>
    );
  }

  // Hàm định dạng giá
  const formatPrice = price => {
    return price.toLocaleString('vi-VN') + ' VND' + '/Ngày';
  };

  // Mở Google Maps
  const openGoogleMaps = () => {
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const latLng = `${hotel.latitude},${hotel.longitude}`;
    const label = hotel.room_name;
    const url = Platform.select({
      ios: `${scheme}//?q=${label}@${latLng}`,
      android: `${scheme}${latLng}?q=${latLng}(${label})`,
    });

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const browser_url = `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;
          return Linking.openURL(browser_url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header với nút back và more */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/iconback.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require('../assets/three.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        {/* Ảnh chính */}
        {hotel.room_images && hotel.room_images.length > 0 ? (
          <Image
            source={{uri: hotel.room_images[0]}}
            style={styles.mainImage}
          />
        ) : (
          <Image
            source={{uri: 'https://via.placeholder.com/250'}}
            style={styles.mainImage}
          />
        )}

        {/* Tiêu đề và địa chỉ */}
        <View style={styles.header}>
          <Text style={styles.title}>{hotel.room_name}</Text>
          <Text style={styles.address}>
            <Image
              source={require('../assets/location-pin.png')}
              style={styles.smallIcon}
            />{' '}
            {hotel.address}
          </Text>
        </View>

        {/* Thư viện ảnh */}
        <View style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Thư viện ảnh</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AlbumScreen', {images: hotel.room_images})
              }>
              <Text style={styles.viewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hotel.room_images.map((img, index) => (
              <View key={index} style={styles.galleryImageContainer}>
                <Image source={{uri: img}} style={styles.galleryImage} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Chi tiết phòng */}
        <View style={styles.roomDetails}>
          <Text style={styles.sectionTitle}>Chi tiết</Text>
          <View style={styles.roomIcons}>
            <View style={styles.detailItem}>
              <Image
                source={require('../assets/five-stars.png')}
                style={styles.icon}
              />
              <Text style={styles.detailText}>{hotel.details.room_type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Image
                source={require('../assets/double-bed.png')}
                style={styles.icon}
              />
              <Text style={styles.detailText}>{hotel.details.bed}</Text>
            </View>
            <View style={styles.detailItem}>
              <Image
                source={require('../assets/room.png')}
                style={styles.icon}
              />
              <Text style={styles.detailText}>{hotel.details.size}</Text>
            </View>
            <View style={styles.detailItem}>
              <Image
                source={require('../assets/car.png')}
                style={styles.icon}
              />
               <Text style={styles.detailText}>2Chỗ</Text>
            </View>
          </View>
        </View>

        {/* Mô tả */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{hotel.description}</Text>
          {hotel.additionalDescription ? (
            <Text style={styles.additionalDescription}>
              {hotel.additionalDescription}
            </Text>
          ) : null}
        </View>

        {/* Dịch vụ */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Dịch vụ</Text>
          <View style={styles.servicesGrid}>
            {hotel.services && hotel.services.length > 0 ? (
              hotel.services.map((service, index) => {
                return (
                  <View key={index} style={styles.serviceItem}>
                    {service.icon ? (
                      <Image
                        source={{uri: service.icon}}
                        style={styles.serviceIcon}
                      />
                    ) : (
                      <Image
                        source={{uri: 'https://via.placeholder.com/24'}}
                        style={styles.serviceIcon}
                      />
                    )}
                    <Text style={styles.serviceText}>{service.name}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noServicesText}>Không có dịch vụ nào.</Text>
            )}
          </View>
        </View>

        {/* Địa điểm */}
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>Địa điểm</Text>
          <TouchableOpacity onPress={openGoogleMaps} activeOpacity={0.9}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              pointerEvents="none">
              <UrlTile
                urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              <Marker
                coordinate={{
                  latitude: hotel.latitude,
                  longitude: hotel.longitude,
                }}
                title={hotel.room_name}
                description={hotel.address}
              />
            </MapView>
          </TouchableOpacity>
        </View>

        {/* PHẦN HIỂN THỊ ĐÁNH GIÁ */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Đánh giá</Text>
            {/* Chỉ hiển thị nút nếu có ít nhất 1 review (bạn có thể thay điều kiện) */}
            {reviews.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ReviewScreen', {
                    roomId: roomId,
                  })
                }>
                <Text style={styles.seeAllReviews}>Xem tất cả đánh giá</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nếu chưa có review */}
          {reviews.length === 0 && (
            <Text style={styles.noReviewsText}>Chưa có đánh giá nào.</Text>
          )}

          {/* Hiển thị top 2 đánh giá (nếu có) */}
          {reviews.slice(0, 2).map((r, idx) => (
            <View key={r._id || idx} style={styles.reviewItem}>
              <Text style={styles.reviewUser}>
                {r.user?.username || 'Người dùng'}
              </Text>
              <Text style={styles.reviewRating}>★ {r.rating}</Text>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer với giá và nút đặt ngay */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>{formatPrice(hotel.price)}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              console.log('Hotel details before navigation:', hotel.details);
              console.log('Max guests value:', hotel.details.guests);
              navigation.navigate('SelectDate', {
                roomId: roomId,
                pricePerNight: hotel.price,
                hotelImage: hotel.room_images && hotel.room_images[0] ? hotel.room_images[0] : null,
                hotelTitle: hotel.room_name,
                hotelAddress: hotel.address,
                hotelRating: hotel.rating,
                maxGuests: hotel.details.guests,
                currency: 'VND',
                roomType: hotel.details.room_type,
                roomDetails: hotel.details,
              })
            }}>
            <Text style={styles.buttonText}>Đặt ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 80,
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
  },
  headerNav: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  icon: {
    width: 24,
    height: 24,
  },
  smallIcon: {
    width: 16,
    height: 16,
  },
  mainImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#727272',
  },
  galleryContainer: {
    marginBottom: 24,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  viewAll: {
    color: '#4A90E2',
    fontSize: 14,
  },
  viewReview: {
    color: '#4A90E2',
    fontSize: 14,
    marginTop: 8,
  },
  galleryImageContainer: {
    marginLeft: 16,
    width: (windowWidth - 48) / 3,
  },
  galleryImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  roomDetails: {
    padding: 16,
    marginBottom: 24,
  },
  roomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  detailItem: {
    alignItems: 'center',
    width: '23%',
  },
  descriptionContainer: {
    padding: 16,
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  additionalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  servicesContainer: {
    padding: 16,
    marginBottom: 24,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  serviceItem: {
    width: 60,
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 16,
  },
  serviceIcon: {
    width: 24,
    height: 24,
  },
  serviceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noServicesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    width: '100%',
  },
  locationContainer: {
    padding: 16,
    marginBottom: 24,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  reviewSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Đưa tiêu đề sang trái, nút sang phải
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAllReviews: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  reviewItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    // Shadow (nếu muốn)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewUser: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    color: '#FFB800',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: 'gray',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopColor: '#e0e0e0',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
