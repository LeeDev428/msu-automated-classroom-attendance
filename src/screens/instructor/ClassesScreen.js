import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [newClass, setNewClass] = useState({
    class_name: '',
    class_code: '',
    section: '',
    schedule: '',
    room: ''
  });

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
    fetchClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleAddClass = async () => {
    if (!newClass.class_name || !newClass.class_code) {
      Alert.alert('Error', 'Class name and code are required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.post('/classes/index.php', newClass, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Class created successfully');
        setModalVisible(false);
        setNewClass({ class_name: '', class_code: '', section: '', schedule: '', room: '' });
        fetchClasses();
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create class');
    }
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
      {/* Add Class Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Class</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Class Name *"
              value={newClass.class_name}
              onChangeText={(text) => setNewClass({...newClass, class_name: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Class Code * (e.g., CS101)"
              value={newClass.class_code}
              onChangeText={(text) => setNewClass({...newClass, class_code: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Section (optional)"
              value={newClass.section}
              onChangeText={(text) => setNewClass({...newClass, section: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Schedule (e.g., Mon, Wed 8:00 AM)"
              value={newClass.schedule}
              onChangeText={(text) => setNewClass({...newClass, schedule: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Room (optional)"
              value={newClass.room}
              onChangeText={(text) => setNewClass({...newClass, room: text})}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddClass}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add New Class</Text>
        </TouchableOpacity>

        {/* Classes List */}
        <ScrollView 
          style={styles.classList}
          showsVerticalScrollIndicator={false}
        >
          {filteredClasses.map((cls) => (
            <ClassCard key={cls.id} classData={cls} />
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

const ClassCard = ({ classData }) => {
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <TouchableOpacity style={styles.classCard}>
      <View style={styles.classCardHeader}>
        <View>
          <Text style={styles.classCode}>{classData.id}</Text>
          <Text style={styles.className}>{classData.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
      </View>

      <View style={styles.classCardBody}>
        <View style={styles.scheduleContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.scheduleText}>{classData.schedule}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={18} color={COLORS.info} />
            <Text style={styles.statValue}>{classData.enrolled}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.statValue}>{classData.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={18} color={getAttendanceColor(classData.attendanceRate)} />
            <Text style={[styles.statValue, { color: getAttendanceColor(classData.attendanceRate) }]}>
              {classData.attendanceRate}%
            </Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>
      </View>

      <View style={styles.classCardFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="qr-code" size={18} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Generate QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="list" size={18} color={COLORS.info} />
          <Text style={styles.actionButtonText}>View Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
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
    marginLeft: 6,
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
});
