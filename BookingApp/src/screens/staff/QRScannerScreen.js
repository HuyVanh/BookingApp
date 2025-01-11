import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, PermissionsAndroid } from 'react-native';
import { RNCamera } from 'react-native-camera';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const QRScannerScreen = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const messageRef = useRef();

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Yêu cầu quyền truy cập Camera",
          message: "Ứng dụng cần quyền truy cập camera để quét mã QR",
          buttonNeutral: "Hỏi lại sau",
          buttonNegative: "Từ chối",
          buttonPositive: "Đồng ý"
        }
      );
      setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
    } catch (err) {
      console.warn(err);
      setHasPermission(false);
    }
  };

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  const showNotification = (type, message, description = '') => {
    showMessage({
      message: message,
      description: description,
      type: type, // success, danger, warning
      icon: type === 'success' ? 'success' : 'danger',
      duration: 3000,
      style: styles.flashMessage,
      titleStyle: styles.flashMessageTitle,
      textStyle: styles.flashMessageText,
      floating: true,
      hideStatusBar: false,
    });
    setTimeout(() => setIsScanning(true), 3000);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (!isScanning) return;
    setIsScanning(false);
  
    try {
      const qrCode = typeof data === 'string' ? data : JSON.stringify(data);
  
      const response = await api.post('/staff/verify-ticket', {
        qrCode: qrCode
      });
  
      if (response.data.success) {
        const { ticket } = response.data;
        
        showNotification(
          'success',
          'Xác thực thành công',
          'Vé đã được xác nhận'
        );
      } else {
        showNotification(
          'warning',
          'Thất bại',
          response.data.message
        );
      }
    } catch (error) {
      showNotification(
        'danger',
        'Lỗi',
        error.response?.data?.message || 'Có lỗi xảy ra'
      );
    } finally {
      setTimeout(() => setIsScanning(true), 3000);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Không có quyền truy cập camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        onBarCodeRead={handleBarCodeScanned}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>
          <Text style={styles.instruction}>
            Đặt mã QR vào khung để quét
          </Text>
        </View>
      </RNCamera>
      <FlashMessage position="top" ref={messageRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  flashMessage: {
    marginTop: 20,
    borderRadius: 8,
    padding: 10,
  },
  flashMessageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flashMessageText: {
    fontSize: 14,
  }
});

export default QRScannerScreen;