
import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import {AuthContext} from '../contexts/AuthContext';

const LoginScreen = ({navigation}) => {
  const {login} = useContext(AuthContext);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');


  const handleLogin = async () => {
    let valid = true;
  
    if (username.trim() === '') {
      setUsernameError('Không để trống');
      valid = false;
    } else {
      setUsernameError('');
    }
  
    if (password.trim() === '') {
      setPasswordError('Không để trống');
      valid = false;
    } else if (password.length < 4) {
      setPasswordError('Mật khẩu phải có ít nhất 4 ký tự');
      valid = false;
    } else {
      setPasswordError('');
    }
  
    if (valid) {
      try {
        await login(username, password);
        console.log("Login successful, user data:", username);
      } catch (error) {
        let errorMessage = 'Đã có lỗi xảy ra';
  
        // Kiểm tra response từ server
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message;
  
          if (status === 401) {
            errorMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác';
          } else if (status === 403 && message === 'Tài khoản đã bị vô hiệu hóa') {
            errorMessage = 'Tài khoản của bạn đã bị vô hiệu hóa';
          } else if (message) {
            errorMessage = message;
          }
        }
  
        Alert.alert(
          'Đăng nhập thất bại',
          errorMessage,
          [
            {
              text: 'Đóng',
              style: 'cancel',
            }
          ]
        );
  
        // Reset mật khẩu field sau khi đăng nhập thất bại
        setPassword('');
      }
    }
  };
  

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng Nhập</Text>
      <Text style={styles.title}>với tài khoản</Text>
      <Text style={styles.title2}>của bạn</Text>

      <View style={styles.inputContainer}>
        <Image source={require('../assets/iconuser.png')} style={styles.icon} />
        <TextInput
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="Tên đăng nhập"
          placeholderTextColor="#B0B0B0"
          keyboardType="default"
          value={username}
          onChangeText={setUsername}
        />
      </View>
      {usernameError ? (
        <Text style={styles.errorText}>{usernameError}</Text>
      ) : null}

      <View style={styles.inputContainer}>
        <Image source={require('../assets/look.png')} style={styles.icon} />
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
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : null}

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.textclick}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      {/* Nút Đăng nhập */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
          <Image
            source={require('../assets/iconnext.png')}
            style={styles.buttonIcon}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.txt}>Bạn chưa có tài khoản?</Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.textclick}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Giữ nguyên các styles của bạn
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 45,
    color: 'black',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  title2: {
    fontSize: 40,
    color: 'black',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 70,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  inputError: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },
  eyeIcon: {
    width: 26,
    height: 26,
  },
  button: {
    width: '100%',
    backgroundColor: '#007BFF',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 35,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 22,
    height: 22,
    marginLeft: 10,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txt: {
    fontSize: 16,
    marginBottom: 40,
    marginLeft: 40,
    color: '#BEBEBE',
  },
  textclick: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 40,
    marginLeft: 3,
    color: '#007BFF',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginLeft: 10,
  },
});

export default LoginScreen;
