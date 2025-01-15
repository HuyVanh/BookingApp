// src/screens/RegisterScreen.js
import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import axios from 'axios';

const RegisterScreen = ({navigation}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);

  const validateInputs = () => {
    const newErrors = {};

    if (!username) newErrors.username = 'Vui lòng nhập tên đăng nhập!';
    if (!fullName) newErrors.fullName = 'Vui lòng nhập tên đầy đủ!';
    if (!email) newErrors.email = 'Vui lòng nhập email!';
    if (!phone) newErrors.phone_number = 'Vui lòng nhập số điện thoại!';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu!';

    const emailPattern = /^[^\s@]+@gmail\.com$/;
    if (email && !emailPattern.test(email)) {
      newErrors.email =
        'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: example@gmail.com)!';
    }

    const phonePattern = /^[0-9]{10,12}$/;
    if (phone && !phonePattern.test(phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ! Vui lòng nhập lại.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateInputs()) {
      try {
        const response = await axios.post(
          'https://backendbookingapp-2fav.onrender.com/api/auth/register',
          {
            username,
            fullName: fullName,
            email,
            phone_number: phone,
            password,
          },
        );

        if (response.status === 200 || response.status === 201) {
          setIsModalVisible(true);
        } else {
          alert('Đăng ký thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error(error);
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          alert(error.response.data.message);
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    }
  };
  
  

  const handleInputChange = (setter, errorKey) => value => {
    setter(value);
    if (errors[errorKey]) {
      setErrors(prevErrors => ({...prevErrors, [errorKey]: undefined}));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Đăng ký</Text>
      </View>

      <View style={styles.avatarContainer}>
        <Image source={require('../assets/user.png')} style={styles.avatar} />
        <TouchableOpacity>
          <Image
            source={require('../assets/image.png')}
            style={styles.addIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Tên đăng nhập */}
      <TextInput
        style={[styles.input, errors.username && styles.errorInput]}
        placeholder="Tên đăng nhập"
        placeholderTextColor="#B0B0B0"
        keyboardType="default"
        value={username}
        onChangeText={handleInputChange(setUsername, 'username')}
      />
      {errors.username && (
        <Text style={styles.errorText}>{errors.username}</Text>
      )}

      {/* Tên đầy đủ */}
      <TextInput
        style={[styles.input, errors.fullName && styles.errorInput]}
        placeholder="Tên đầy đủ"
        placeholderTextColor="#B0B0B0"
        keyboardType="default"
        value={fullName}
        onChangeText={handleInputChange(setFullName, 'fullName')}
      />
      {errors.fullName && (
        <Text style={styles.errorText}>{errors.fullName}</Text>
      )}

      {/* Mật khẩu */}
      <View
        style={[
          styles.passwordContainer,
          errors.password && styles.errorInputContainer,
        ]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mật khẩu"
          placeholderTextColor="#B0B0B0"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={handleInputChange(setPassword, 'password')}
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
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      {/* Email */}
      <TextInput
        style={[styles.input, errors.email && styles.errorInput]}
        placeholder="Email"
        placeholderTextColor="#B0B0B0"
        keyboardType="email-address"
        value={email}
        onChangeText={handleInputChange(setEmail, 'email')}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Số điện thoại */}
      <View
        style={[
          styles.phoneContainer,
          errors.phone && styles.errorInputContainer,
        ]}>
        <Image
          source={require('../assets/iconCo.png')}
          style={styles.flagIcon}
        />
        <TextInput
          style={styles.phoneInput}
          placeholder="Số điện thoại"
          placeholderTextColor="#B0B0B0"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={handleInputChange(setPhone, 'phone')}
        />
      </View>
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Nút Tiếp tục */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Tiếp tục</Text>
      </TouchableOpacity>

      {/* Modal Thông báo đăng ký thành công */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(!isModalVisible);
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <View style={styles.checkmarkContainer}>
              <Image
                source={require('../assets/check.png')}
                style={styles.checkmarkIcon}
              />
            </View>
            <Text style={styles.modalTitle}>Xin chúc mừng!</Text>
            <Text style={styles.modalSubtitle}>
              Tài khoản của bạn đã sẵn sàng
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsModalVisible(!isModalVisible);
                navigation.replace('Login');
              }}>
              <Text style={styles.modalButtonText}>
                Đi tới màn hình đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F4F4F4',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  addIcon: {
    width: 35,
    height: 35,
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    elevation: 2,
  },
  input: {
    height: 65,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 25,
    color: '#000',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    top: 30,
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorInputContainer: {
    borderColor: 'red',
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    height: 65,
    top: 30,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: '#000',
    fontSize: 16,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 25,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    height: 65,
    top: 30,
  },
  flagIcon: {
    width: 30,
    height: 20,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    color: '#000',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    top: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    top: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkIcon: {
    width: 50,
    height: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default RegisterScreen;
