import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

const InfoProfileScreen = ({navigation, route}) => {
  const {userData} = route.params;
  const [user, setUser] = useState({
    username: userData?.user?.username || '',
    email: userData?.user?.email || '',
    phone_number: userData?.user?.phone_number || '',
    fullName: userData?.user?.fullName || '',
    birthDate: userData?.profile?.birthday
      ? new Date(userData.profile.birthday)
      : new Date(),
  });
  const [updatedUserData, setUpdatedUserData] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isEdited, setIsEdited] = useState(false);

  const formatDate = date => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data.user;
      setUpdatedUserData(userData);
      setUser({
        username: userData.username || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        fullName: userData.fullName || '',
        birthDate: userData.profile?.birthday
          ? new Date(userData.profile.birthday)
          : new Date(),
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  // Thêm useEffect để lắng nghe sự kiện focus
  useEffect(() => {
    fetchUserProfile();
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const validatePhoneNumber = phone => {
    if (!phone) return false;
    const trimmedPhone = phone.trim();
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(trimmedPhone);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || user.birthDate;
    setShowDatePicker(false);
    setUser({...user, birthDate: currentDate});
    setIsEdited(true);
  };

  const handleTextChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsEdited(true);
  };

  const handleUpdateProfile = async () => {
    // Log để debug
    console.log('Phone number before validation:', user.phone_number);
    console.log('Phone number type:', typeof user.phone_number);

    if (!user.phone_number) {
      setPhoneError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhoneNumber(user.phone_number)) {
      setPhoneError(
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số, bắt đầu bằng số 0',
      );
      return;
    }

    setPhoneError('');

    try {
      const response = await api.put('/auth/update-profile', {
        username: user.username,
        email: user.email,
        phone_number: user.phone_number.trim(),
        birthDate: user.birthDate,
        fullName: user.fullName,
      });

      if (response.data) {
        await fetchUserProfile();
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
          {text: 'OK', onPress: () =>{
            fetchUserProfile();
            navigation.goBack()},
          } 
        ]);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(
        'Lỗi',
        'Không thể cập nhật thông tin. Vui lòng thử lại sau.',
        [{text: 'OK'}],
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chỉnh sửa thông tin cá nhân</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={user.username}
          onChangeText={text => handleTextChange('username', text)}
          placeholder="Nhập tên người dùng"
        />
        <TextInput
          style={styles.input}
          value={user.fullName}
          onChangeText={text => handleTextChange('fullName', text)}
          placeholder="Nhập họ và tên"
        />

        <TouchableOpacity
          style={styles.dateContainer}
          onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={styles.dateInput}
            value={formatDate(user.birthDate)}
            editable={false}
            placeholder="Ngày sinh"
          />
          <Icon
            name="calendar-outline"
            size={24}
            color="black"
            style={styles.dateIcon}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={user.birthDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <View style={styles.emailContainer}>
          <TextInput
            style={styles.emailInput}
            value={user.email}
            onChangeText={text => handleTextChange('email', text)}
            keyboardType="email-address"
            placeholder="Nhập email"
            editable={false}
          />
          <Icon
            name="mail-outline"
            size={24}
            color="black"
            style={styles.emailIcon}
          />
        </View>

        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

        <View style={styles.phoneContainer}>
          <Image
            source={require('../assets/iconCo.png')}
            style={styles.phoneIcon}
          />
          <TextInput
            style={styles.phoneInput}
            value={user.phone_number}
            onChangeText={text => handleTextChange('phone_number', text)}
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
          />
        </View>

        <View style={{flex: 1}} />

        <TouchableOpacity
          style={[styles.saveButton, !isEdited && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={!isEdited}>
          <Text style={styles.saveButtonText}>Cập nhật</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000000',
  },
  form: {
    borderRadius: 15,
    padding: 15,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  phoneContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 20,
  },
  phoneIcon: {
    width: 24,
    height: 24,
    marginLeft: 10,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
    padding: 10,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20,
  },
  emailIcon: {
    paddingRight: 10,
  },
  emailInput: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
    padding: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
  },
  dateInput: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
    marginLeft: 5,
  },
  dateIcon: {
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
});

export default InfoProfileScreen;
