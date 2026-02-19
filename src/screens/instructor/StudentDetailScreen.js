import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function StudentDetailScreen({ route, navigation }) {
  const { studentData, classData } = route.params;

  const fullName = [
    studentData.first_name,
    studentData.middle_initial ? studentData.middle_initial + '.' : null,
    studentData.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  const attendanceRate = studentData.attendance_rate ?? 0;

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Student Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.studentName}>{fullName}</Text>
          <Text style={styles.studentIdText}>ID: {studentData.student_id}</Text>
          {classData && (
            <View style={styles.classBadge}>
              <Ionicons name="book-outline" size={14} color={COLORS.white} />
              <Text style={styles.classBadgeText}>{classData.class_name}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Attendance Rate Card */}
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Attendance Rate</Text>
          <Text style={[styles.rateValue, { color: getAttendanceColor(attendanceRate) }]}>
            {attendanceRate}%
          </Text>
          <View style={styles.rateBarBg}>
            <View
              style={[
                styles.rateBarFill,
                {
                  width: `${Math.min(attendanceRate, 100)}%`,
                  backgroundColor: getAttendanceColor(attendanceRate),
                },
              ]}
            />
          </View>
        </View>

        {/* Attendance Counts */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.success }]}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={[styles.statNum, { color: COLORS.success }]}>
              {studentData.present_count ?? 0}
            </Text>
            <Text style={styles.statLbl}>Present</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.error }]}>
            <Ionicons name="close-circle" size={28} color={COLORS.error} />
            <Text style={[styles.statNum, { color: COLORS.error }]}>
              {studentData.absent_count ?? 0}
            </Text>
            <Text style={styles.statLbl}>Absent</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.warning }]}>
            <Ionicons name="time" size={28} color={COLORS.warning} />
            <Text style={[styles.statNum, { color: COLORS.warning }]}>
              {studentData.late_count ?? 0}
            </Text>
            <Text style={styles.statLbl}>Late</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <InfoRow icon="id-card-outline" label="Student ID" value={studentData.student_id} />
          <InfoRow icon="person-outline" label="Full Name" value={fullName} />
          <InfoRow icon="mail-outline" label="Email" value={studentData.email} />
          <InfoRow icon="call-outline" label="Mobile Number" value={studentData.phone} />
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  studentIdText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 4,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  classBadgeText: {
    fontSize: 13,
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  rateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  rateValue: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rateBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.grayLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statNum: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statLbl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});
