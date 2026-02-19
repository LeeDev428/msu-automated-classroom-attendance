import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

export default function ClassesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get('/classes/index.php', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Classes fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchClasses();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleDeleteClass = async (classId) => {
    Alert.alert('Delete Class', 'Are you sure you want to delete this class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            await api.delete(`/classes/index.php?id=${classId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchClasses();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete class');
          }
        }
      }
    ]);
  };

  const filteredClasses = classes.filter((cls) =>
    cls.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.class_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>My Classes</Text>
        <Text style={styles.headerSubtitle}>Manage your class schedules</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Add Class Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddClass')}>
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add New Class</Text>
        </TouchableOpacity>

        {/* Classes List */}
        <ScrollView 
          style={styles.classList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {filteredClasses.map((cls) => (
            <ClassCard 
              key={cls.id} 
              classData={cls} 
              onDelete={() => handleDeleteClass(cls.id)}
              onRefresh={fetchClasses}
              navigation={navigation}
            />
          ))}

          {filteredClasses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>No classes found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const ClassCard = ({ classData, onDelete, onRefresh, navigation }) => {
  const [isActive, setIsActive] = useState(classData.is_active);
  const [updating, setUpdating] = useState(false);

  const handleToggleActive = async (value) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      await api.put('/classes/index.php', {
        id: classData.id,
        is_active: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsActive(value);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Toggle active error:', error);
      Alert.alert('Error', 'Failed to update class status');
      setIsActive(!value); // Revert on error
    } finally {
      setUpdating(false);
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const scheduleDisplay = classData.days && classData.start_time && classData.end_time
    ? `${classData.days} • ${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
    : 'No schedule set';

  return (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => navigation.navigate('ClassDetail', { classData })}
      activeOpacity={0.7}
    >
      {/* Active/Inactive Toggle */}
      <View 
        style={styles.statusToggleContainer}
        onStartShouldSetResponder={() => true}
        onResponderRelease={(e) => e.stopPropagation()}
      >
        <View style={styles.statusTextContainer}>
          <Ionicons 
            name={isActive ? "checkmark-circle" : "close-circle"} 
            size={18} 
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
          <Ionicons name="information-circle-outline" size={14} color={COLORS.warning} />
          <Text style={styles.inactiveNoticeText}>
            Activate class to enable QR scanning
          </Text>
        </View>
      )}

      <View style={styles.classCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.classCode}>{classData.class_code}</Text>
          <Text style={styles.className}>{classData.class_name}</Text>
          {classData.section && (
            <Text style={styles.sectionText}>{classData.section}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.classCardBody}>
        <View style={styles.scheduleContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.scheduleText}>{scheduleDisplay}</Text>
        </View>
        {classData.room && (
          <View style={styles.scheduleContainer}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.scheduleText}>{classData.room}</Text>
          </View>
        )}

        {/* <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={18} color={COLORS.info} />
            <Text style={styles.statValue}>{classData.enrolled || 0}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.statValue}>{classData.present_today || 0}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={18} color={getAttendanceColor(classData.attendanceRate || 0)} />
            <Text style={[styles.statValue, { color: getAttendanceColor(classData.attendanceRate || 0) }]}>
              {classData.attendanceRate || 0}%
            </Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View> */}
      </View>

      <View style={styles.classCardFooter}>
        {/* <TouchableOpacity style={styles.actionButton} onPress={(e) => e.stopPropagation()}>
          <Ionicons name="qr-code" size={18} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Generate QR</Text>
        </TouchableOpacity> */}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            navigation.navigate('ClassDetail', { classData });
          }}
        >
          <Ionicons name="list" size={18} color={COLORS.info} />
          <Text style={styles.actionButtonText}>View Students</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            navigation.navigate('ClassReport', { classData });
          }}
        >
          <Ionicons name="document-text" size={18} color={COLORS.secondary} />
          <Text style={styles.actionButtonText}>Report</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  classList: {
    flex: 1,
  },
  classCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inactiveNoticeText: {
    fontSize: 12,
    color: COLORS.warning,
    marginLeft: 6,
  },
  sectionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  classCardBody: {
    marginBottom: 12,
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  classCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginLeft: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 450,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: COLORS.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '600',
  },
});
