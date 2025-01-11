import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import api from '../services/api';

const SelectDate = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // States
  const [selectedDate, setSelectedDate] = useState({
    checkIn: null,
    checkOut: null
  });
  const [selectedTime, setSelectedTime] = useState({
    checkIn: new Date(new Date().setHours(14,0,0,0)),
    checkOut: new Date(new Date().setHours(12,0,0,0)),
  });
  const [showTimePicker, setShowTimePicker] = useState({
    checkIn: false,
    checkOut: false
  });
  const [guestCount, setGuestCount] = useState(1);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Route params
  const { 
    roomId,
    pricePerNight,
    hotelImage,
    hotelTitle,
    hotelAddress, 
    hotelRating,
    maxGuests,
    roomType,
  } = route.params;
  // Helper Functions
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫";
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa chọn';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calendar handling
  const onDayPress = (day) => {
    const clickedDate = new Date(day.year, day.month - 1, day.day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) {
      Alert.alert('Thông báo', 'Không thể chọn ngày trong quá khứ');
      return;
    }
  
    if (!selectedDate.checkIn) {
      setSelectedDate({ checkIn: clickedDate, checkOut: null });
    } else if (selectedDate.checkIn && !selectedDate.checkOut) {
      if (clickedDate < selectedDate.checkIn) {
        setSelectedDate({ checkIn: clickedDate, checkOut: null });
      } else if (clickedDate.getTime() === selectedDate.checkIn.getTime()) {
        setSelectedDate({ checkIn: clickedDate, checkOut: null });
      } else {
        setSelectedDate({ ...selectedDate, checkOut: clickedDate });
      }
    } else {
      setSelectedDate({ checkIn: clickedDate, checkOut: null });
    }
  };

  // Time Picker handling
  const onTimeChange = async (event, selectedDate, type) => {
    if (event.type === 'dismissed') {
      setShowTimePicker({ ...showTimePicker, [type]: false });
      return;
    }

    if (selectedDate) {
      setShowTimePicker({ ...showTimePicker, [type]: false });
      setSelectedTime({ ...selectedTime, [type]: selectedDate });
      
      // Check availability if both dates are selected
      if (selectedDate.checkIn && selectedDate.checkOut) {
        await checkRoomAvailability(selectedDate.checkIn, selectedDate.checkOut);
      }
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (selectedDate.checkIn && selectedDate.checkOut) {
      const diffTime = selectedDate.checkOut - selectedDate.checkIn;
      const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (numberOfNights > 0) {
        return numberOfNights * pricePerNight;
      }
    }
    return 0;
  };

  // Get marked dates for calendar
  const getMarkedDates = () => {
    let markedDates = {};

    if (selectedDate.checkIn) {
      let start = selectedDate.checkIn;
      markedDates[formatDate(start).split('/').reverse().join('-')] = {
        startingDay: true,
        color: '#007AFF',
        textColor: 'white'
      };

      if (selectedDate.checkOut) {
        let end = selectedDate.checkOut;
        let current = new Date(start);
        
        while (current <= end) {
          const dateString = formatDate(current).split('/').reverse().join('-');
          
          if (current.getTime() === start.getTime()) {
            markedDates[dateString] = {
              startingDay: true,
              color: '#007AFF',
              textColor: 'white'
            };
          } else if (current.getTime() === end.getTime()) {
            markedDates[dateString] = {
              endingDay: true,
              color: '#007AFF',
              textColor: 'white'
            };
          } else {
            markedDates[dateString] = {
              color: '#E3F2FD',
              textColor: '#007AFF'
            };
          }
          
          current.setDate(current.getDate() + 1);
        }
      }
    }

    return markedDates;
  };
  // Check room availability
  const checkRoomAvailability = async (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return false;
    
    setIsCheckingAvailability(true);
    try {
      const checkInDateTime = new Date(checkInDate);
      const checkOutDateTime = new Date(checkOutDate);
      
      checkInDateTime.setHours(selectedTime.checkIn.getHours(), selectedTime.checkIn.getMinutes());
      checkOutDateTime.setHours(selectedTime.checkOut.getHours(), selectedTime.checkOut.getMinutes());

      const response = await api.get(`/bookings/check-availability/${roomId}`, {
        params: {
          check_in: checkInDateTime.toISOString(),
          check_out: checkOutDateTime.toISOString()
        }
      });

      setIsRoomAvailable(response.data.available);
      
      if (!response.data.available) {
        Alert.alert(
          'Phòng không khả dụng',
          'Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác.'
        );
        return false;
      }
      return true;

    } catch (error) {
      console.error('Error checking room availability:', error);
      Alert.alert(
        'Lỗi',
        'Không thể kiểm tra tình trạng phòng. Vui lòng thử lại sau.'
      );
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Handle continue button press
  const handleContinue = async () => {
    if (!selectedDate.checkIn || !selectedDate.checkOut) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày check-in và check-out.');
      return;
    }

    setIsLoading(true);

    try {
      const checkInDateTime = new Date(selectedDate.checkIn);
      const checkOutDateTime = new Date(selectedDate.checkOut);
      
      checkInDateTime.setHours(
        selectedTime.checkIn.getHours(),
        selectedTime.checkIn.getMinutes()
      );
      
      checkOutDateTime.setHours(
        selectedTime.checkOut.getHours(),
        selectedTime.checkOut.getMinutes()
      );

      if (checkOutDateTime <= checkInDateTime) {
        Alert.alert('Lỗi', 'Thời gian check-out phải sau thời gian check-in.');
        return;
      }

      const isAvailable = await checkRoomAvailability(checkInDateTime, checkOutDateTime);
      if (!isAvailable) return;

      const totalPrice = calculateTotalPrice();

      navigation.navigate('InfoScreen', {
        roomId: roomId,
        checkIn: checkInDateTime.toISOString(),
        checkOut: checkOutDateTime.toISOString(),
        guestCount: guestCount,
        totalPrice: totalPrice,
        hotelImage: hotelImage,
        hotelTitle: hotelTitle,
        hotelAddress: hotelAddress,
        hotelRating: hotelRating,
        roomType: roomType
      });

    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.headerGradient}
          >
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Image
                source={require('../assets/arrow-left.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chọn ngày và giờ</Text>
            <View style={styles.headerIcon} />
          </LinearGradient>
        </View>
  
        {/* Hotel Info Summary */}
        <View style={styles.hotelSummary}>
          <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotelTitle}</Text>
            <Text style={styles.roomType}>{roomType}</Text>
            <Text style={styles.pricePerNight}>{formatPrice(pricePerNight)}/đêm</Text>
          </View>
        </View>
  
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markingType={'period'}
            markedDates={getMarkedDates()}
            style={styles.calendar}
            theme={{
              todayTextColor: '#007AFF',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </View>
  
        {/* Time Selection */}
        <View style={styles.timeSelectionContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.timeBlock}
          >
            <Text style={styles.timeLabel}>Giờ Check-in</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowTimePicker({ ...showTimePicker, checkIn: true })}
            >
              <Text style={styles.timeText}>
                {selectedTime.checkIn.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
  
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.timeBlock}
          >
            <Text style={styles.timeLabel}>Giờ Check-out</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowTimePicker({ ...showTimePicker, checkOut: true })}
            >
              <Text style={styles.timeText}>
                {selectedTime.checkOut.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
  
        {/* Time Pickers */}
        {showTimePicker.checkIn && (
          <DateTimePicker
            value={selectedTime.checkIn}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(event, date) => onTimeChange(event, date, 'checkIn')}
          />
        )}
  
        {showTimePicker.checkOut && (
          <DateTimePicker
            value={selectedTime.checkOut}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(event, date) => onTimeChange(event, date, 'checkOut')}
          />
        )}
  
        {/* Guest Count */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.guestCountContainer}
        >
          <Text style={styles.labelText}>Số người</Text>
          <View style={styles.guestControls}>
            <TouchableOpacity 
              onPress={() => guestCount > 1 && setGuestCount(guestCount - 1)}
              style={[styles.guestButton, guestCount <= 1 && styles.guestButtonDisabled]}
              disabled={guestCount <= 1}
            >
              <Text style={styles.guestButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.guestCountText}>{guestCount}</Text>
            <TouchableOpacity 
              onPress={() => guestCount < maxGuests && setGuestCount(guestCount + 1)}
              style={[styles.guestButton, guestCount >= maxGuests && styles.guestButtonDisabled]}
              disabled={guestCount >= maxGuests}
            >
              <Text style={styles.guestButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
  
        {/* Summary and Continue Button */}
        <View style={styles.summaryContainer}>
          <View style={styles.priceBreakdown}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalPrice}>{formatPrice(calculateTotalPrice())}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isLoading || isCheckingAvailability}
          >
            <LinearGradient
              colors={['#007AFF', '#0056D1']}
              style={styles.gradientButton}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Tiếp tục</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    header: {
      height: Platform.OS === 'ios' ? 100 : 80,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    headerIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    backButton: {
      padding: 8,
    },
    hotelSummary: {
      margin: 16,
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    hotelImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    hotelInfo: {
      marginLeft: 12,
      flex: 1,
    },
    hotelName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 4,
    },
    roomType: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 4,
    },
    pricePerNight: {
      fontSize: 15,
      fontWeight: '600',
      color: '#007AFF',
    },
    calendarContainer: {
      margin: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    calendar: {
      borderRadius: 12,
    },
    timeSelectionContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      gap: 12,
    },
    timeBlock: {
      flex: 1,
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    timeLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 12,
    },
    timeButton: {
      backgroundColor: '#F1F5F9',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    timeText: {
      fontSize: 16,
      color: '#007AFF',
      fontWeight: '600',
    },
    guestCountContainer: {
      margin: 16,
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    labelText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 12,
    },
    guestControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestButton: {
      width: 40,
      height: 40,
      backgroundColor: '#007AFF',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    guestButtonDisabled: {
      backgroundColor: '#CBD5E1',
      shadowOpacity: 0,
    },
    guestButtonText: {
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    guestCountText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1E293B',
      marginHorizontal: 24,
    },
    summaryContainer: {
      margin: 16,
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    priceBreakdown: {
      marginBottom: 16,
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 4,
    },
    totalPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
    },
    continueButton: {
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
    },
    continueButtonDisabled: {
      opacity: 0.7,
    },
    gradientButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#64748B',
    },
  });
  
  export default SelectDate;