import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
  present: COLORS.success,
  absent:  COLORS.error,
  late:    '#f59e0b',
  excused: COLORS.info,
};

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    instructorName:   '',
    date:             new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    enrolledStudents: 0,
    enrolledClasses:  0,
    presentToday:     0,
    absentToday:      0,
    attendanceRate:   0,
    recentAttendance: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await api.get('/dashboard/stats.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const raw = await AsyncStorage.getItem('userData');
      if (raw) {
        const user = JSON.parse(raw);
        setData(prev => ({ ...prev, instructorName: user.name || 'Instructor' }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalToday = data.presentToday + data.absentToday;
  const rate = data.attendanceRate ?? 0;

  return (
    <View style={styles.container}>
      {/* Header — no hamburger */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <Text style={styles.headerSub}>Automated Classroom Attendance</Text>
        <Text style={styles.headerName}>
          {data.instructorName ? `Welcome, ${data.instructorName}` : 'Dashboard'}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Date */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Ionicons name="stats-chart" size={22} color={COLORS.primary} />
            <Text style={styles.dashboardTitle}>Attendance Dashboard</Text>
          </View>
          <Text style={styles.dateText}>{data.date}</Text>
        </View>

        {/* Stats row 1 */}
        <View style={styles.statsRow}>
          <StatsCard
            icon="people"
            iconColor={COLORS.info}
            iconBg={COLORS.infoLight}
            title="Enrolled Students"
            value={data.enrolledStudents}
            subtitle={`Across ${data.enrolledClasses} class${data.enrolledClasses !== 1 ? 'es' : ''}`}
          />
          <StatsCard
            icon="checkmark-circle"
            iconColor={COLORS.success}
            iconBg={COLORS.successLight}
            title="Present Today"
            value={data.presentToday}
            subtitle={totalToday > 0 ? `${rate}% attendance rate` : 'No sessions today'}
          />
        </View>

        {/* Stats row 2 */}
        <View style={styles.statsRow}>
          <StatsCard
            icon="close-circle"
            iconColor={COLORS.error}
            iconBg={COLORS.errorLight}
            title="Absent Today"
            value={data.absentToday}
            subtitle={totalToday > 0 ? `Out of ${totalToday} recorded` : 'No sessions today'}
          />
          <StatsCard
            icon="trending-up"
            iconColor={rate >= 75 ? COLORS.success : COLORS.error}
            iconBg={rate >= 75 ? COLORS.successLight : COLORS.errorLight}
            title="Attendance Rate"
            value={`${rate}%`}
            subtitle={rate >= 75 ? 'Good standing' : rate > 0 ? 'Below threshold' : 'No data yet'}
          />
        </View>

        {/* Attendance rate bar */}
        <View style={styles.attendanceCard}>
          <Text style={styles.attendanceCardTitle}>Today's Attendance Rate</Text>
          <Text style={styles.attendanceCardSub}>
            {totalToday > 0
              ? `${data.presentToday} present · ${data.absentToday} absent · ${totalToday} total`
              : 'No attendance recorded today yet'}
          </Text>
          <Text style={[styles.percentageValue, { color: rate >= 75 ? COLORS.success : rate > 0 ? COLORS.error : COLORS.gray }]}>
            {rate}%
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${rate}%`,
              backgroundColor: rate >= 75 ? COLORS.success : COLORS.error,
            }]} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsRow}>
            <ActionButton
              icon="scan"
              label="Scan QR"
              color={COLORS.primary}
              onPress={() => navigation.navigate('Scanner')}
            />
            <ActionButton
              icon="people-outline"
              label="Classes"
              color={COLORS.info}
              onPress={() => navigation.navigate('Classes')}
            />
            <ActionButton
              icon="document-text"
              label="Reports"
              color={COLORS.secondary}
              onPress={() => navigation.navigate('Classes')}
            />
            <ActionButton
              icon="person"
              label="Profile"
              color={COLORS.gray}
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </View>

        {/* Recent Activity — fully dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {data.recentAttendance && data.recentAttendance.length > 0
            ? data.recentAttendance.map((item, idx) => (
                <ActivityItem
                  key={idx}
                  title={item.student_name}
                  subtitle={`${item.class_code} · Marked ${item.status}`}
                  time={item.checkin_time}
                  icon={item.status === 'present' ? 'checkmark-circle' : item.status === 'late' ? 'time' : 'close-circle'}
                  iconColor={STATUS_COLOR[item.status] || COLORS.gray}
                />
              ))
            : (
              <View style={styles.emptyActivity}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.gray} />
                <Text style={styles.emptyText}>No recent attendance records</Text>
              </View>
            )
          }
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

const StatsCard = ({ icon, iconColor, iconBg, title, value, subtitle }) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIconContainer, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={26} color={iconColor} />
    </View>
    <Text style={styles.statsTitle}>{title}</Text>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsSubtitle}>{subtitle}</Text>
  </View>
);

const ActionButton = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={22} color={COLORS.white} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ title, subtitle, time, icon, iconColor }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIconContainer, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
);

/* ─── Styles ─────────────────────────────────────────── */

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
  headerSub: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.85,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    width: (width - 48) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statsSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  attendanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  attendanceCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  attendanceCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  percentageValue: {
    fontSize: 46,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.grayLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  actionIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  activityIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
