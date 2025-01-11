// screens/staff/StaffProfileScreen.js
import { StyleSheet, Text, TouchableOpacity, View, Image, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

const StaffProfileScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7DFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/IconLogo.png')}
          style={styles.appLogo}
        />
        <Text style={styles.headerText}>Thông tin nhân viên</Text>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.profileInfo}>
          <Image
            source={
              userData?.avatar 
                ? { uri: userData.avatar }
                : require('../../assets/onboard1.png')
            }
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>{userData?.user?.username || 'Tên nhân viên'}</Text>
            <Text style={styles.email}>{userData?.user?.email || 'Email'}</Text>
            <Text style={styles.role}>Nhân viên</Text>
            {userData?.phone && (
              <Text style={styles.phone}>{userData.phone}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.functionContainer}>
          <TouchableOpacity 
            style={styles.functionButton} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('InfoProfile', { userData: userData })}
          >
            <Icon name="person-outline" size={24} color="black" />
            <Text style={styles.functionText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.functionButton} 
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="log-out-outline" size={24} color="black" />
            <Text style={[styles.functionText, styles.logoutText]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Đăng xuất</Text>
          <Text style={styles.modalMessage}>Bạn có chắc chắn muốn đăng xuất không?</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleLogout}
            >
              <Text style={styles.modalButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton1} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText1}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles giữ nguyên như ProfileScreen, chỉ thêm style cho role
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
  },
  profileInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 80,
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
    marginTop: 0, // Add margin at the top for spacing from previous elements
    paddingVertical: 0, // Add padding to the top and bottom of the container
  },
  functionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 10, // Increase vertical margin for more space between buttons
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#C70D0D',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
    marginVertical: 5,
  },
  modalButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 30,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButton1: {
    backgroundColor: '#E2E2E2',
    borderRadius: 30,
    padding: 15,
    marginTop: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtonText1: {
    color: '#4A7DFF',
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
  role: {
    fontSize: 16,
    marginTop: 5,
    color: '#4A7DFF',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default StaffProfileScreen;