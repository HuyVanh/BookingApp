import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';

const NextForgotPassWord = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(59);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Kiểm tra nếu không có email, thông báo lỗi
  useEffect(() => {
    if (!email) {
      setErrorMessage('Email không được cung cấp. Vui lòng thử lại.');
    }
  }, [email]);

  // Hàm xử lý khi người dùng thay đổi giá trị OTP
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;

    // Chuyển sang ô tiếp theo khi người dùng nhập một ký tự
    if (text.length === 1 && index < otp.length - 1) {
      const nextInput = index + 1;
      inputs[nextInput]?.focus(); // Focus vào TextInput tiếp theo
    }

    setOtp(newOtp);
    setErrorMessage(''); // Xóa thông báo lỗi khi người dùng thay đổi giá trị OTP
  };

  // Đếm ngược thời gian
  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
      return () => clearInterval(timer); // Dọn dẹp interval khi không còn cần thiết
    }
  }, [seconds]);

  // Xác nhận mã OTP
 // Trong NextForgotPassWord, sửa phần handleConfirm:
 const handleConfirm = async () => {
  const enteredOtp = otp.join('');
  if (enteredOtp.length < 6) {
    setErrorMessage('Vui lòng nhập đầy đủ mã OTP.');
    return;
  }

  setLoading(true);
  try {
    console.log('Verifying OTP:', {
      email,
      otp: enteredOtp
    }); // Debug log

    const response = await api.post('/otp/verify', {
      email,
      otp: enteredOtp
    });

    console.log('Verify OTP Response:', response.data); // Debug log

    // Nếu xác thực thành công
    if (response.data.message === 'Xác thực OTP thành công.') {
      setErrorMessage('');
      const token = response.data.token;
      console.log('Token received:', token); // Debug log

      navigation.navigate('NewForgotPassWord', {
        email: email,
        resetToken: token
      });
    } else {
      setErrorMessage(response.data.message || 'Mã OTP không chính xác!');
    }
  } catch (error) {
    console.error('OTP Verification Error:', {
      error: error.response?.data,
      status: error.response?.status,
      message: error.response?.data?.message
    }); // Detailed error log
    
    setErrorMessage(
      error.response?.data?.message || 
      'Không thể xác thực OTP. Vui lòng thử lại.'
    );
  } finally {
    setLoading(false);
  }
};

// Handle resend OTP
const handleResendOTP = async () => {
  if (seconds > 0) return;

  try {
    setLoading(true);
    const response = await api.post('/auth/forgot-password/send-otp', {
      email
    });

    if (response.data.success) {
      setSeconds(59);
      Alert.alert('Thông báo', 'Mã OTP mới đã được gửi!');
    }
  } catch (error) {
    Alert.alert(
      'Thông báo',
      error.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.'
    );
  } finally {
    setLoading(false);
  }
};
  const inputs = [];

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.textBold1}>Nhập mã OTP đã gửi tới thiết bị của bạn</Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            maxLength={1}
            keyboardType="numeric"
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            ref={(input) => (inputs[index] = input)} // Lưu tham chiếu TextInput để chuyển focus
          />
        ))}
      </View>

      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.textContainer}>
        <Text style={styles.textBold}>
          Làm mới mã OTP trong <Text style={styles.countdown}>{seconds} giây</Text>
        </Text>
      </View>

      {/* Cố định nút */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang xác nhận...' : 'Xác nhận'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    flex: 1, // Cho phép container chiếm toàn bộ chiều cao của màn hình
  },
  textContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  textBold1: {
    paddingTop: 57,
    paddingLeft: 17,
    fontWeight: 'bold',
    fontSize: 30,
    color: 'black',
  },
  textBold: {
    paddingLeft: 17,
    paddingTop: 72,
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  otpContainer: {
    paddingTop: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  otpInput: {
    width: 40,
    height: 55,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 15,
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 40,
    fontWeight: 'bold',
    backgroundColor: 'white',
    marginHorizontal: 5,
  },
  countdown: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4A7DFF',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 185,
  },
  fixedButtonContainer: {
    flex: 1, // Giữ cho nút "Xác nhận" cố định ở dưới
    justifyContent: 'flex-end', // Đặt nút "Xác nhận" ở dưới cùng của màn hình
    marginTop: 20, // Điều chỉnh khoảng cách nếu cần thiết
  },
  button: {
    width: 353,
    height: 60,
    backgroundColor: '#4A7DFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default NextForgotPassWord;
