import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useStripe} from '@stripe/stripe-react-native';
import api from '../services/api';

const Payment = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const stripe = useStripe();

  const {bookingData} = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await api.get('/payment-methods');
        const methods = response.data.map(method => ({
          id: method._id,
          method: method.name,
          method_type: method.method_type,
          img:
            method.method_type === 'Stripe'
              ? require('../assets/stripe.png')
              : require('../assets/go.png'),
        }));
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        Alert.alert(
          'Lỗi',
          'Không thể tải phương thức thanh toán. Vui lòng thử lại sau.',
        );
      }
    };

    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (!bookingData) {
      Alert.alert('Lỗi', 'Dữ liệu đặt phòng không hợp lệ.');
      navigation.goBack();
    }
  }, [bookingData, navigation]);

  const formatPrice = price => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫';
  };

  const handleSelect = method => {
    setSelectedMethod(method);
  };
  const calculateDays = (checkIn, checkOut) => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Hàm xử lý thanh toán qua Stripe
  const handleStripePayment = async (bookingId, paymentMethodId) => {
    console.log('Starting Stripe payment with params:', {
      bookingId,
      paymentMethodId,
    });
    try {
      console.log('Sending create-payment request...');
      // Gọi API tạo phiên thanh toán mới
      const paymentResponse = await api.post(
        '/payments/create-payment-intent',
        {
          booking_id: bookingId,
          payment_method_id: paymentMethodId,
        },
      );

      const {payment, stripe_client_secret, stripe_payment_intent_id} =
        paymentResponse.data.data;
      if (!stripe_client_secret || !stripe_payment_intent_id) {
        throw new Error('Missing required stripe data');
      }

      console.log('Stripe data:', {
        client_secret: stripe_client_secret,
        payment_intent_id: stripe_payment_intent_id,
      });

      const {error: initError} = await stripe.initPaymentSheet({
        paymentIntentClientSecret: stripe_client_secret,
        merchantDisplayName: 'Your App Name',
      });
      // Kiểm tra lỗi khởi tạo
      if (initError) {
        console.error('Payment sheet initialization error:', initError);
        throw new Error(initError.message);
      }
      console.log('Payment sheet initialized, presenting...');
      // Hiển thị form nhập thông tin thẻ thanh toán
      const {error: presentError} = await stripe.presentPaymentSheet();

      // Nếu có lỗi khi hiển thị form, ném ra lỗi
      if (presentError) {
        console.error('Present payment sheet error:', presentError);
        throw new Error(presentError.message);
      }

      console.log('Payment successful, confirming with server...');

      // Gọi API xác nhận thanh toán thành công
      const confirmResponse = await api.post('/payments/confirm-payment', {
        payment_id: payment._id,
        payment_intent_id: stripe_payment_intent_id,
      });
      // Thêm cập nhật trạng thái booking
      await api.put(`/bookings/${bookingId}/payment`, {
        payment_status: 'paid',
        status: 'confirmed',
      });
      console.log('Payment confirmed:', confirmResponse.data);
      Alert.alert('Thành công', 'Thanh toán thành công!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('ViewTicket', {
              booking: bookingId,
            }),
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Không thể hoàn tất thanh toán. Vui lòng thử lại sau.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Thông báo', errorMessage);
    }
  };

  const handleNext = async () => {
    if (!selectedMethod) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán');
      return;
    }
    const numberOfDays = calculateDays(bookingData.check_in, bookingData.check_out);
    if (numberOfDays > 5 && selectedMethod.method_type !== 'Stripe') {
      Alert.alert(
        'Thông báo',
        'Vì bạn đặt phòng trên 5 ngày, vui lòng liên hệ admin để đặt cọc hoặc chọn phương thức thanh toán qua thẻ.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Alert closed')
          }
        ]
      );
      return;
    }

    const MAX_AMOUNT = 99999999;
    if (bookingData.price > MAX_AMOUNT) {
      Alert.alert(
        'Lỗi',
        `Số tiền thanh toán không được vượt quá ₫${MAX_AMOUNT.toLocaleString(
          'vi-VN',
        )}`,
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tạo booking data
      const cleanedBookingData = {
        room_id: bookingData.room_id,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guests_count: bookingData.guests_count,
        personal_info: {
          full_name: bookingData.personal_info.full_name,
          email: bookingData.personal_info.email,
          phone_number: bookingData.personal_info.phone_number,
          date_of_birth: bookingData.personal_info.date_of_birth,
        },
        price: bookingData.price,
        payment_method: selectedMethod.id,
        payment_status:
          selectedMethod.method_type === 'Stripe' ? 'unpaid' : 'pay_at_hotel',
        status: 'pending',
      };

      // 2. Tạo booking
      const bookingResponse = await api.post('/bookings', cleanedBookingData);
      const bookingId = bookingResponse.data.booking._id;
      // 3. Xử lý thanh toán dựa trên phương thức
      if (selectedMethod.method_type === 'Stripe') {
        // Log trước khi tạo notification
        console.log('Attempting to create notification with data:', {
          title: 'Thanh toán thành công',
          content: `Bạn đã thanh toán thành công cho ${bookingData?.hotel_info?.title || 'phòng này'}`,
          type: 'success'
        })
        try {
          await handleStripePayment(bookingId, selectedMethod.id);
          const notificationResponse = await api.post('/notifications/booking-notification', {
            title: 'Thanh toán thành công',
            content: `Bạn đã thanh toán thành công cho ${bookingData?.hotel_info?.title || 'phòng này'}`,
            type: 'success'
          });
          console.log('Notification response:', notificationResponse.data);
        } catch (error) {
          console.log('Error creating notification:', error.response?.data || error);
        }
      }else {
        try {
          await api.put(`/bookings/${bookingId}/payment`, {
            payment_status: 'pay_at_hotel',
            status: 'confirmed',
          });
          const ticketResponse = await api.post(`/tickets/${bookingId}`);
          console.log('Creating notification for pay_at_hotel with data:', {
            title: 'Đặt phòng thành công',
            content: `Bạn đã đặt ${bookingData?.hotel_info?.title || 'phòng'} thành công. Vui lòng thanh toán khi đến nơi.`,
            type: 'info'
          });
          const notificationResponse = await api.post('/notifications/booking-notification', {
            title: 'Đặt phòng thành công',
            content: `Bạn đã đặt ${bookingData?.hotel_info?.title || 'phòng'} thành công. Vui lòng thanh toán khi đến nơi.`,
            type: 'info'
          });
          console.log('Notification response:', notificationResponse.data);

          Alert.alert('Thành công', 'Đặt phòng thành công!', [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('ViewTicket', {
                  booking: bookingId,
                }),
            },
          ]);
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Không thể hoàn tất đặt phòng. Vui lòng thử lại sau.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            style={styles.headerIcon}
            source={require('../assets/iconback.png')}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Thông tin đặt phòng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(bookingData?.price || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentContainer}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentTitle}>Phương thức thanh toán</Text>
          </View>

          {paymentMethods.length > 0 ? (
            paymentMethods.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.methodItem,
                  selectedMethod?.id === item.id && styles.methodItemSelected,
                ]}
                onPress={() => handleSelect(item)}>
                <Image source={item.img} style={styles.methodIcon} />
                <Text style={styles.methodText}>{item.method}</Text>
                <Image
                  source={
                    selectedMethod?.id === item.id
                      ? require('../assets/icones1.png')
                      : require('../assets/icones3.png')
                  }
                  style={styles.checkIcon}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{textAlign: 'center', marginTop: 20}}>
              Đang tải phương thức thanh toán...
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isLoading || !selectedMethod}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Xác nhận thanh toán</Text>
          )}
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
  summaryContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  paymentContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  methodItemSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#4A90E2',
    borderWidth: 1,
  },
  methodIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 8,
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Payment;
