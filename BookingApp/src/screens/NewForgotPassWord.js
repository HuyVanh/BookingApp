import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import api from '../services/api';
import axios from 'axios';

const NewForgotPassWord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {email, resetToken, username} = route.params || {};

  const [isModalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordError1, setPasswordError1] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisible1, setIsPasswordVisible1] = useState(false);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError1('Mật khẩu không khớp');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    setPasswordError('');
    setPasswordError1('');
    return true;
  };

  const handlePasswordChange = async () => {
    if (!email || !resetToken) {
      Alert.alert(
        'Thông báo',
        'Thiếu thông tin xác thực. Vui lòng thử lại từ đầu.',
      );
      return;
    }

    if (validatePassword()) {
      try {
        console.log('Attempting password reset with:', {
          email,
          token: resetToken,
        });

        const response = await axios({
          method: 'post',
          url: `${api.defaults.baseURL}/auth/reset-password`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resetToken}`,
          },
          data: {
            email,
            username,
            newPassword: password,
          },
        });

        console.log('Full reset password response:', {
          status: response.status,
          headers: response.headers,
          data: response.data
        });

        if (response.data.success) {
          setModalVisible(true);
        } else {
          setPasswordError(
            response.data.message || 'Có lỗi khi thay đổi mật khẩu.',
          );
        }
      } catch (error) {
        console.error('Reset password error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        const errorMessage =
          error.response?.data?.message ||
          'Lỗi khi thay đổi mật khẩu. Vui lòng thử lại.';

        if (error.response?.status === 401) {
          Alert.alert(
            'Thông báo',
            'Phiên làm việc đã hết hạn. Vui lòng thực hiện lại.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('EmailForgotPassWordScreen'),
              },
            ],
          );
        } else {
          setPasswordError(errorMessage);
        }
      }
    }
  };

  const navigateToLogin = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={require('../assets/lock1.png')} style={styles.logo} />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Tạo mật khẩu mới</Text>
      </View>

      {/* Mật khẩu mới */}
      <View style={styles.inputContainer}>
        <Image source={require('../assets/lock2.png')} style={styles.icon} />
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Mật khẩu"
          placeholderTextColor="#B0B0B0"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Image
            source={
              isPasswordVisible
                ? require('../assets/eyeOpen.png')
                : require('../assets/eyeClosed.png')
            }
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Xác nhận mật khẩu */}
      <View style={[styles.inputContainer, {marginBottom: 20}]}>
        <Image source={require('../assets/lock2.png')} style={styles.icon} />
        <TextInput
          style={[styles.input, passwordError1 ? styles.inputError : null]}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor="#B0B0B0"
          secureTextEntry={!isPasswordVisible1}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible1(!isPasswordVisible1)}>
          <Image
            source={
              isPasswordVisible1
                ? require('../assets/eyeOpen.png')
                : require('../assets/eyeClosed.png')
            }
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Thông báo lỗi */}
      {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      {passwordError1 && <Text style={styles.errorText}>{passwordError1}</Text>}

      {/* Nút Tiếp tục */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePasswordChange}>
          <Text style={styles.buttonText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>

      {/* Modal thành công */}
      <Modal
        transparent
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.imageContainerModal}>
              <Image
                source={require('../assets/tron.png')}
                style={styles.modalImage}
              />
              <Image
                source={require('../assets/tick.png')}
                style={styles.modalImage1}
              />
            </View>
            <Text style={styles.modalText}>Xin chúc mừng!</Text>
            <Text style={styles.modalText1}>Tài khoản của bạn đã sẵn sàng</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={navigateToLogin}>
              <Text style={styles.modalButtonText}>
                Đi tới màn hình đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  eyeIcon: {
    width: 24,
    height: 24,
  },
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    flex: 1,
  },
  imageContainer: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 90,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    paddingLeft: 20,
    fontWeight: 'bold',
    fontSize: 15,
    color: 'black',
  },
  inputContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 30,
    padding: 10,
    marginBottom: 30,
    backgroundColor: 'white',
  },
  input: {
    padding: 10,
    width: 340,
    height: 43,
    flex: 1,
    fontSize: 15,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 90,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 287,
    height: 399,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  modalImage1: {
    width: 47,
    height: 32,
    position: 'absolute',
    top: '60%',
    left: '30%',
    marginTop: -16,
    marginLeft: -23.5,
    resizeMode: 'contain',
  },
  modalText: {
    fontWeight: 'bold',
    fontSize: 25,
    color: '#4A7DFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText1: {
    color: '#717171',
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButton: {
    width: 230,
    height: 56,
    backgroundColor: '#4A7DFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: -10,
  },
  inputError: {
    borderColor: 'red',
  },
});
export default NewForgotPassWord;
