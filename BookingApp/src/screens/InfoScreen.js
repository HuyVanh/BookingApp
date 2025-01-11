import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  Image, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../contexts/AuthContext';
import LinearGradient from 'react-native-linear-gradient';

const InfoScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Nhận đầy đủ dữ liệu từ SelectDate
  const { 
    roomId,
    checkIn,
    checkOut,
    guestCount,
    totalPrice,
    hotelImage,
    hotelTitle,
    hotelAddress,
    hotelRating,
    roomType
  } = route.params;

  // State cho thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate ? new Date(user?.birthDate) : new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Format ngày hiển thị
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫";
  };

  // Validate số điện thoại
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    // Regex chặt chẽ hơn để đảm bảo domain hợp lệ
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum|vn)$/i;
    
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return false;
    }
  
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không đúng định dạng. Vui lòng kiểm tra lại (ví dụ: example@gmail.com)');
      return false;
    }
  
    return true;
  };
  const handleContinue = () => {
    // Validate các trường
    if (!userInfo.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }
    if (!validateEmail(userInfo.email)) {
      return;
    }

    if (!validatePhoneNumber(userInfo.phone)) {
      setPhoneError('Số điện thoại phải có 10 chữ số');
      return;
    }

    // Chuẩn bị dữ liệu booking
    const bookingData = {
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestCount,
      personal_info: {
        full_name: userInfo.fullName,
        date_of_birth: userInfo.birthDate.toISOString(),
        email: userInfo.email,
        phone_number: userInfo.phone,
      },
      price: totalPrice,
      hotel_info: {
        title: hotelTitle,
        address: hotelAddress,
        image: hotelImage,
        room_type: roomType,
        rating: hotelRating,
        status: 'pending',
      }
    };

    // Chuyển sang màn hình Payment
    navigation.navigate('Payment', {
      bookingData: bookingData
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setUserInfo({ ...userInfo, birthDate: selectedDate });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header với gradient */}
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Image
                  source={require('../assets/arrow-left.png')}
                  style={[styles.backIcon, { tintColor: '#FFF' }]}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Thông tin đặt phòng</Text>
              <View style={styles.backIcon} />
            </View>
          </LinearGradient>

          {/* Card thông tin phòng */}
          <View style={styles.bookingCard}>
            <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName} numberOfLines={1}>{hotelTitle}</Text>
              <View style={styles.ratingContainer}>
                <Image 
                  source={require('../assets/star.png')} 
                  style={styles.starIcon}
                />
                <Text style={styles.ratingText}>{hotelRating}</Text>
              </View>
              <Text style={styles.roomType}>{roomType}</Text>
              <View style={styles.divider} />
              <View style={styles.dateContainer}>
                <Image 
                  source={require('../assets/calendar.png')}
                  style={styles.calendarIcon}
                />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Check-in:</Text>
                  <Text style={styles.dateValue}>{formatDateTime(checkIn)}</Text>
                  <Text style={styles.dateLabel}>Check-out:</Text>
                  <Text style={styles.dateValue}>{formatDateTime(checkOut)}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Tổng tiền:</Text>
                <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
              </View>
            </View>
          </View>

          {/* Form thông tin cá nhân */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={[styles.input, userInfo.fullName ? styles.inputFilled : null]}
                value={userInfo.fullName}
                onChangeText={(text) => setUserInfo({ ...userInfo, fullName: text })}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.inputFilled]}
                onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>
                  {formatDate(userInfo.birthDate)}
                </Text>
                <Image
                  source={require('../assets/calendar.png')}
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={userInfo.birthDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, userInfo.email ? styles.inputFilled : null]}
                  value={userInfo.email}
                  onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                  placeholder="example@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Image
                  source={require('../assets/smss.png')}
                  style={styles.inputIcon}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, userInfo.phone ? styles.inputFilled : null]}
                  value={userInfo.phone}
                  onChangeText={(text) => {
                    setUserInfo({ ...userInfo, phone: text });
                    setPhoneError('');
                  }}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Image
                  source={require('../assets/phone-256.webp')}
                  style={styles.inputIcon}
                />
              </View>
            </View>

            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </View>
        </ScrollView>

        {/* Nút tiếp tục với gradient */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.continueButtonGradient}
        >
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  hotelImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  hotelInfo: {
    flex: 1,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: '#FFD700',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  roomType: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#666',
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1A1A1A',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputFilled: {
    backgroundColor: '#FFF',
    borderColor: '#4A90E2',
  },
  datePickerButton: {
    height: 50,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginLeft: 12,
    tintColor: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  continueButtonGradient: {
    margin: 16,
    borderRadius: 12,
  },
  continueButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default InfoScreen;