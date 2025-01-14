import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import api from '../services/api';

const EmailForgotPassWordScreen = ({ navigation }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!inputValue) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
      return;
    }

    if (!isValidEmail(inputValue)) {
      Alert.alert('Thông báo', 'Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);
    try {

      const response = await api.post('/otp/send', {
        email: inputValue
      });


      // Kiểm tra message từ response thay vì status
      if (response.data.message) {
        setOtpSent(true);
        Alert.alert(
          'Thành công',
          'Mã OTP đã được gửi tới email của bạn',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('NextForgotPassWord', { 
                email: inputValue 
              }),
            },
          ]
        );
      } else {
        Alert.alert('Thông báo', 'Không thể gửi OTP. Vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error sending OTP:', error.response?.data); 
      Alert.alert(
        'Thông báo',
        error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/lock.png')} 
        style={styles.logo}
      />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Quên Mật Khẩu</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập email của bạn để nhận mã xác thực
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập địa chỉ email..."
            placeholderTextColor="#999"
            onChangeText={setInputValue}
            value={inputValue}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Gửi mã xác thực</Text>
          )}
        </TouchableOpacity>

        {otpSent && (
          <Text style={styles.successMessage}>
            Mã OTP đã được gửi đến email của bạn
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 55,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  button: {
    height: 55,
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4A7DFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successMessage: {
    marginTop: 20,
    color: '#4CAF50',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default EmailForgotPassWordScreen;