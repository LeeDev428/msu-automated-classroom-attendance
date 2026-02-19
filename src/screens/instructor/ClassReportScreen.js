import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

export default function ClassReportScreen({ route, navigation }) {
  const { classData } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState(null);

  const fetchReport = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`/reports/class_report.php?class_id=${classData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setReport(response.data);
      }
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  const RateBar = ({ rate }) => (
    <View style={styles.rateBarBg}>
      <View
        style={[
          styles.rateBarFill,
          {
            width: `${Math.min(rate ?? 0, 100)}%`,
            backgroundColor: getAttendanceColor(rate ?? 0),
          },
        ]}
      />
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
          <Text style={styles.headerTitle}>Class Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerClass}>{classData.class_name}</Text>
        <Text style={styles.headerCode}>
          {classData.class_code}{classData.section ? ` • ${classData.section}` : ''}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Summary Cards */}
          {report?.summary && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="people" size={28} color={COLORS.info} />
                <Text style={[styles.summaryNum, { color: COLORS.info }]}>
                  {report.summary.total_enrolled}
                </Text>
                <Text style={styles.summaryLbl}>Enrolled</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="calendar" size={28} color={COLORS.primary} />
                <Text style={[styles.summaryNum, { color: COLORS.primary }]}>
                  {report.summary.total_sessions}
                </Text>
                <Text style={styles.summaryLbl}>Sessions</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="trending-up" size={28} color={getAttendanceColor(report.summary.overall_attendance_rate)} />
                <Text style={[styles.summaryNum, { color: getAttendanceColor(report.summary.overall_attendance_rate) }]}>
                  {report.summary.overall_attendance_rate}%
                </Text>
                <Text style={styles.summaryLbl}>Avg Rate</Text>
              </View>
            </View>
          )}

          {/* Student Attendance Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Attendance Summary</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHdCell, { flex: 3 }]}>Student</Text>
              <Text style={[styles.tableHdCell, { flex: 1, textAlign: 'center' }]}>P</Text>
              <Text style={[styles.tableHdCell, { flex: 1, textAlign: 'center' }]}>A</Text>
              <Text style={[styles.tableHdCell, { flex: 1, textAlign: 'center' }]}>L</Text>
              <Text style={[styles.tableHdCell, { flex: 2, textAlign: 'right' }]}>Rate</Text>
            </View>

            {report?.students?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>No students enrolled</Text>
              </View>
            ) : (
              report?.students?.map((student, index) => {
                const rate = student.attendance_rate ?? 0;
                const fullName = [
                  student.first_name,
                  student.middle_initial || null,
                  student.last_name,
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <View
                    key={student.id}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <View style={{ flex: 3 }}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {fullName}
                      </Text>
                      <Text style={styles.studentId}>{student.student_id}</Text>
                      <RateBar rate={rate} />
                    </View>
                    <Text style={[styles.tableCell, { flex: 1, color: COLORS.success }]}>
                      {student.present_count}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, color: COLORS.error }]}>
                      {student.absent_count}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, color: COLORS.warning }]}>
                      {student.late_count}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 2, fontWeight: 'bold', textAlign: 'right', color: getAttendanceColor(rate) },
                      ]}
                    >
                      {rate}%
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {report?.generated_at && (
            <Text style={styles.generatedAt}>
              Generated: {new Date(report.generated_at).toLocaleString()}
            </Text>
          )}
        </ScrollView>
      )}
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
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerClass: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 4,
  },
  headerCode: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  summaryLbl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: 4,
  },
  tableHdCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  tableRowEven: {
    backgroundColor: COLORS.background,
  },
  tableRowOdd: {
    backgroundColor: COLORS.white,
  },
  tableCell: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  studentId: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rateBarBg: {
    width: '90%',
    height: 4,
    backgroundColor: COLORS.grayLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  generatedAt: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
});
