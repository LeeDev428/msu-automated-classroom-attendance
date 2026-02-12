# 🎓 MSU Automated Classroom Attendance System

A modern, mobile-first attendance tracking system built for Mindanao State University using React Native (Expo) and PHP.

## 📱 Overview

This system automates classroom attendance tracking for MSU instructors and students using QR code technology. Instructors can manage classes, generate QR codes, and track attendance in real-time. Students can quickly check in by scanning QR codes.

### ✨ Key Features

- 🔐 **Secure Authentication** - MSU institutional email validation
- 📊 **Real-time Dashboard** - Live attendance statistics and analytics
- 📱 **QR Code Scanning** - Fast, contactless attendance marking
- 👥 **Class Management** - Create and manage multiple classes
- 📈 **Analytics & Reports** - Detailed attendance tracking and reports
- 🎨 **MSU Branding** - Official maroon and gold color scheme
- 🏗️ **Modular Architecture** - Clean, maintainable codebase

## 🚀 Quick Start

### Prerequisites

- [Laragon](https://laragon.org/) (Apache + MySQL + PHP)
- [Node.js](https://nodejs.org/) v16 or higher
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Smartphone with [Expo Go](https://expo.dev/client) app (optional)

### Setup in 3 Steps

1. **Deploy Backend**
   ```powershell
   .\deploy-backend.ps1
   ```

2. **Setup Database**
   ```powershell
   .\run-migrations.ps1
   ```

3. **Start Frontend**
   ```powershell
   npm install
   npx expo start
   ```

📖 **Need detailed instructions?** See [QUICK_START.md](QUICK_START.md)

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo SDK 54** - Development platform
- **React Navigation** - App navigation
- **Axios** - HTTP client
- **AsyncStorage** - Local data storage
- **expo-camera** - QR code scanning

### Backend
- **PHP 7.4+** - Server-side language
- **MySQL 8.0+** - Database
- **PDO** - Database abstraction
- **bcrypt** - Password hashing

## 📁 Project Structure

```
msu-automated-classroom-attendance/
│
├── 📱 Frontend (React Native)
│   ├── src/
│   │   ├── config/          # API configuration
│   │   ├── constants/       # Colors, themes
│   │   ├── screens/         # App screens
│   │   │   ├── LandingScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   └── instructor/  # Instructor screens
│   │   └── navigation/      # Navigation config
│   │
├── 🔧 Backend (PHP - Modular)
│   ├── core/                # Core utilities
│   │   ├── Database.php     # DB connection
│   │   ├── Response.php     # API responses
│   │   ├── Validator.php    # Input validation
│   │   └── cors.php         # CORS headers
│   │
│   └── modules/             # Feature modules
│       └── instructor/      # Instructor module
│           ├── auth/        # Authentication
│           │   ├── login.php
│           │   └── register.php
│           ├── classes/     # Class management
│           │   ├── create.php
│           │   └── get_all.php
│           └── dashboard/   # Dashboard stats
│               └── stats.php
│
├── 🗄️ Database
│   └── migrations/          # Migration files
│       ├── 001_create_users_table.sql
│       ├── 002_create_classes_table.sql
│       ├── 003_create_students_table.sql
│       ├── 004_create_enrollments_table.sql
│       └── 005_create_attendance_table.sql
│
├── 📜 Scripts
│   ├── deploy-backend.ps1   # Backend deployment
│   └── run-migrations.ps1   # Database setup
│
└── 📚 Documentation
    ├── README.md            # This file
    ├── QUICK_START.md       # Quick setup guide
    ├── BACKEND_SETUP.md     # Detailed backend guide
    └── PROJECT_SUMMARY.md   # Project overview
```

## 🗃️ Database Schema

### Tables

1. **users** - Instructors, students, and admins
2. **classes** - Course information and schedules
3. **students** - Student information with QR codes
4. **enrollments** - Student-class relationships
5. **attendance** - Attendance records

### Relationships

```
users (instructors) ──< classes ──< enrollments >── students
                                         │
                                         └──< attendance
```

## 🔌 API Endpoints

### Authentication

```
POST /modules/instructor/auth/register.php
POST /modules/instructor/auth/login.php
```

### Classes

```
POST /modules/instructor/classes/create.php
GET  /modules/instructor/classes/get_all.php?instructor_id=X
```

### Dashboard

```
GET /modules/instructor/dashboard/stats.php?instructor_id=X
```

## 🎨 Design System

### Colors

```javascript
Primary Maroon: #7D1F1F   // MSU brand color
Gold Accent:    #C4A24C   // MSU gold
Background:     #F5F5F5   // Light gray
Text Dark:      #1A1A1A   // Almost black
Text Light:     #666666   // Medium gray
```

### Typography

- **Headers:** Bold, 24-32px
- **Body:** Regular, 14-16px
- **Captions:** 12px

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ Prepared statements (SQL injection prevention)
- ✅ Input validation on both frontend and backend
- ✅ MSU email domain validation
- ✅ CORS configuration
- ✅ Session token management

## 📊 Current Status

### ✅ Completed

- [x] Modular monolithic architecture
- [x] Database migrations system
- [x] Instructor authentication (login/register)
- [x] Core backend utilities (Database, Response, Validator)
- [x] Frontend authentication screens
- [x] Instructor navigation (tabs)
- [x] Dashboard layout
- [x] QR scanner screen
- [x] Profile screen
- [x] MSU branding and design

### 🚧 In Progress

- [ ] Class creation screen
- [ ] Class list and management
- [ ] Student module
- [ ] QR code generation
- [ ] Attendance marking
- [ ] Reports and analytics

## 🧪 Testing

### Test Registration

1. Open app and click "Create Account"
2. Use MSU email: `test@msuiit.edu.ph`
3. Fill in all fields
4. Should see success message

### Test Login

1. Click "Sign In"
2. Enter registered credentials
3. Should navigate to dashboard

### Verify Backend

Open browser: http://localhost/msu-attendance-api/modules/instructor/auth/login.php

Should see JSON response (not 404 error)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not responding | Start Laragon, check Apache & MySQL |
| Database error | Run `.\run-migrations.ps1` again |
| App can't connect | Update API URL in `src/config/api.js` |
| Physical device issues | Use IP address instead of localhost |

📖 **Full troubleshooting guide:** [BACKEND_SETUP.md](BACKEND_SETUP.md#troubleshooting)

## 📱 Supported Platforms

- ✅ Android (Expo Go & Standalone)
- ✅ iOS (Expo Go & Standalone)
- ✅ Web (Development only)

## 🤝 Contributing

This is an MSU internal project. For contributions:

1. Follow modular architecture
2. Maintain code documentation
3. Test all endpoints before committing
4. Follow MSU design guidelines

## 📄 License

© 2024 Mindanao State University. All rights reserved.

## 👥 Team

**Developed for:** MSU-Maguindanao  
**Purpose:** Automated Classroom Attendance Tracking

## 📞 Support

For issues or questions:

1. Check [QUICK_START.md](QUICK_START.md)
2. Read [BACKEND_SETUP.md](BACKEND_SETUP.md)
3. Review error logs
4. Contact MSU IT support

---

**Ready to get started?** 👉 [Open QUICK_START.md](QUICK_START.md)

Made with ❤️ for MSU
