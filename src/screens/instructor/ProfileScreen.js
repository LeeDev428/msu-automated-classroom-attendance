import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../config/api';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [instructorData, setInstructorData] = useState({
    name: 'Loading...',
    email: '',
    department: '',
    employee_id: '',
    created_at: '',
  });

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    employee_id: '',
  });

  // Change Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get('/profile/index.php', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setInstructorData(response.data.data);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Use stored user data as fallback
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setInstructorData(JSON.parse(userData));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  const openEditModal = () => {
    setEditForm({
      name: instructorData.name,
      department: instructorData.department,
      employee_id: instructorData.employee_id,
    });
    setEditModalVisible(true);
  };

  const handleEditProfile = async () => {
    if (!editForm.name || !editForm.department) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put('/profile/index.php', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setEditModalVisible(false);
        fetchProfile(); // Refresh profile data
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put('/profile/index.php', {
        password: passwordForm.new_password,
        current_password: passwordForm.current_password,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Password changed successfully');
        setPasswordModalVisible(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>
              {getInitials(instructorData.name)}
            </Text>
          </View>
        </View>
        <Text style={styles.profileName}>{instructorData.name}</Text>
        <Text style={styles.profileEmail}>{instructorData.email}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <InfoItem
            icon="briefcase-outline"
            label="Department"
            value={instructorData.department || 'Not set'}
          />
          <InfoItem
            icon="card-outline"
            label="Employee ID"
            value={instructorData.employee_id || 'Not set'}
          />
          <InfoItem
            icon="mail-outline"
            label="Email"
            value={instructorData.email || 'Not set'}
          />
          <InfoItem
            icon="calendar-outline"
            label="Member Since"
            value={instructorData.created_at ? new Date(instructorData.created_at).toLocaleDateString() : 'N/A'}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuButton
            icon="person-outline"
            label="Edit Profile"
            onPress={openEditModal}
          />
          <MenuButton
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setPasswordModalVisible(true)}
          />
          {/* <MenuButton
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <MenuButton
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => {}}
          /> */}
        </View>

        {/* Support Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuButton
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => {}}
          />
          <MenuButton
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
          <MenuButton
            icon="information-circle-outline"
            label="About"
            onPress={() => {}}
          />
        </View> */}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Edit Profile</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.gray}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({...editForm, name: text})}
                />

                <Text style={styles.fieldLabel}>Department *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your department"
                  placeholderTextColor={COLORS.gray}
                  value={editForm.department}
                  onChangeText={(text) => setEditForm({...editForm, department: text})}
                />

                <Text style={styles.fieldLabel}>Employee ID</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your employee ID"
                  placeholderTextColor={COLORS.gray}
                  value={editForm.employee_id}
                  onChangeText={(text) => setEditForm({...editForm, employee_id: text})}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleEditProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="lock-closed-outline" size={40} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Current Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.gray}
                  value={passwordForm.current_password}
                  onChangeText={(text) => setPasswordForm({...passwordForm, current_password: text})}
                  secureTextEntry
                />

                <Text style={styles.fieldLabel}>New Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.gray}
                  value={passwordForm.new_password}
                  onChangeText={(text) => setPasswordForm({...passwordForm, new_password: text})}
                  secureTextEntry
                />

                <Text style={styles.fieldLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={COLORS.gray}
                  value={passwordForm.confirm_password}
                  onChangeText={(text) => setPasswordForm({...passwordForm, confirm_password: text})}
                  secureTextEntry
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setPasswordModalVisible(false);
                      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleChangePassword}
                  >
                    <Text style={styles.saveButtonText}>Update Password</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const InfoItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIconContainer}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <View style={styles.menuButtonLeft}>
      <Ionicons name={icon} size={22} color={COLORS.textPrimary} />
      <Text style={styles.menuButtonText}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.secondary,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
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
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
