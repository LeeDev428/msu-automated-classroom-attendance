import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

// Only import camera on native platforms
let Camera, BarCodeScanner;
if (Platform.OS !== 'web') {
  Camera = require('expo-camera').Camera;
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
}

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(false);
        return;
      }
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      // Parse QR code data (expected format: studentId|classId|timestamp)
      const qrData = data.split('|');
      
      if (qrData.length >= 2) {
        const [studentId, classId] = qrData;
        
        // Send attendance record to backend
        const response = await api.post('/attendance/mark.php', {
          studentId,
          classId,
          timestamp: new Date().toISOString(),
        });

        if (response.data.success) {
          Alert.alert(
            'Attendance Marked',
            `Student ${studentId} successfully checked in for class ${classId}`,
            [
              {
                text: 'OK',
                onPress: () => setScanned(false),
              },
            ]
          );
        } else {
          Alert.alert('Error', response.data.message || 'Failed to mark attendance');
          setScanned(false);
        }
      } else {
        Alert.alert('Invalid QR Code', 'Please scan a valid attendance QR code');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
      console.error('Scanner error:', error);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>
          {Platform.OS === 'web' ? 'Web Camera Not Supported' : 'No access to camera'}
        </Text>
        <Text style={styles.errorSubtext}>
          {Platform.OS === 'web' 
            ? 'QR Scanner requires a physical device. Please use Expo Go on your phone or Android/iOS emulator.'
            : 'Please grant camera permission to scan QR codes'}
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Ionicons name="phone-portrait-outline" size={64} color={COLORS.primary} />
        <Text style={styles.errorText}>Use Mobile Device</Text>
        <Text style={styles.errorSubtext}>
          QR Code scanning is only available on mobile devices.{'\n'}
          Please scan the QR code with Expo Go app on your phone.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && (
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Scan QR Code</Text>
              <Text style={styles.headerSubtitle}>
                Position the QR code within the frame
              </Text>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {scanned ? 'Processing...' : 'Ready to scan'}
              </Text>
              {scanned && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.resetButtonText}>Tap to Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Camera>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setScanning(!scanning)}
        >
          <Ionicons
            name={scanning ? 'pause' : 'play'}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.controlButtonText}>
            {scanning ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grayLight,
  },
  scanArea: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
  },
  footer: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
