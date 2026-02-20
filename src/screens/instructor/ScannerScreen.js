import React, { useState } from 'react';
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

// expo-camera v~16 ships barcode scanning built-in via CameraView
// expo-barcode-scanner is deprecated and removed — do NOT import it
let CameraView, useCameraPermissions;
if (Platform.OS !== 'web') {
  ({ CameraView, useCameraPermissions } = require('expo-camera'));
}

export default function ScannerScreen() {
  const [scanned, setScanned] = useState(false);
  const [paused, setPaused]   = useState(false);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <Ionicons name="phone-portrait-outline" size={64} color={COLORS.primary} />
        <Text style={styles.errorText}>Use Mobile Device</Text>
        <Text style={styles.errorSubtext}>
          QR Code scanning is only available on a physical device.{'\n'}
          Open the app with Expo Go on your phone.
        </Text>
      </View>
    );
  }

  return <NativeScanner scanned={scanned} setScanned={setScanned} paused={paused} setPaused={setPaused} />;
}

/* ── Native-only component ─────────────────────────────── */
function NativeScanner({ scanned, setScanned, paused, setPaused }) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.centered}><Text style={styles.errorText}>Checking camera…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-off" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>Camera Permission Required</Text>
        <Text style={styles.errorSubtext}>Grant camera access to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || paused) return;
    setScanned(true);

    const parts = data.split('|');
    if (parts.length < 3) {
      Alert.alert('Invalid QR Code', 'Please scan a valid student attendance QR code.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const [studentDbId, classId, ...nameParts] = parts;
    const studentName = nameParts.join(' ');

    Alert.alert(
      'Confirm Attendance',
      `Mark attendance for:\n\n${studentName}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await api.post('/attendance/mark.php', {
                studentId: studentDbId,
                classId:   classId,
              });
              if (response.data.success) {
                Alert.alert(
                  '✓ Attendance Marked',
                  `${response.data.student_name} has been marked present.`,
                  [{ text: 'OK', onPress: () => setScanned(false) }]
                );
              } else {
                Alert.alert('Failed', response.data.message || 'Could not mark attendance.', [
                  { text: 'OK', onPress: () => setScanned(false) },
                ]);
              }
            } catch (error) {
              const msg = error.response?.data?.message || 'Failed to mark attendance.';
              Alert.alert('Error', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {!paused && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.overlay}>
            {/* Top label */}
            <View style={styles.topBar}>
              <Text style={styles.headerTitle}>Scan QR Code</Text>
              <Text style={styles.headerSubtitle}>Point camera at a student's QR code</Text>
            </View>

            {/* Viewfinder corners */}
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Status */}
            <View style={styles.bottomBar}>
              <Text style={styles.footerText}>
                {scanned ? 'Processing…' : 'Ready to scan'}
              </Text>
            </View>
          </View>
        </CameraView>
      )}

      {paused && (
        <View style={styles.pausedOverlay}>
          <Ionicons name="pause-circle" size={80} color={COLORS.white} />
          <Text style={styles.pausedText}>Scanner Paused</Text>
        </View>
      )}

      {/* Pause / Resume button */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => { setPaused(p => !p); setScanned(false); }}>
          <Ionicons name={paused ? 'play' : 'pause'} size={22} color={COLORS.white} />
          <Text style={styles.controlButtonText}>{paused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBar: {
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  scanArea: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#fff',
  },
  cornerTL: { top: 0,  left: 0,  borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0,  right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0,  borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  bottomBar: {
    paddingBottom: 90,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#fff',
  },
  pausedOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 30,
    elevation: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});


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

    // QR format: {student_db_id}|{class_id}|{full_name}
    const parts = data.split('|');
    if (parts.length < 3) {
      Alert.alert('Invalid QR Code', 'Please scan a valid student attendance QR code', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const [studentDbId, classId, ...nameParts] = parts;
    const studentName = nameParts.join(' ');

    // Show confirmation before marking
    Alert.alert(
      'Confirm Attendance',
      `Mark attendance for:\n\n${studentName}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await api.post('/attendance/mark.php', {
                studentId: studentDbId,
                classId:   classId,
              });

              if (response.data.success) {
                Alert.alert(
                  '✓ Attendance Marked',
                  `${response.data.student_name} has been marked present.`,
                  [{ text: 'OK', onPress: () => setScanned(false) }]
                );
              } else {
                Alert.alert('Failed', response.data.message || 'Could not mark attendance', [
                  { text: 'OK', onPress: () => setScanned(false) },
                ]);
              }
            } catch (error) {
              const msg = error.response?.data?.message || 'Failed to mark attendance';
              Alert.alert('Error', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          },
        },
      ]
    );
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
