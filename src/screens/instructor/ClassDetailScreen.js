import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

export default function ClassDetailScreen({ route, navigation }) {
  const { classData } = route.params;
  const [classInfo, setClassInfo] = useState(classData);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isActive, setIsActive] = useState(classData.is_active);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchClassDetails();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchClassDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch enrolled students
      const response = await api.get(`/enrollments/get_students.php?class_id=${classInfo.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStudents(response.data.students || []);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClassDetails();
  };

  const handleToggleActive = async (value) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      await api.put('/classes/index.php', {
        id: classInfo.id,
        is_active: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsActive(value);
      setClassInfo({ ...classInfo, is_active: value });
    } catch (error) {
      console.error('Toggle active error:', error);
      Alert.alert('Error', 'Failed to update class status');
      setIsActive(!value);
    } finally {
      setUpdating(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const scheduleDisplay = classInfo.days && classInfo.start_time && classInfo.end_time
    ? `${classInfo.days} • ${formatTime(classInfo.start_time)} - ${formatTime(classInfo.end_time)}`
    : 'No schedule set';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{classInfo.class_name}</Text>
            <Text style={styles.headerSubtitle}>{classInfo.class_code}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Class Status Toggle */}
        {/* <View style={styles.statusCard}>
          <View style={styles.statusToggleContainer}>
            <View style={styles.statusTextContainer}>
              <Ionicons 
                name={isActive ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={isActive ? COLORS.success : COLORS.textSecondary} 
              />
              <Text style={[styles.statusText, { color: isActive ? COLORS.success : COLORS.textSecondary }]}>
                {isActive ? 'Class is active' : 'Class is inactive'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={handleToggleActive}
              trackColor={{ false: COLORS.grayLight, true: COLORS.success }}
              thumbColor={COLORS.white}
              disabled={updating}
            />
          </View>
          {!isActive && (
            <View style={styles.inactiveNotice}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
              <Text style={styles.inactiveNoticeText}>
                Activate class to enable QR scanning
              </Text>
            </View>
          )}
        </View> */}

        {/* Class Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>{classInfo.section}</Text>
          {classInfo.description && (
            <Text style={styles.descriptionText}>{classInfo.description}</Text>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{scheduleDisplay}</Text>
          </View>
          
          {classInfo.room && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{classInfo.room}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Enrolled Students: {students.length}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('EnrollStudent', { classData: classInfo })}
          >
            <Ionicons name="person-add" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Enroll Student</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity style={styles.secondaryButton} disabled={!isActive}>
              <Ionicons name="qr-code" size={20} color={isActive ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.secondaryButtonText, !isActive && styles.disabledText]}>
                Export QR Codes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="document-text" size={20} color={COLORS.secondary} />
              <Text style={styles.secondaryButtonText}>Report</Text>
            </TouchableOpacity>
          </View>

          {!isActive && (
            <View style={styles.disabledNotice}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
              <Text style={styles.disabledNoticeText}>
                Class not active. Enable class to scan/generate QR codes
              </Text>
            </View>
          )}
        </View>

        {/* Enrolled Students List */}
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>Enrolled Students ({students.length})</Text>
          
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>No students enrolled yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Click "Enroll Student" to add students to this class
              </Text>
            </View>
          ) : (
            students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {student.first_name} {student.last_name}
                  </Text>
                  <Text style={styles.studentId}>ID: {student.student_id}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.studentAction}
                  onPress={() => navigation.navigate('StudentDetail', { studentData: student, classData: classInfo })}
                >
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  inactiveNoticeText: {
    fontSize: 13,
    color: COLORS.warning,
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  actionSection: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  disabledText: {
    color: COLORS.gray,
  },
  disabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disabledNoticeText: {
    fontSize: 12,
    color: COLORS.warning,
    marginLeft: 8,
    flex: 1,
  },
  studentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  studentId: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  studentAction: {
    padding: 8,
  },
});
