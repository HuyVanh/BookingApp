import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';

const {width} = Dimensions.get('window');

const ScanHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollY = new Animated.Value(0);

  const fetchHistory = async () => {
    try {
      const historyResponse = await api.get('/staff/scan-history');
      
      // Lấy thông tin booking lần lượt
      const historyWithRooms = await Promise.all(
        historyResponse.data.data.map(async (item) => {
          try {
            const bookingResponse = await api.get(`/bookings/${item.bookingId}?populate=room`);
            
            return {
              ...item,
              roomInfo: bookingResponse.data.room ? {
                name: bookingResponse.data.room.room_name || bookingResponse.data.room.name,
                type: bookingResponse.data.room.room_type || bookingResponse.data.room.type,
                // Thêm các thông tin khác của phòng nếu cần
              } : {
                name: 'Không có thông tin phòng',
                type: `Booking: ${item.bookingId}`
              }
            };
          } catch (error) {
            console.log('Error fetching booking:', error.response?.data || error);
            return {
              ...item,
              roomInfo: {
                name: 'Lỗi tải thông tin',
                type: `Booking: ${item.bookingId}`
              }
            };
          }
        })
      );
      
      setHistory(historyWithRooms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = date => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return <Text>{new Date(date).toLocaleDateString('vi-VN', options)}</Text>;
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={64} color="#DDE1E6" />
      <Text style={styles.emptyText}>Chưa có lịch sử quét vé</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Làm mới</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({item, index}) => (
    <Animated.View
      style={[
        styles.historyItem,
        {
          transform: [
            {
              scale: scrollY.interpolate({
                inputRange: [-50, 0, index * 350],
                outputRange: [1, 1, 1],
              }),
            },
          ],
          opacity: scrollY.interpolate({
            inputRange: [-50, 0, index * 350],
            outputRange: [1, 1, 1],
          }),
        },
      ]}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.cardGradient}>
        <View style={styles.header}>
          <View style={styles.ticketInfoContainer}>
            <Icon name="apartment" size={24} color="#1E40AF" />
            <View style={styles.ticketTextContainer}>
              <Text style={styles.ticketId}>
                {item.roomInfo?.name || `Phòng #${item.bookingId.slice(-4)}`}
              </Text>
              <Text style={styles.bookingId}>
                {item.roomInfo?.type || 'Booking: #' + item.bookingId}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'Đã sử dụng' ? '#DCFCE7' : '#FEE2E2',
              },
            ]}>
            <Icon
              name={item.status === 'Đã sử dụng' ? 'check-circle' : 'error'}
              size={16}
              color={item.status === 'Đã sử dụng' ? '#166534' : '#991B1B'}
            />
            <Text
              style={[
                styles.statusText,
                {color: item.status === 'Đã sử dụng' ? '#166534' : '#991B1B'},
              ]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.guestSection}>
          <View style={styles.guestHeader}>
            <Icon name="person" size={20} color="#475569" />
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          </View>
          <View style={styles.guestDetails}>
            <Text style={styles.guestName}>{item.guestName}</Text>
            <Text style={styles.guestPhone}>{item.phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.bookingDates}>
          <View style={styles.dateItem}>
            <Icon name="flight-land" size={20} color="#059669" />
            <View>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(item.checkIn)}</Text>
            </View>
          </View>
          <View style={styles.dateItem}>
            <Icon name="flight-takeoff" size={20} color="#DC2626" />
            <View>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(item.checkOut)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.staffInfo}>
            <Icon name="account-circle" size={20} color="#6B7280" />
            <Text style={styles.staffName}>{item.scannedBy?.name}</Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.scannedAt).toLocaleTimeString('vi-VN')}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.title}>Lịch sử quét vé</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.statLabel}>Tổng số lượt quét</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E40AF']}
            tintColor="#1E40AF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    marginRight: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  historyItem: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ticketInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketTextContainer: {
    marginLeft: 12,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  bookingId: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  guestSection: {
    marginBottom: 16,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  guestDetails: {
    marginLeft: 28,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  guestPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  bookingDates: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  dateValue: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  timestamp: {
    fontSize: 13,
    color: '#94A3B8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1E40AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    borderRadius: 24,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ScanHistoryScreen;
