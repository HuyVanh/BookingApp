import React, {useEffect, useContext, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AuthContext} from '../contexts/AuthContext';
import api from '../services/api';

const ViewTicket = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        const bookingId = route.params?.booking;
        const response = await api.get(`/tickets/booking/${bookingId}`);
        setTicketData(response.data);
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin vé');
      } finally {
        setIsLoading(false);
      }
    };

    if (route.params?.booking) {
      loadTicketData();
    }
  }, [route.params?.booking]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông Tin Vé</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.ticketContainer}>
            {/* QR Code */}
            <View style={styles.qrSection}>
              <Image
                source={{uri: ticketData?.qr_code}}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>

            {/* Thông tin đặt phòng */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông Tin Đặt Phòng</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày Check-in:</Text>
                <Text style={styles.value}>
                  {formatDate(ticketData?.booking?.check_in)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Check-out:</Text>
                <Text style={styles.value}>
                  {formatDate(ticketData?.booking?.check_out)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Số lượng khách:</Text>
                <Text style={styles.value}>
                  {ticketData?.booking?.guests_count} người
                </Text>
              </View>
            </View>

            {/* Thông tin khách hàng */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Họ và tên:</Text>
                <Text style={styles.value}>
                  {ticketData?.booking?.personal_info?.full_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Số điện thoại:</Text>
                <Text style={styles.value}>
                  {ticketData?.booking?.personal_info?.phone_number}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MyBooking')}>
          <Text style={styles.buttonText}>Xem Đặt Phòng Của Tôi</Text>
        </TouchableOpacity>

        {/* Thêm nút về Home */}
        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{name: 'Tabs'}], // Tên của TabNavigator của bạn
            });
          }}>
          <Text style={styles.buttonText}>Về Trang Chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  ticketContainer: {
    padding: 16,
  },
  qrSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    flex: 2,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 12,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    gap: 12, // Khoảng cách giữa các nút
  },
  button: {
    backgroundColor: '#007BFF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ViewTicket;
