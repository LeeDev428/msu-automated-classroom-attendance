import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  // Mock data - will be replaced with API data
  const dashboardData = {
    instructorName: 'Prof. Rodriguez',
    date: 'Monday, December 15, 2025',
    enrolledStudents: 156,
    enrolledClasses: 4,
    presentToday: 142,
    presentChange: '+8 from yesterday',
    absentToday: 14,
    absentNote: '3 late check-in',
    attendanceRate: 91,
    attendanceStatus: 'Above target',
    todayAttendanceRate: 84,
    todayTarget: 'Target: 85% minimum',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.universityName}>MSU-MAGUINDANAO</Text>
            <Text style={styles.instructorName}>{dashboardData.instructorName}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
            <Text style={styles.dashboardTitle}>Attendance Dashboard</Text>
          </View>
          <Text style={styles.dateText}>{dashboardData.date}</Text>
          <Text style={styles.subtitleText}>
            Real-time attendance monitoring and analytics
          </Text>
        </View>

        {/* Stats Grid - Top Row */}
        <View style={styles.statsRow}>
          <StatsCard
            icon="people"
            iconColor={COLORS.info}
            iconBg={COLORS.infoLight}
            title="Enrolled Students"
            value={dashboardData.enrolledStudents}
            subtitle={`Across ${dashboardData.enrolledClasses} classes`}
          />
          <StatsCard
            icon="checkmark-circle"
            iconColor={COLORS.success}
            iconBg={COLORS.successLight}
            title="Present Today"
            value={dashboardData.presentToday}
            subtitle={dashboardData.presentChange}
          />
        </View>

        {/* Stats Grid - Bottom Row */}
        <View style={styles.statsRow}>
          <StatsCard
            icon="close-circle"
            iconColor={COLORS.error}
            iconBg={COLORS.errorLight}
            title="Absent Today"
            value={dashboardData.absentToday}
            subtitle={dashboardData.absentNote}
          />
          <StatsCard
            icon="trending-up"
            iconColor={COLORS.success}
            iconBg={COLORS.successLight}
            title="Attendance Rate"
            value={`${dashboardData.attendanceRate}%`}
            subtitle={dashboardData.attendanceStatus}
          />
        </View>

        {/* Today's Attendance Rate Card */}
        <View style={styles.attendanceCard}>
          <Text style={styles.attendanceCardTitle}>Today's Attendance Rate</Text>
          <Text style={styles.attendanceCardTarget}>{dashboardData.todayTarget}</Text>
          
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageValue}>{dashboardData.todayAttendanceRate}%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${dashboardData.todayAttendanceRate}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsRow}>
            <ActionButton
              icon="qr-code"
              label="Generate QR"
              color={COLORS.primary}
              onPress={() => {}}
            />
            <ActionButton
              icon="people-outline"
              label="View Students"
              color={COLORS.info}
              onPress={() => {}}
            />
            <ActionButton
              icon="document-text"
              label="Reports"
              color={COLORS.secondary}
              onPress={() => {}}
            />
            <ActionButton
              icon="settings"
              label="Settings"
              color={COLORS.gray}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <ActivityItem
            title="Class CS101 - Morning Session"
            subtitle="142 students checked in"
            time="2 hours ago"
            icon="checkmark-circle"
            iconColor={COLORS.success}
          />
          <ActivityItem
            title="QR Code Generated"
            subtitle="For CS102 - Afternoon Class"
            time="3 hours ago"
            icon="qr-code"
            iconColor={COLORS.primary}
          />
          <ActivityItem
            title="Attendance Report Exported"
            subtitle="Weekly summary report"
            time="1 day ago"
            icon="document-text"
            iconColor={COLORS.info}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const StatsCard = ({ icon, iconColor, iconBg, title, value, subtitle }) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIconContainer, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={28} color={iconColor} />
    </View>
    <Text style={styles.statsTitle}>{title}</Text>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsSubtitle}>{subtitle}</Text>
  </View>
);

const ActionButton = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={COLORS.white} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  universityName: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  instructorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 11,
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
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attendanceCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  attendanceCardTarget: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  progressBarContainer: {
    marginTop: 8,
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
    backgroundColor: COLORS.success,
    borderRadius: 6,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  recentActivity: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
