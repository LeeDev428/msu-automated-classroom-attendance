import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function ClassesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with API data
  const classes = [
    {
      id: 'CS101',
      name: 'Introduction to Computer Science',
      schedule: 'Mon, Wed, Fri - 8:00 AM',
      enrolled: 45,
      present: 42,
      attendanceRate: 93,
    },
    {
      id: 'CS102',
      name: 'Data Structures and Algorithms',
      schedule: 'Tue, Thu - 10:00 AM',
      enrolled: 38,
      present: 35,
      attendanceRate: 92,
    },
    {
      id: 'CS201',
      name: 'Database Management Systems',
      schedule: 'Mon, Wed - 2:00 PM',
      enrolled: 40,
      present: 38,
      attendanceRate: 95,
    },
    {
      id: 'CS301',
      name: 'Software Engineering',
      schedule: 'Tue, Thu - 3:30 PM',
      enrolled: 33,
      present: 27,
      attendanceRate: 82,
    },
  ];

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
