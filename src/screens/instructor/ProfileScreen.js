import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function ProfileScreen({ navigation }) {
  const instructorData = {
    name: 'Prof. Rodriguez',
    email: 'rodriguez@msuiit.edu.ph',
    department: 'Computer Science',
    employeeId: 'MSU-2024-001',
    phone: '+63 912 345 6789',
    joinDate: 'January 2024',
  };

  const handleLogout = () => {
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
          onPress: () => {
            // Navigate back to landing screen
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
              {instructorData.name.split(' ').map(n => n[0]).join('')}
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
            value={instructorData.department}
          />
          <InfoItem
            icon="card-outline"
            label="Employee ID"
            value={instructorData.employeeId}
          />
          <InfoItem
            icon="call-outline"
            label="Phone"
            value={instructorData.phone}
          />
          <InfoItem
            icon="calendar-outline"
            label="Member Since"
            value={instructorData.joinDate}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuButton
            icon="person-outline"
            label="Edit Profile"
            onPress={() => {}}
          />
          <MenuButton
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => {}}
          />
          <MenuButton
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <MenuButton
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => {}}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
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
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
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
});
