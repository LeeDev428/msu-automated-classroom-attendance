import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

export default function StudentDetailScreen({ route, navigation }) {
  const { studentData: initialData, classData } = route.params;

  const [studentData, setStudentData] = useState(initialData);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id:     initialData.student_id     || '',
    first_name:     initialData.first_name     || '',
    middle_initial: initialData.middle_initial || '',
    last_name:      initialData.last_name      || '',
    email:          initialData.email          || '',
    phone:          initialData.phone          || '',
  });

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

  const handleEdit = () => {
    setForm({
      student_id:     studentData.student_id     || '',
      first_name:     studentData.first_name     || '',
      middle_initial: studentData.middle_initial || '',
      last_name:      studentData.last_name      || '',
      email:          studentData.email          || '',
      phone:          studentData.phone          || '',
    });
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    if (!form.student_id.trim()) {
      Alert.alert('Validation Error', 'Student ID is required');
      return;
    }
    if (!form.first_name.trim()) {
      Alert.alert('Validation Error', 'First Name is required');
      return;
    }
    if (!form.last_name.trim()) {
      Alert.alert('Validation Error', 'Last Name is required');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put('/enrollments/update_student.php', {
        id:             studentData.id,
        student_id:     form.student_id.trim(),
        first_name:     form.first_name.trim(),
        middle_initial: form.middle_initial.trim(),
        last_name:      form.last_name.trim(),
        email:          form.email.trim(),
        phone:          form.phone.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStudentData((prev) => ({
          ...prev,
          student_id:     form.student_id.trim(),
          first_name:     form.first_name.trim(),
          middle_initial: form.middle_initial.trim(),
          last_name:      form.last_name.trim(),
          email:          form.email.trim(),
          phone:          form.phone.trim(),
        }));
        setEditing(false);
        Alert.alert('Success', 'Student information updated');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Update student error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Sub-components ─── */
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

  const EditField = ({ icon, label, field, placeholder, keyboardType = 'default', autoCapitalize = 'words', maxLength }) => (
    <View style={styles.editRow}>
      <View style={[styles.infoIcon, { marginTop: 4 }]}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TextInput
          style={styles.editInput}
          value={form[field]}
          onChangeText={(text) => setForm((prev) => ({ ...prev, [field]: text }))}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              if (editing) {
                Alert.alert('Discard Changes?', 'You have unsaved changes.', [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => { setEditing(false); navigation.goBack(); } },
                ]);
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{editing ? 'Edit Student' : 'Student Detail'}</Text>

          {editing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.headerBtn} disabled={saving}>
                <Ionicons name="close" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.headerBtn, styles.saveBtn]} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Ionicons name="checkmark" size={22} color={COLORS.white} />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar + Name (always shows saved data) */}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Attendance stats — view mode only */}
          {!editing && (
            <>
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

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderColor: COLORS.success }]}>
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                  <Text style={[styles.statNum, { color: COLORS.success }]}>{studentData.present_count ?? 0}</Text>
                  <Text style={styles.statLbl}>Present</Text>
                </View>
                <View style={[styles.statCard, { borderColor: COLORS.error }]}>
                  <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  <Text style={[styles.statNum, { color: COLORS.error }]}>{studentData.absent_count ?? 0}</Text>
                  <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View style={[styles.statCard, { borderColor: COLORS.warning }]}>
                  <Ionicons name="time" size={28} color={COLORS.warning} />
                  <Text style={[styles.statNum, { color: COLORS.warning }]}>{studentData.late_count ?? 0}</Text>
                  <Text style={styles.statLbl}>Late</Text>
                </View>
              </View>
            </>
          )}

          {/* Personal Info — View Mode */}
          {!editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <InfoRow icon="id-card-outline" label="Student ID"    value={studentData.student_id} />
              <InfoRow icon="person-outline"  label="Full Name"     value={fullName} />
              <InfoRow icon="mail-outline"    label="Email"         value={studentData.email} />
              <InfoRow icon="call-outline"    label="Mobile Number" value={studentData.phone} />
            </View>
          )}

          {/* Personal Info — Edit Mode */}
          {editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Information</Text>

              <EditField
                icon="id-card-outline"
                label="Student ID *"
                field="student_id"
                placeholder="e.g. 2025-001"
                autoCapitalize="none"
              />

              {/* Name row: First + M.I. + Last */}
              <View style={styles.nameEditRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.infoLabel}>First Name *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={form.first_name}
                    onChangeText={(t) => setForm((p) => ({ ...p, first_name: t }))}
                    placeholder="First"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <Text style={styles.infoLabel}>M.I.</Text>
                  <TextInput
                    style={styles.editInput}
                    value={form.middle_initial}
                    onChangeText={(t) => setForm((p) => ({ ...p, middle_initial: t }))}
                    placeholder="D."
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="characters"
                    maxLength={3}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.infoLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={form.last_name}
                    onChangeText={(t) => setForm((p) => ({ ...p, last_name: t }))}
                    placeholder="Last"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <EditField
                icon="mail-outline"
                label="Email Address"
                field="email"
                placeholder="student@example.com (optional)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <EditField
                icon="call-outline"
                label="Mobile Number"
                field="phone"
                placeholder="+63 912 345 6789"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={COLORS.white} />
                    : <>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { padding: 8 },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    marginLeft: 4,
  },
  avatarSection: { alignItems: 'center' },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: { fontSize: 22, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' },
  studentIdText: { fontSize: 14, color: COLORS.white, opacity: 0.85, marginTop: 4 },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  classBadgeText: { fontSize: 13, color: COLORS.white, marginLeft: 6, fontWeight: '500' },
  content: { flex: 1, padding: 16 },
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
  rateLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  rateValue: { fontSize: 42, fontWeight: 'bold', marginBottom: 12 },
  rateBarBg: { width: '100%', height: 10, backgroundColor: COLORS.grayLight, borderRadius: 5, overflow: 'hidden' },
  rateBarFill: { height: '100%', borderRadius: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
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
  statNum: { fontSize: 24, fontWeight: 'bold', marginTop: 6 },
  statLbl: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
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
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  actionButtons: { flexDirection: 'row', marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  saveBtnText: { fontSize: 15, fontWeight: 'bold', color: COLORS.white, marginLeft: 8 },
});
