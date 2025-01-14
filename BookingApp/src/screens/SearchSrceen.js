// SearchScreen.js
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import {AuthContext} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import InputSearchModal from './InputSearch';

export default function SearchScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Gợi ý cho bạn');
  const navigation = useNavigation();

  const [allRooms, setAllRooms] = useState([]);
  const [suggestedRooms, setSuggestedRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const {user} = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalRooms, setTotalRooms] = useState(0);



  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    if (!searchQuery.trim()) {
      setSelectedCategory('Tất cả');
      setSearchResults([]);
      return;
    }
    
    // Trigger search bằng cách update searchQuery
    setSearchQuery(searchQuery.trim());
  };
useEffect(() => {
  if (searchQuery) {  // Chỉ search khi có query
    const results = allRooms.filter(room => {
      const searchLower = searchQuery.toLowerCase().trim();
      return (
        room.room_name?.toLowerCase().includes(searchLower) ||
        room.address?.toLowerCase().includes(searchLower)
      );
    });
    setSearchResults(results);
    setSelectedCategory('Tất cả');
  } else {
    setSearchResults([]);
    setSelectedCategory('Gợi ý cho bạn');
  }
}, [searchQuery, allRooms]); 


  const [filters, setFilters] = useState({
    sortBy: null, // Khởi tạo là null
    priceRange: {min: '', max: ''},
    rating: null,
    services: {
      wifi: false,
      pool: false,
      parking: false,
      restaurant: false,
    },
    types: {
      motel: false,
      resort: false,
      villa: false,
      homestay: false,
    },
  });
  const getTotalSuggestedRooms = () => {
    // Lấy danh sách phòng theo category hiện tại
    let roomsToCount = getCategoryData();

    // Áp dụng các bộ lọc
    if (filters.rating) {
      roomsToCount = roomsToCount.filter(
        room => room.rating === filters.rating,
      );
    }

    // Nếu có searchText, lọc thêm theo tìm kiếm
    if (searchText) {
      roomsToCount = roomsToCount.filter(room => {
        const searchLower = searchText.toLowerCase();
        return (
          room.room_name?.toLowerCase().includes(searchLower) ||
          room.address?.toLowerCase().includes(searchLower) ||
          String(room.price)?.toLowerCase().includes(searchLower)
        );
      });
    }

    return roomsToCount.length;
  };

  // Toggle các dịch vụ
  const toggleService = service => {
    setFilters(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service],
      },
    }));
  };

  // Toggle các loại phòng
  const toggleType = type => {
    setFilters(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type],
      },
    }));
  };

  // Hàm reset các bộ lọc (nếu cần)
  const resetFilters = () => {
    setFilters({
      sortBy: null,
      priceRange: {min: '', max: ''},
      rating: null,
      services: {
        wifi: false,
        pool: false,
        parking: false,
        restaurant: false,
      },
      types: {
        motel: false,
        resort: false,
        villa: false,
        homestay: false,
      },
    });
  };

  // Hàm lọc dữ liệu theo từ khoá searchText và bộ lọc
  const filteredRooms = allRooms.filter(room => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      room.room_name?.toLowerCase().includes(searchLower) ||
      room.address?.toLowerCase().includes(searchLower) ||
      String(room.price)?.toLowerCase().includes(searchLower);

    // Sort logic
    let matchesSort = true;
    if (filters.sortBy === 'Giá tiền cao nhất') {
      matchesSort = true;
    } else if (filters.sortBy === 'Giá tiền thấp nhất') {
      matchesSort = true;
    } else if (filters.sortBy === 'Đánh giá cao nhất') {
      matchesSort = true;
    } else if (filters.sortBy === 'Gợi ý cho bạn') {
      matchesSort = room.rating >= 5;
    }

    const minPrice = parseInt(filters.priceRange.min.replace(/\./g, '')) || 0;
    const maxPrice =
      parseInt(filters.priceRange.max.replace(/\./g, '')) || Infinity;
    const matchesPrice = room.price >= minPrice && room.price <= maxPrice;

    const matchesRating = !filters.rating || room.rating === filters.rating;

    const matchesServices = Object.keys(filters.services).every(
      service => !filters.services[service] || room.services?.includes(service),
    );

    const matchesTypes = Object.keys(filters.types).every(
      type => !filters.types[type] || room.type === type,
    );

    return (
      matchesSearch &&
      matchesSort &&
      matchesPrice &&
      matchesRating &&
      matchesServices &&
      matchesTypes
    );
  });

  const getCategoryData = () => {
    if (searchQuery.trim()) {
      return searchResults;
    }
  
    let rooms;
    switch (selectedCategory) {
      case 'Tất cả':
        rooms = allRooms;
        break;
      case 'Phổ biến':
        rooms = popularRooms;
        break;
      case 'Xu hướng':
        rooms = trendingRooms;
        break;
      case 'Yêu thích':
        rooms = favoriteRooms;
        break;
      default:
        rooms = suggestedRooms;
    }
  
    // Áp dụng các bộ lọc
    if (filters.rating) {
      rooms = rooms.filter(room => room.rating === filters.rating);
    }
  
    if (filters.priceRange.min || filters.priceRange.max) {
      const minPrice = parseInt(filters.priceRange.min.replace(/\./g, '')) || 0;
      const maxPrice = parseInt(filters.priceRange.max.replace(/\./g, '')) || Infinity;
      rooms = rooms.filter(room => room.price >= minPrice && room.price <= maxPrice);
    }
  
    // Lọc theo services
    if (Object.values(filters.services).some(v => v)) {
      rooms = rooms.filter(room => {
        return Object.entries(filters.services).every(([serviceId, isSelected]) => {
          return !isSelected || room.services?.includes(serviceId);
        });
      });
    }
  
    // Lọc theo room type
    if (Object.values(filters.types).some(v => v)) {
      rooms = rooms.filter(room => {
        if (!room.details?.room_type) return false;
        return Object.entries(filters.types).some(
          ([type, isSelected]) =>
            isSelected && room.details.room_type.toLowerCase() === type.toLowerCase()
        );
      });
    }
  
    // Thêm phần sắp xếp theo giá và đánh giá
    if (filters.sortBy === 'Giá tiền cao nhất') {
      rooms = [...rooms].sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'Giá tiền thấp nhất') {
      rooms = [...rooms].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'Đánh giá cao nhất') {
      rooms = [...rooms].sort((a, b) => b.rating - a.rating);
    }
  
    return rooms;
  };
  const handleHotelPress = room => {
    navigation.getParent()?.navigate('HotelDetail', {roomId: room._id});
  };

  // Fetch rooms từ API
  const fetchRooms = async filters => {
    setLoading(true);
    try {
      const params = {isActive: true};
      if (filters?.types) {
        const selectedTypes = Object.entries(filters.types)
          .filter(([_, isSelected]) => isSelected)
          .map(([type]) => type);
        if (selectedTypes.length) {
          params.room_type = selectedTypes.join(',');
        }
      }

      const [allRes, popularRes, trendingRes, suggestedRes, favoritesRes] =
        await Promise.all([
          api.get('/rooms', {params}),
          api.get('/rooms/popular', {params}),
          api.get('/rooms/trending', {params}),
          api.get('/rooms/suggested', {params}),
          api.get('/user/favorites'),
        ]);

      setAllRooms(allRes.data || []);
      setPopularRooms(popularRes.data || []);
      setTrendingRooms(trendingRes.data || []);
      setSuggestedRooms(suggestedRes.data || []);
      setFavoriteRooms(favoritesRes.data.favorites || []);
    } catch (error) {
      console.error('Error:', error);
      setAllRooms([]);
      setPopularRooms([]);
      setTrendingRooms([]);
      setSuggestedRooms([]);
      setFavoriteRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(filters);
  }, [filters]);

  // Hàm xử lý áp dụng bộ lọc từ modal
  const applyFilters = newFilters => {
    if (newFilters.suggestedSort) {
      setSelectedCategory('Gợi ý cho bạn');
    }
    setFilters(newFilters);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/IconLogo.png')}
          style={styles.headerLogo}
        />
        <Text style={styles.headerTitle}>Smart Hotel</Text>
      </View>

      {/* Search bar */}
      {/* Search bar */}
      <View style={styles.searchContainer}>
  <TouchableOpacity onPress={handleSearch}>
    <Image
      source={require('../assets/searchClose.png')}
      style={styles.searchIcon}
    />
  </TouchableOpacity>
  <TextInput
    style={styles.searchInput}
    placeholder="Nhập tên khách sạn..."
    placeholderTextColor="#888"
    value={searchQuery}
    onChangeText={(text) => {
      setSearchQuery(text);
      if (!text.trim()) {
        setSelectedCategory('Gợi ý cho bạn');
        setSearchResults([]);
      }
    }}
    onSubmitEditing={handleSearch}
    returnKeyType="search"
  />
  {searchQuery ? (
    <TouchableOpacity onPress={() => {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCategory('Gợi ý cho bạn');
    }}>
      <Image
        source={require('../assets/searchClose.png')}
        style={styles.searchIcon}
      />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={() => setIsModalVisible(true)}>
      <Image
        source={require('../assets/textalign-left.png')}
        style={styles.searchIcon}
      />
    </TouchableOpacity>
  )}
</View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Tất cả', 'Phổ biến', 'Xu hướng', 'Yêu thích'].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton,
              ]}
              onPress={() => {
                if (selectedCategory === category) {
                  setSelectedCategory('Tất cả');
                } else {
                  setSelectedCategory(category);
                }
              }}>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tiêu đề gợi ý */}
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionHeaderText}>
          {selectedCategory} ({getCategoryData().length})
        </Text>
      </View>

      {loading ? (
        // Loading
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Đang tải...</Text>
        </View>
      ) : (
        // Danh sách phòng
        <FlatList
          data={getCategoryData()}
          keyExtractor={item => item._id || String(item.index)}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleHotelPress(item)}>
              <View style={styles.card}>
                <Image
                  source={{
                    uri:
                      item.room_images?.[0] ||
                      'https://example.com/default_image.jpg',
                  }}
                  style={styles.cardImage}
                />
                <View style={styles.cardDetails}>
                  <Text style={styles.cardTitle}>
                    {item.room_name || 'Không có tên'}
                  </Text>
                  <Text style={styles.cardAddress}>
                    {item.address || 'Không có địa chỉ'}
                  </Text>
                  <Text style={styles.cardRating}>
                    ★ {item.rating || 'Chưa có đánh giá'}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {item.price
                      ? `${item.price.toLocaleString('vi-VN')}₫/đêm`
                      : 'Liên hệ'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có phòng phù hợp</Text>
          }
        />
      )}

      {/* Gọi InputSearchModal */}
      <InputSearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onApplyFilters={applyFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },

  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',

    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 6,
  },

  // Categories
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    width: 97,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007BFF',
    marginHorizontal: 4,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCategoryButton: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#000',
  },
  selectedCategoryText: {
    color: '#FFF',
  },

  // Tiêu đề gợi ý
  suggestionHeader: {
    marginBottom: 10,
  },
  suggestionHeaderText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Danh sách phòng
  loadingContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
    fontSize: 15,
  },

  // Card phòng
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,

    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    resizeMode: 'cover',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardAddress: {
    color: '#888',
    marginBottom: 4,
  },
  cardRating: {
    color: '#f39c12',
    marginBottom: 2,
  },
  cardPrice: {
    fontWeight: 'bold',
    color: '#3498db',
  },
});
