import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

const STATUSES = [
  { key: 'present', label: 'P', fullLabel: 'Present', color: COLORS.success },
  { key: 'absent',  label: 'A', fullLabel: 'Absent',  color: COLORS.error   },
  { key: 'late',    label: 'L', fullLabel: 'Late',    color: '#f59e0b'      },
  { key: 'excused', label: 'E', fullLabel: 'Excused', color: COLORS.info    },
];

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  const d     = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ManualAttendanceScreen({ route, navigation }) {
  const { classData } = route.params;

  const [date, setDate]         = useState(todayString());
  const [students, setStudents] = useState([]); // { ...studentInfo, status: 'present'|'absent'|... }
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (selectedDate) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Fetch enrolled students
      const studRes = await api.get(`/enrollments/get_students.php?class_id=${classData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!studRes.data.success) throw new Error('Failed to load students');

      const enrolled = studRes.data.students || [];

      // Fetch existing attendance for the chosen date
      const attRes = await api.get(
        `/attendance/get_class_attendance.php?class_id=${classData.id}&date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => ({ data: { success: false, records: [] } }));

      const existingMap = {};
      if (attRes.data.success) {
        (attRes.data.records || []).forEach(r => {
          existingMap[r.student_id] = r.status;
        });
      }

      // Merge: default status = 'absent' for all, override with existing records
      const merged = enrolled.map(s => ({
        ...s,
        status: existingMap[s.id] ?? 'absent',
      }));

      setStudents(merged);
    } catch (err) {
      console.error('Manual attendance load error:', err);
      Alert.alert('Error', 'Failed to load students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classData.id]);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(date); };

  const setStudentStatus = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  // Mark all as present / absent at once
  const markAll = (status) => {
    Alert.alert(
      `Mark All ${STATUSES.find(s => s.key === status).fullLabel}?`,
      `This will set all ${students.length} students to ${status}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => setStudents(prev => prev.map(s => ({ ...s, status }))),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (students.length === 0) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const records = students.map(s => ({ studentId: s.id, status: s.status }));

      const res = await api.post('/attendance/manual_mark.php', {
        classId: classData.id,
        date,
        records,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        Alert.alert('✓ Saved', res.data.message || 'Attendance saved successfully.');
      } else {
        Alert.alert('Error', res.data.message || 'Failed to save attendance.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Change session date: go back/forward one day
  const shiftDate = (days) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const next = `${yyyy}-${mm}-${dd}`;
    setLoading(true);
    setDate(next);
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount  = students.filter(s => s.status === 'absent').length;
  const lateCount    = students.filter(s => s.status === 'late').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Manual Attendance</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {classData.class_name}{classData.section ? ` · ${classData.section}` : ''}
            </Text>
          </View>
          {saving
            ? <ActivityIndicator color="#fff" />
            : (
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={students.length === 0}>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            )}
        </View>
      </LinearGradient>

      {/* Date Navigator */}
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          {date === todayString() && (
            <View style={styles.todayBadge}><Text style={styles.todayText}>Today</Text></View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => shiftDate(1)}
          style={styles.dateArrow}
          disabled={date === todayString()}
        >
          <Ionicons name="chevron-forward" size={22} color={date === todayString() ? COLORS.gray : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && students.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={[styles.summaryItem, { color: COLORS.success }]}>
            <Ionicons name="checkmark-circle" size={14} /> {presentCount} Present
          </Text>
          <Text style={[styles.summaryItem, { color: COLORS.error }]}>
            <Ionicons name="close-circle" size={14} /> {absentCount} Absent
          </Text>
          <Text style={[styles.summaryItem, { color: '#f59e0b' }]}>
            <Ionicons name="time" size={14} /> {lateCount} Late
          </Text>
          {/* Mark all shortcuts */}
          <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll('present')}>
            <Text style={styles.markAllText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: COLORS.error + '20' }]} onPress={() => markAll('absent')}>
            <Text style={[styles.markAllText, { color: COLORS.error }]}>All Absent</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading students…</Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={56} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No Students Enrolled</Text>
          <Text style={styles.emptySubtitle}>Enroll students to take attendance.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {students.map((student, idx) => {
            const fullName = [student.first_name, student.middle_initial ? student.middle_initial + '.' : null, student.last_name].filter(Boolean).join(' ');
            const statusInfo = STATUSES.find(s => s.key === student.status) || STATUSES[1];
            return (
              <View key={student.id} style={[styles.studentRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                {/* Index + Name */}
                <View style={styles.nameCol}>
                  <Text style={styles.indexNum}>{idx + 1}</Text>
                  <View>
                    <Text style={styles.studentName} numberOfLines={1}>{fullName}</Text>
                    <Text style={styles.studentIdText}>{student.student_id}</Text>
                  </View>
                </View>

                {/* Status buttons */}
                <View style={styles.statusButtons}>
                  {STATUSES.map(st => (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.statusBtn,
                        student.status === st.key && { backgroundColor: st.color },
                      ]}
                      onPress={() => setStudentStatus(student.id, st.key)}
                    >
                      <Text style={[
                        styles.statusBtnText,
                        student.status === st.key && { color: '#fff' },
                      ]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Legend */}
          <View style={styles.legend}>
            {STATUSES.map(s => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>{s.fullLabel}</Text>
              </View>
            ))}
          </View>

          {/* Save button at bottom too */}
          <TouchableOpacity
            style={[styles.bottomSaveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.bottomSaveBtnText}>Save Attendance</Text>
                </>
            }
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 5 },

  dateBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, paddingVertical: 10,
    paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dateArrow: { padding: 8 },
  dateCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dateText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginLeft: 6 },
  todayBadge: {
    backgroundColor: COLORS.primary + '20', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
  },
  todayText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8,
  },
  summaryItem: { fontSize: 13, fontWeight: '600', marginRight: 8 },
  markAllBtn: {
    backgroundColor: COLORS.success + '20', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  markAllText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },

  list: { flex: 1 },

  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowEven: { backgroundColor: COLORS.white },
  rowOdd: { backgroundColor: '#f8f9fa' },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  indexNum: { fontSize: 12, color: COLORS.textSecondary, width: 24, fontWeight: '600' },
  studentName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, maxWidth: 150 },
  studentIdText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  statusButtons: { flexDirection: 'row', gap: 5 },
  statusBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  statusBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary },

  legend: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    paddingVertical: 12, gap: 14, backgroundColor: COLORS.white,
    marginTop: 8, borderRadius: 12, marginHorizontal: 12,
    paddingHorizontal: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, color: COLORS.textSecondary },

  bottomSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, margin: 16,
    paddingVertical: 16, borderRadius: 14,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3,
  },
  bottomSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
