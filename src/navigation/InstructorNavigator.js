import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Screens
import DashboardScreen from '../screens/instructor/DashboardScreen';
import ClassesScreen from '../screens/instructor/ClassesScreen';
import ScannerScreen from '../screens/instructor/ScannerScreen';
import ProfileScreen from '../screens/instructor/ProfileScreen';
import AddClassScreen from '../screens/instructor/AddClassScreen';
import ClassDetailScreen from '../screens/instructor/ClassDetailScreen';
import EnrollStudentScreen from '../screens/instructor/EnrollStudentScreen';
import StudentDetailScreen from '../screens/instructor/StudentDetailScreen';
import ClassReportScreen from '../screens/instructor/ClassReportScreen';
import ManualAttendanceScreen from '../screens/instructor/ManualAttendanceScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function InstructorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Classes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Classes" 
        component={ClassesScreen}
        options={{
          tabBarLabel: 'Classes',
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scan QR',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function InstructorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InstructorTabs" component={InstructorTabs} />
      <Stack.Screen name="AddClass" component={AddClassScreen} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
      <Stack.Screen name="EnrollStudent" component={EnrollStudentScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="ClassReport" component={ClassReportScreen} />
      <Stack.Screen name="ManualAttendance" component={ManualAttendanceScreen} />
    </Stack.Navigator>
  );
}
