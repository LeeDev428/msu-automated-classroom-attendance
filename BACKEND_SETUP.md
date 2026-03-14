# MSU Automated Classroom Attendance System - Setup Guide

## 📋 Prerequisites

1. **Laragon** (with Apache & MySQL)
2. **Node.js** (v16+)
3. **Expo CLI**
4. **HeidiSQL** (comes with Laragon)
5. **Android/iOS device or emulator**

## 🗄️ Database Setup

### Step 1: Create Database

1. Open HeidiSQL
2. Connect to your local MySQL server
3. Create a new database:
   - Right-click on your connection
   - Select "Create new" → "Database"
   - Name: `msu_attendance_db`
   - Collation: `utf8mb4_general_ci`
   - Click OK

### Step 2: Run Migrations

Execute migration files in order:

```sql
-- 1. Open each migration file from database/migrations/ folder
-- 2. Execute them in this exact order:

-- Migration 001: Users Table
SOURCE database/migrations/001_create_users_table.sql;

-- Migration 002: Classes Table
SOURCE database/migrations/002_create_classes_table.sql;

-- Migration 003: Students Table
SOURCE database/migrations/003_create_students_table.sql;

-- Migration 004: Enrollments Table
SOURCE database/migrations/004_create_enrollments_table.sql;

-- Migration 005: Attendance Table
SOURCE database/migrations/005_create_attendance_table.sql;
```

**Alternative Method (HeidiSQL):**
1. Open HeidiSQL
2. Select `msu_attendance_db` database
3. Go to File → Load SQL file
4. Load and execute each migration file in order (001 → 005)

### Step 3: Verify Database

Check if all tables were created:
```sql
SHOW TABLES;
```

You should see: `users`, `classes`, `students`, `enrollments`, `attendance`

## 🔧 Backend Setup

### Step 1: Copy Backend Files

Copy the `backend` folder to Laragon's www directory:

```powershell
# From project root
xcopy /E /I backend "C:\laragon\www\msu-attendance-api"
```

### Step 2: Verify Backend Structure

Your backend folder should look like this:
```
C:\laragon\www\msu-attendance-api\
├── core/
│   ├── Database.php
│   ├── Response.php
│   ├── Validator.php
│   └── cors.php
└── modules/
    └── instructor/
        ├── auth/
        │   ├── login.php
        │   └── register.php
        ├── classes/
        │   ├── create.php
        │   └── get_all.php
        └── dashboard/
            └── stats.php
```

### Step 3: Test Backend

1. Start Laragon (Apache & MySQL must be running)
2. Open browser and navigate to:
   - http://localhost/msu-attendance-api/modules/instructor/auth/register.php

You should see a JSON response (not an error page).

## 📱 Frontend Setup

### Step 1: Install Dependencies

```powershell
cd "D:\Programming\Systems\Mobile-Systems\PHP + React Native\msu-automated-classroom-attendance"
npm install
```

### Step 2: Update API Configuration

**For Expo Go on Physical Device:**

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually something like 192.168.x.x)

2. Update `src/config/api.js`:
   ```javascript
   export const API_BASE_URL = 'http://YOUR_IP_ADDRESS/msu-attendance-api';
   // Example: 'http://192.168.1.100/msu-attendance-api'
   ```

**For Emulator or Web:**
   ```javascript
   export const API_BASE_URL = 'http://localhost/msu-attendance-api';
   ```

### Step 3: Start Development Server

```powershell
npx expo start
```

Options:
- Press `w` for web browser
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## ✅ Testing the Application

### 1. Test Registration

1. Open the app
2. Click "Create Account" on landing screen
3. Fill in the form:
   - Full Name: Test Instructor
   - Email: test@msuiit.edu.ph
   - Department: Computer Science
   - Employee ID: EMP001
   - Password: password123
   - Confirm Password: password123
4. Click "Register"
5. You should see "Registration successful!" message

### 2. Verify Database Entry

Open HeidiSQL and run:
```sql
SELECT * FROM users WHERE email = 'test@msuiit.edu.ph';
```

You should see the newly created user record.

### 3. Test Login

1. Go back to login screen
2. Enter:
   - Email: test@msuiit.edu.ph
   - Name: Test Instructor
   - Password: password123
3. Click "Sign In"
4. You should be redirected to the instructor dashboard

## 🔍 Troubleshooting

### Database Connection Error

**Error:** "Database connection failed"

**Solution:**
1. Check if MySQL is running in Laragon
2. Verify database credentials in `backend/core/Database.php`:
   ```php
   private $host = "localhost";
   private $database_name = "msu_attendance_db";
   private $username = "root";
   private $password = "";
   ```

### Backend API Not Responding

**Error:** "Unable to connect to server"

**Solution:**
1. Verify Apache is running in Laragon
2. Check if backend files are in correct location: `C:\laragon\www\msu-attendance-api`
3. Test API endpoint in browser: http://localhost/msu-attendance-api/modules/instructor/auth/login.php
4. Check PHP error logs: `C:\laragon\bin\apache\logs\error.log`

### CORS Error

**Error:** "CORS policy blocked"

**Solution:**
- Ensure `backend/core/cors.php` is included in all PHP files
- Verify `Access-Control-Allow-Origin: *` header is set

### App Won't Connect on Physical Device

**Error:** Network timeout or connection refused

**Solution:**
1. Make sure your phone and computer are on the same WiFi network
2. Update `src/config/api.js` with your computer's IP (not localhost)
3. Check Windows Firewall - allow Apache through firewall
4. Verify Laragon Virtual Hosts configuration

### Invalid Email Error

**Error:** "Please use your MSU institutional email"

**Solution:**
- Email must end with `@msuiit.edu.ph`
- Example: `juan.delacruz@msuiit.edu.ph`

## 📝 Next Steps

After successful setup:

1. ✅ Test registration and login
2. ✅ Create sample classes
3. ✅ Test class management features
4. ✅ Implement QR code generation
5. ✅ Add student enrollment
6. ✅ Test attendance marking

## 🎯 Project Structure

```
msu-automated-classroom-attendance/
├── backend/                    # PHP Backend (Modular)
│   ├── core/                  # Core utilities
│   │   ├── Database.php       # Database connection
│   │   ├── Response.php       # API response handler
│   │   ├── Validator.php      # Input validation
│   │   └── cors.php          # CORS headers
│   └── modules/              # Feature modules
│       └── instructor/       # Instructor features
│           ├── auth/         # Authentication
│           ├── classes/      # Class management
│           └── dashboard/    # Dashboard stats
├── database/                  # Database files
│   └── migrations/           # Migration files (001-005)
├── src/                      # React Native Frontend
│   ├── config/               # App configuration
│   ├── constants/            # Constants (colors, etc.)
│   ├── navigation/           # App navigation
│   └── screens/              # App screens
└── package.json              # Dependencies
```

## 💡 Tips

- Always start Laragon before testing backend
- Use HeidiSQL to inspect database changes
- Check browser console and app logs for errors
- Test API endpoints in browser or Postman first
- Keep backend and frontend running simultaneously

## 📞 Support

If you encounter issues:
1. Check error logs in Laragon
2. Review PHP error messages in HeidiSQL
3. Check React Native error messages in terminal
4. Verify all services are running
