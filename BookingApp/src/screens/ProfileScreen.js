import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  Alert,
  PermissionsAndroid, // Thêm dòng này
  Platform, // Thêm dòng này
} from 'react-native';
import React, {useEffect, useState, useContext} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../contexts/AuthContext';
import api from '../services/api';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const ProfileScreen = ({navigation}) => {
  const {logout} = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
  const [changeAvatarModalVisible, setChangeAvatarModalVisible] =
    useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Yêu cầu quyền truy cập Camera',
            message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh đại diện',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Từ chối',
            buttonPositive: 'Đồng ý',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      console.log('User profile data:', response.data);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await logout();
      setModalVisible(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pickImage = async (type) => {
    try {
      if (type === 'camera') {
        const hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
          Alert.alert('Thông báo', 'Bạn cần cấp quyền truy cập camera để sử dụng tính năng này');
          return;
        }
      }
  
      const options = {
        mediaType: 'photo',
        quality: 1,
        maxWidth: 500,
        maxHeight: 500,
      };
  
      const result = type === 'camera' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);
  
      console.log('Image picker result:', result);
  
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
  
      if (result.errorCode) {
        console.log('ImagePicker Error:', result.errorMessage);
        Alert.alert('Lỗi', result.errorMessage);
        return;
      }
  
      if (result.assets && result.assets[0]) {
      const formData = new FormData();
      const imageFile = {
        uri: Platform.OS === 'android' ? result.assets[0].uri : result.assets[0].uri.replace('file://', ''),
        type: 'image/jpeg',
        name: result.assets[0].fileName || 'avatar.jpg'
      };
      
      console.log('Image file details:', imageFile);
      formData.append('avatar', imageFile);

      try {
        const response = await api.put('/user/update-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: formData => formData,
          onUploadProgress: (progressEvent) => {
            console.log('Upload Progress:', progressEvent.loaded / progressEvent.total);
          },
        });
        console.log('Upload response:', response);

        if (response.data?.success) {
          await fetchUserProfile();
          Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
          setChangeAvatarModalVisible(false);
        }
      } catch (error) {
        console.error('Upload error details:', {
          message: error.message,
          code: error.code,
          response: error.response,
          config: error.config
        });
        Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng');
      }
    }
  } catch (error) {
    console.error('Error in pickImage:', error);
    Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý ảnh');
  }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        setPasswordError('Mật khẩu mới không khớp');
        return;
      }

      const response = await api.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công');
        setChangePasswordModalVisible(false);
        resetPasswordForm();
      }
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu',
      );
    }
  };

  const resetPasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7DFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/IconLogo.png')}
          style={styles.appLogo}
        />
        <Text style={styles.headerText}>Cá nhân</Text>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileInfo}>
          <Image
            source={
              userData?.user?.avatar
                ? {uri: `${api.defaults.baseURL}${userData.user.avatar}`}
                : require('../assets/onboard1.png')
            }
            style={styles.avatar}
            defaultSource={require('../assets/onboard1.png')}
            onError={error => {
              console.log('Error loading image:', error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('Image loaded successfully');
            }}
          />
          <TouchableOpacity
            style={styles.changeAvatarButton}
            onPress={() => setChangeAvatarModalVisible(true)}>
            <Icon name="camera-outline" size={20} color="white" />
            <Text style={styles.changeAvatarText}>Thay đổi ảnh</Text>
          </TouchableOpacity>
          <View style={styles.textContainer}>
            <Text style={styles.name}>
              {userData?.user?.username || 'Tên người dùng'}
            </Text>
            <Text style={styles.email}>{userData?.user?.email || 'Email'}</Text>
            {userData?.phone && (
              <Text style={styles.phone}>{userData.phone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Function Card */}
      <View style={styles.card}>
        <View style={styles.functionContainer}>
          <TouchableOpacity
            style={styles.functionButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('InfoProfile', {userData: userData})
            }>
            <Icon name="person-outline" size={24} color="black" />
            <Text style={styles.functionText}>Chỉnh sửa thông tin cá nhân</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.functionButton}
            activeOpacity={0.7}
            onPress={() => setChangePasswordModalVisible(true)}>
            <Icon name="lock-closed-outline" size={24} color="black" />
            <Text style={styles.functionText}>Đổi mật khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.functionButton}
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}>
            <Icon name="log-out-outline" size={24} color="black" />
            <Text style={[styles.functionText, styles.logoutText]}>
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Đăng xuất</Text>
          <Text style={styles.modalMessage}>
            Bạn có chắc chắn muốn đăng xuất không?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={handleLogout}>
              <Text style={styles.modalButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton1}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText1}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        transparent={true}
        visible={changePasswordModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setChangePasswordModalVisible(false);
          resetPasswordForm();
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            setChangePasswordModalVisible(false);
            resetPasswordForm();
          }}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, styles.changePasswordModal]}>
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>

          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu hiện tại"
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowOldPassword(!showOldPassword)}>
              <Icon
                name={showOldPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu mới"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}>
              <Icon
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}>
              <Text style={styles.modalButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton1}
              onPress={() => {
                setChangePasswordModalVisible(false);
                resetPasswordForm();
              }}>
              <Text style={styles.modalButtonText1}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Avatar Modal */}
      <Modal
        transparent={true}
        visible={changeAvatarModalVisible}
        animationType="slide"
        onRequestClose={() => setChangeAvatarModalVisible(false)}>
        <TouchableWithoutFeedback
          onPress={() => setChangeAvatarModalVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, styles.avatarModal]}>
          <Text style={styles.modalTitle}>Thay đổi ảnh đại diện</Text>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => pickImage('library')}>
            <Text style={styles.modalButtonText}>Chọn từ thư viện</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => pickImage('camera')}>
            <Text style={styles.modalButtonText}>Chụp ảnh mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButton1}
            onPress={() => setChangeAvatarModalVisible(false)}>
            <Text style={styles.modalButtonText1}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appLogo: {
    width: 40,
    height: 40,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000000',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f4f4f4',
    resizeMode: 'cover',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    marginTop: 10,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    marginTop: 5,
    color: 'black',
    textAlign: 'center',
  },
  functionContainer: {
    marginTop: 0,
    paddingVertical: 0,
  },
  functionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 10,
  },
  functionText: {
    marginLeft: 10,
    fontSize: 18,
    color: '#000000',
  },
  logoutText: {
    color: 'red',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  changePasswordModal: {
    paddingBottom: 30,
  },
  modalMessage: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
    marginVertical: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  modalButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#4A7DFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButton1: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonText1: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  phone: {
    fontSize: 16,
    marginTop: 5,
    color: 'black',
    textAlign: 'center',
  },
  passwordInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  changeAvatarText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  avatarModal: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: 15,
  },
});

export default ProfileScreen;
