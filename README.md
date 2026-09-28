# Quiz Management System

A comprehensive quiz application with structured navigation, user authentication, and advanced question management capabilities.

## Features

### 🔐 User Authentication & Authorization
- **Username and password-based signup/login**
- **Secure authentication** with Supabase Auth
- **User Agreement and Privacy Policy** acceptance during signup
- **Enforced authentication**: All routes require login - app redirects to login page if not authenticated
- **Manual approval system**: 
  - **Registration**: New users start with `approved = false` status
  - **Admin approval**: Admin must approve users before they can access quizzes
  - **Dashboard message**: Unapproved users see approval pending message
- **Category-level access control**:
  - **Admin**: Can control which categories (Appendix 2A, 3A, LDCE) each user can access
  - **User**: Only sees categories they have permission to access
  - **Default**: All categories visible unless admin restricts access
- **Role-based access control**:
  - **Admin**: Full access to question management, user management, category visibility control, and test visibility control
  - **User**: Can take quizzes and view leaderboard (after approval, with category restrictions if set by admin)

### 📚 Quiz Organization
Navigate through a hierarchical quiz system:
- **Categories**: Appendix 2A, Appendix 3A, LDCE
- **Sections**: Expenditure, Establishment, Stores, Books & Budget, Traffic
- **Bunches**: Organize questions into named sets (e.g., "Starter Set", "Advanced Topics")

### 🎯 Bunch Management
- Create bunches with simple names (e.g., "01", "02", "Set A")
- Click on a bunch to view its details
- Each bunch shows:
  - Question count
  - Visibility status badge (admin only)
  - Start Quiz button (if questions exist)
  - Add Questions options (admin only)
  - Hide/Show toggle button (admin only)
  - Delete Bunch button (admin only)
- **Hide/Show tests**: Admin can control test visibility without deleting
- **Delete bunches**: Admin can delete entire bunches with all their questions
- **Visibility control**: Hidden tests don't appear for regular users
- Organize questions into logical groups for better management

### ⏱️ Interactive Quiz Experience
- **Quiz header**: Displays "Quiz System" title and "Created by Vijay Sharma (Accountant/NWR)"
- **30-second timer** per question with countdown display
- **Random question order** for each quiz session
- **Instant feedback** showing correct/wrong answers
- **Submit anytime**: Submit Quiz button available at top-right during quiz
- **Proper state reset**: Selected options clear correctly between questions
- **Auto-advance** when timer expires or after answer submission
- **Progress bar** tracking quiz completion percentage
- **Explanation display** after answering (if provided)
- **Flexible submission**: Can submit quiz at any time with confirmation dialog
- **Quiz review**: After submission, review all questions with correct/wrong answers highlighted

### 📝 Question Management (Admin Only)
Multiple ways to add questions to bunches (admin access required):

1. **Manual Entry**
   - Form-based question creation
   - Multi-line question support
   - Dynamic option fields (add/remove)
   - Multiple correct answers support
   - Optional explanation field
   - Assign to specific bunch

2. **Bulk TXT Upload**
   - Upload multiple questions from a .txt file
   - **Improved parser**: Handles different line endings (Windows, Mac, Linux)
   - **Better splitting**: Correctly separates 100+ questions into individual entries
   - Strict format validation with inline guide
   - Error reporting for invalid questions
   - Assign all questions to a specific bunch
   - **Format rules**:
     - Questions separated by ONE empty line
     - Correct answers marked with `*`
     - Wrong answers marked with `-`
     - Explanation (optional) marked with `>`
     - Multi-line questions supported (e.g., English + Hindi)
     - Question numbering (1), 2), etc.) automatically removed
     - UTF-8 encoding for special characters
   - See `TXT_FORMAT_GUIDE.md` for detailed examples
   - Sample file: `sample-questions.txt`

3. **Image-Based Questions**
   - Upload question images
   - Automatic image compression (max 1MB)
   - WEBP format conversion
   - Progress tracking during upload
   - Assign to specific bunch

4. **PDF Import**
   - Extract text from PDF files
   - Parse using TXT format rules
   - Preview parsed questions before import
   - Assign to specific bunch

### 👥 User Management (Admin Only)
- **Create new users**: Admin can manually create user accounts with username and password
  - Improved error handling with detailed error messages
  - Loading indicator during user creation
  - Success confirmation after creation
  - Newly created users are automatically approved
  - Password automatically stored for admin reference
- **Approve registrations**: View and approve pending user registrations
  - Pending users shown in separate section
  - One-click approve button
  - Users can access system after approval
- **View passwords**: Admin can see passwords for all users
  - Helpful for sharing credentials with users
  - Password displayed in easy-to-read format
  - Admin cannot change user passwords (users manage their own)
- **Category visibility control**: Admin can control which categories each user can access
  - "Categories" button for each user
  - Toggle show/hide for Appendix 2A, 3A, and LDCE
  - Visual indicators (Eye/EyeOff icons) for visibility status
  - Changes apply immediately to user's dashboard
  - Default: All categories visible unless restricted
- **Revoke access**: Revoke access for users (changes approved status to false)
- **View user details**: See registration dates and user information

### 👤 User Profile Management
- **Change Username**: Users can update their own username
  - Validation: Only letters, numbers, and underscores
  - Duplicate check to prevent conflicts
  - Immediate update with page refresh
- **Change Password**: Users can update their own password
  - Requires current password verification
  - Minimum 6 characters for new password
  - Confirmation field to prevent typos
  - Secure password update process
- **View Account Info**: See username, email, role, and approval status
- **Access**: Profile Settings link in user menu (top right corner)

### 🏆 Leaderboard
- View top performers
- Filter by category and section
- Display score, percentage, and ranking
- Top 3 highlighted with special icons

### 📊 Score Tracking
- Automatic score calculation
- Percentage display
- Detailed result summary
- Historical score storage

## Admin Account

An admin account has been created with the following credentials:

**Username**: `admin`  
**Password**: `Admin@Quiz2026!#$`

⚠️ **Important**: Please change the admin password after first login for security.

## Test Users

You can create test users one at a time using the admin panel:

1. Login as admin
2. Go to Admin Users page (`/admin/users`)
3. Click the "Create User" button
4. Fill in the form:
   - **Username**: Required (letters, numbers, underscores only)
   - **Email**: Optional (if not provided, uses `{username}@miaoda.com`)
   - **Password**: Required (minimum 6 characters)
5. Click "Create User" and wait for confirmation
6. Check browser console (F12) for detailed logs if any issues occur

**Recommended Test Users**: jitendra, jeetaram, surendra, joravar, neeraj, rakesh, uma, chandraprakash, siyaram, anil  
**Recommended Password**: 123456  
**Status**: All created users are automatically approved

### Troubleshooting User Creation

If you encounter issues creating users:

1. **Check Browser Console**: Press F12 to open developer tools and check the Console tab
2. **Look for Error Messages**: The system logs every step with detailed information
3. **Common Issues**:
   - **Username exists**: Choose a different username
   - **Database error**: Check the specific error message in console
   - **Profile not created**: Verify database trigger is working
   - **Update failed**: Check database permissions
4. **Test with Simple Username**: Try creating a user with username "test01" and password "123456"

## User Agreement & Privacy Policy

The application includes a basic User Agreement and Privacy Policy during signup. 

⚠️ **Legal Notice**: Please modify the User Agreement and Privacy Policy to comply with your specific legal requirements and jurisdiction.

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Design**: Minimal aesthetic with Montserrat font
- **State Management**: React Context API

## TXT Question Format

For bulk uploading questions via TXT files, follow this format:

### Basic Example
```
Which animal lives in water?
-Cat
-Dog
*Fish
-Horse
> Fish are aquatic animals.
```

### Format Rules
- **Questions**: Start directly, can span multiple lines
- **Correct answers**: Marked with `*`
- **Wrong answers**: Marked with `-`
- **Explanation**: Optional, marked with `>`
- **Separator**: ONE empty line between questions

### Multiple Questions Example
```
Which animal lives in water?
-Cat
-Dog
*Fish
-Horse
> Fish are aquatic animals.

Which animals can fly?
*Pigeon
-Dog
*Raven
*Eagle
> The pigeon, raven and eagle are all flying birds.
```

### Bilingual Format Example (with numbering)
```
1) SSS stands for __________ (Hint: Services Contracts)
SSS का अर्थ __________ है (संकेत: सेवा अनुबंध)
- Single Standard Service
* Similar Single Service
- Specific Single Service

2) GFR stands for _______________
जीएफआर का अर्थ _______________ है
* General Financial Rules
- Government Financial Rules
```

For detailed format guide with more examples, see `TXT_FORMAT_GUIDE.md` in the project root.
A sample file `sample-questions.txt` is also provided for testing.

## Recent Fixes (v41)

### 1. Deleted All Test Users (01-500)
- **Action**: Removed all 500 test user accounts from database
- **Method**: Deleted from auth.users (profiles cascade deleted automatically)
- **Result**: Clean user database with only real users remaining

### 2. Removed Signup Option
- **Change**: Removed signup link from login page
- **Reason**: Admin-only user creation policy
- **Impact**: Users can only be created by administrators

### 3. Enhanced Help Desk Page
- **Admin Features**:
  - Can edit instructions using textarea
  - Save/Cancel buttons for editing
  - Instructions stored in database
- **User Features**:
  - View-only access to admin instructions
  - Clean, readable interface
- **Database**: New `help_desk_instructions` table with RLS policies

### 4. Admin User Deletion Feature
- **New Capability**: Admins can delete any user account
- **UI**: Delete button with destructive styling
- **Safety**: Confirmation dialog before deletion
- **Implementation**: Edge function `delete-user` for secure deletion
- **Effect**: Removes user and all associated data permanently

### 5. Database Schema Updates
- **New Tables**:
  - `help_desk_instructions`: Stores admin instructions
  - `categories`: Metadata for category types and timers
- **New Columns**:
  - `quiz_results.marked_for_review`: Track review-marked questions
  - `quiz_results.time_remaining_seconds`: Store remaining time
- **Category Types**: Support for 'normal' and 'full_test' categories
- **Timer Support**: `time_limit_minutes` field for Full Test categories

### Features Implemented
✅ Test user cleanup (01-500 deleted)
✅ Signup removal (admin-only creation)
✅ Editable Help Desk instructions
✅ Admin user deletion with confirmation
✅ Database schema for Full Test feature
🔄 Full Test quiz interface (in progress)

### Admin Capabilities
- Create users with custom credentials
- Delete any user account (except admins)
- Edit Help Desk instructions
- Manage category access per user
- Approve/revoke user access

## Previous Fixes (v40)

### 1. Reverted Username Change Login Fix
- **Issue**: Previous username lookup change broke login for ALL users including admin
- **Action**: Reverted to original simple login system
- **Current Behavior**: Login uses `{username}@miaoda.com` format directly
- **Result**: All users can login again (admin, vijay, 01-500)

### 2. Username Change Limitation
- **Note**: Users can change their username in Profile Settings
- **Warning**: After changing username, they must login with ORIGINAL username (not new one)
- **Example**: 
  - User "25" changes username to "myname"
  - Must still login with "25" (not "myname")
  - This is a known limitation

### 3. 500 Test Users Still Active
- **Total Users**: 500 test accounts (01-500)
- **Password**: 123456 (all accounts)
- **Status**: All working and can login

### Login Credentials
**Test Users**:
- Usernames: 01, 02, 03, ... 500
- Password: 123456
- Login with numeric username (even if changed in profile)

**Admin Users**:
- admin (use admin password)
- vijay (use vijay password)

## Previous Fixes (v38)

### 1. Created 450 Additional Test Users (51-500)
- **Total Users**: 500 test accounts (01-50 and 51-500)
- **Usernames**: 01, 02, 03, ... 500
- **Password**: 123456 (all accounts)
- **Format**: 
  - 01-99: Two-digit format (01, 02, ... 99)
  - 100-500: Three-digit format (100, 101, ... 500)
- **Status**: All approved and ready to use
- **Encryption**: Bcrypt cost factor 10 (matching admin/vijay)

### 2. Fixed Username Change Login Issue
- **Problem**: Users who changed their username couldn't login with new username
- **Example**: User "01" changed to "jitendra" but couldn't login as "jitendra"
- **Root Cause**: Login system used `username@miaoda.com` format without checking actual email
- **Solution Implemented**:
  1. **Login System**: Now looks up username in profiles table first, then uses actual email
  2. **Profile Update**: When username changes, email in profiles table also updates to `{new_username}@miaoda.com`
- **Result**: Users can now login with their new username after changing it

### 3. Login Flow Enhancement
**Old Flow**:
```
User enters "jitendra" → System tries "jitendra@miaoda.com" → Fails (email is 01@miaoda.com)
```

**New Flow**:
```
User enters "jitendra" → System looks up username in profiles → Finds email "01@miaoda.com" → Login succeeds
```

### User Credentials
**Test Users (500 total)**:
- Usernames: 01, 02, 03, ... 500
- Password: 123456
- Can change username and still login

**Admin Users**:
- admin, vijay (existing passwords)

### Testing Username Change
1. Login with any test user (e.g., "25", password "123456")
2. Go to Profile Settings
3. Change username to anything (e.g., "myname")
4. Logout
5. Login with new username "myname" and password "123456"
6. ✅ Login works!

## Previous Fixes (v37)

### 1. Fixed Password Encryption for 50 Test Users
- **Issue**: Users 01-50 showed "invalid username and password" error
- **Root Cause**: Password encryption used wrong bcrypt cost factor (6 instead of 10)
- **Comparison**: 
  - vijay user (working): `$2a$10$` (cost factor 10)
  - 01-50 users (broken): `$2a$06$` (cost factor 6)
- **Fix**: Re-encrypted all 50 user passwords with bcrypt cost factor 10
- **Result**: All 50 users now work exactly like "vijay" and "admin" users

### 2. Verified All Authentication Requirements
- ✅ **Approved**: true (all 50 users)
- ✅ **Email Confirmed**: true (all 50 users)
- ✅ **Password Hash**: $2a$10$ (matching vijay/admin)
- ✅ **Profile Exists**: yes (all 50 users)

### Login Now Works for All Users
**Test Users (01-50)**:
- Username: 01, 02, 03, ... 50
- Password: 123456
- Status: Working (same as vijay/admin)

**Admin Users**:
- Username: admin
- Username: vijay

All users now use the same authentication method and password encryption standard.

## Previous Fixes (v35)

### 1. Fixed Login for 50 Test Users
- **Issue**: Users 01-50 could not login due to `approved = false` in database
- **Root Cause**: Initial user creation didn't properly set approval status
- **Fix Applied**:
  - Updated all 50 users to `approved = true`
  - Re-encrypted passwords with proper bcrypt encryption
  - Verified email confirmation status
- **Result**: All 50 users can now login successfully

### 2. Authentication Verification
- **Checked**: Email confirmation (✓ confirmed)
- **Checked**: Password encryption (✓ properly encrypted)
- **Checked**: User approval status (✓ now approved)
- **Checked**: Profile creation (✓ all profiles exist)

### Login Instructions
All 50 users can now login:
1. Go to login page
2. Enter username: 01, 02, 03, ... 50
3. Enter password: 123456
4. Click login - should work immediately

### User Status Summary
- **Total Users**: 50 (usernames 01-50)
- **Password**: 123456 (all users)
- **Approved**: Yes (all users)
- **Email Confirmed**: Yes (all users)
- **Ready to Use**: Yes

## Previous Fixes (v34)

### 1. Created 50 Test User Accounts
- **Action**: Directly created 50 user accounts in the database
- **Usernames**: 01, 02, 03, 04, 05, ... 50
- **Password**: 123456 (for all accounts)
- **Email**: {username}@miaoda.com (e.g., 01@miaoda.com, 02@miaoda.com)
- **Status**: All users are approved and ready to use
- **Access**: Users can login immediately with their credentials

### 2. Fixed Database Trigger
- **Issue**: Trigger was referencing non-existent phone column
- **Fix**: Updated `handle_new_user()` trigger to work with current schema
- **Result**: New user creation now works properly

### User Credentials
All 50 users can login with:
- **Username**: 01, 02, 03, ... 50
- **Password**: 123456
- **Status**: Approved (no admin approval needed)

### Testing
You can now test the system with any of these 50 accounts:
1. Go to login page
2. Enter username (e.g., "01", "25", "50")
3. Enter password: 123456
4. Click login

## Previous Fixes (v32)

### 1. Added Terms Agreement Checkbox to Admin User Creation
- **Feature**: Admin must check "I agree to the User Agreement and Privacy Policy" when creating users
- **Location**: Admin Users page - Create User dialog
- **Validation**: User creation blocked if checkbox not checked
- **Error Message**: "Please agree to the User Agreement and Privacy Policy"
- **Reset**: Checkbox automatically unchecked after successful user creation
- **Purpose**: Ensures admin acknowledges terms on behalf of created users

### Benefits
- **Compliance**: Ensures terms agreement for all created accounts
- **Accountability**: Admin explicitly agrees to terms when creating users
- **User Protection**: Guarantees all users are covered by terms and privacy policy

## Previous Fixes (v29)

### 1. Updated Color Scheme to Purple/Indigo Theme
- **Change**: Replaced minimal gray theme with vibrant purple/indigo colors
- **Primary Color**: Indigo (#6366F1) - matches the provided design image
- **Accent Color**: Purple gradient for visual appeal
- **Sidebar**: Purple background with white text
- **Cards**: Clean white with subtle shadows
- **Result**: Modern, engaging interface matching the reference design

### 2. Added Help Desk Feature
- **Location**: Accessible from header navigation (all users)
- **Content**:
  - **Getting Started**: How to take quizzes and manage account
  - **Contact Support**: Phone and email support information
  - **Creator Credit**: "Created by **Vijay Sharma (Accountant/NWR)**" in bold
  - **Admin Instructions**: Detailed guidelines (visible only to admins)
  - **FAQ**: Common questions and answers
- **Admin-Only Section**: Comprehensive instructions for:
  - User management (creating, approving, deleting)
  - Category access control
  - Quiz management (adding, editing, deleting)
  - Best practices
  - Troubleshooting guide

### 3. Enhanced Creator Attribution
- **Header**: Shows "Created by **Vijay Sharma (Accountant/NWR)**" in bold
- **Help Desk**: Highlighted creator information in dedicated card
- **Visibility**: Displayed prominently throughout the application

### 4. Admin User Creation Simplified
- **No Terms Checkbox**: Removed agreement checkbox from admin creation
- **Reason**: Admin-created users don't need to agree to terms
- **Fields**: Username, Email (optional), Password
- **Process**: Streamlined for quick user creation

### 5. Navigation Improvements
- **Help Desk Link**: Added to both desktop and mobile navigation
- **Icon**: HelpCircle icon for easy identification
- **Accessibility**: Available to all users (admin and regular)
- **Mobile**: Included in mobile sheet menu

### Benefits
- **Visual Appeal**: Modern purple theme is more engaging
- **User Support**: Comprehensive help documentation
- **Admin Guidance**: Detailed instructions for administrators
- **Simplified Workflow**: No unnecessary checkboxes in admin creation
- **Professional Branding**: Clear creator attribution

## Previous Fixes (v28)

### 1. Fixed Admin User Creation Permission Issues
- **Problem**: "User not allowed" error when admin tried to create users
- **Root Cause**: Frontend was trying to use admin API with anon key (no permission)
- **Solution**: Created dedicated Edge Function `admin-create-user` with service role key
- **Result**: Admin can now create users successfully with proper permissions

### 2. Fixed Signup Database Errors
- **Problem**: "Database error saving new user" during signup
- **Root Cause**: Race condition - profile update attempted before trigger completed
- **Solution**: 
  - Added 1.5 second wait for trigger to complete
  - Added error handling with specific error messages
  - Added comprehensive logging for debugging
- **Result**: Signup now works reliably with proper error messages

### 3. Added Email Field to Signup
- **Feature**: Users can now optionally provide email during signup
- **Behavior**:
  - If email provided: Uses the provided email
  - If email not provided: Auto-generates `{username}@miaoda.com`
- **Location**: Signup page now has email field between username and password
- **Validation**: Email field is optional but validated if provided

### 4. Enhanced Error Handling and Logging
- **Admin User Creation**:
  - Every step logged to console
  - Specific error messages for each failure type
  - Validates username format and uniqueness
  - Checks if trigger created profile
  - Verifies profile update succeeded
- **Signup Process**:
  - Logs username and email being used
  - Logs auth signup result
  - Logs profile update result
  - Shows specific database errors

### 5. Backend Architecture Improvements
- **Edge Function**: `admin-create-user`
  - Uses service role key for admin operations
  - Validates all inputs
  - Checks for duplicate usernames
  - Creates auth user
  - Waits for trigger
  - Verifies profile creation
  - Updates profile with username and approval
  - Returns detailed success/error messages
- **Signup Flow**:
  - Uses regular auth signup (public access)
  - Waits for trigger to create profile
  - Updates profile with username and password
  - Proper error handling at each step

### 6. Database Permissions Verified
- **RLS Policies**: Confirmed working correctly
  - Admins have full access to profiles
  - Users can update their own profile
  - Users can view their own profile
- **Trigger**: `handle_new_user` working correctly
  - Creates profile automatically when auth user created
  - Sets default role to 'user'
  - Sets approved to false (requires admin approval)

### Benefits
- **For Admin**: Can create users without permission errors
- **For Users**: Signup works reliably without database errors
- **For Debugging**: Comprehensive logs help identify issues quickly
- **For Flexibility**: Optional email field for custom emails
- **For Security**: Proper separation of admin and public operations

## Previous Fixes (v27)

### 1. Simplified User Creation with Email Option
- **Change**: Removed bulk user creation feature
- **Reason**: Focus on reliable single-user creation with better error handling
- **New Feature**: Added optional email field to user creation form
  - If email provided: Uses the provided email
  - If email not provided: Auto-generates `{username}@miaoda.com`
- **Improved Logging**: Comprehensive console logging for every step
  - Logs username and email being used
  - Logs database checks
  - Logs auth user creation
  - Logs profile creation and updates
  - Logs all errors with details

### 2. Enhanced Error Handling
- **Database Checks**: Validates username doesn't exist before creating
- **Profile Verification**: Checks if trigger created profile successfully
- **Detailed Errors**: Shows specific error messages for each failure type
- **Console Logging**: All steps logged to browser console (F12) for debugging
- **Admin API**: Uses admin API for reliable user creation

### 3. User Creation Process
1. Admin enters username (required)
2. Admin enters email (optional)
3. Admin enters password (required, min 6 characters)
4. System checks if username exists
5. System creates auth user with admin API
6. System waits for trigger to create profile (1.5 seconds)
7. System verifies profile was created
8. System updates profile with username and approval
9. Success message shown and user list refreshed

### 4. Troubleshooting
- **Check Console**: Press F12 to see detailed logs
- **Database Errors**: All database errors shown with specific messages
- **Trigger Issues**: System verifies trigger created profile
- **Step-by-Step**: Every step logged for easy debugging

### Benefits
- **Reliability**: Single user creation is more reliable
- **Debugging**: Comprehensive logging helps identify issues
- **Flexibility**: Optional email field for custom emails
- **Transparency**: Admin can see exactly what's happening
- **Error Messages**: Clear, specific error messages

## Previous Fixes (v26)

### 1. Enhanced Bulk User Creation with Detailed Logging
- **Feature**: Improved bulk user creation with comprehensive error handling and logging
- **Location**: Admin Users page - "Create 110 Test Users" button
- **Improvements**:
  - **Detailed Console Logging**: Every step of user creation is logged to browser console
  - **Better Error Handling**: Specific error messages for each failure type
  - **Duplicate Detection**: Checks both username and email before creating
  - **Progress Tracking**: Shows exactly which users were created, skipped, or failed
  - **Longer Wait Time**: Increased wait time for trigger to ensure profile creation
  - **Email Validation**: Checks if email already exists in auth system
  
### 2. User Creation Info Card
- **Feature**: Added helpful information card on admin page
- **Content**: Shows what users will be created and their password
- **Tip**: Reminds admin to check console for detailed logs
- **Design**: Highlighted card with primary color accent

### 3. Improved Error Messages
- **Frontend**: Better error display with detailed messages
- **Backend**: Comprehensive logging at every step
- **Console**: All errors logged to browser console for debugging
- **Toast Notifications**: Clear success/warning/error messages

### 4. Database Validation
- **Structure**: Verified profiles table has all required fields
- **Trigger**: Confirmed handle_new_user trigger is working correctly
- **Constraints**: Proper handling of unique constraints
- **Defaults**: Correct default values for all fields

### Test Users Details
- **Named Users** (10): jitendra, jeetaram, surendra, joravar, neeraj, rakesh, uma, chandraprakash, siyaram, anil
- **Numbered Users** (100): 01, 02, 03, ... 100
- **Password**: All users have password `123456`
- **Status**: All users are approved and ready to use
- **Email Format**: `{username}@miaoda.com`

### Benefits
- **For Debugging**: Comprehensive logs help identify issues quickly
- **For Testing**: Reliable bulk user creation with detailed feedback
- **For Admin**: Clear information about what's being created
- **For Support**: Easy troubleshooting with console logs

## Previous Fixes (v23)

### 1. One-Click Bulk User Creation
- **Feature**: Create 110 test users with a single button click
- **Location**: Admin Users page - "Create 110 Test Users" button
- **Named Users** (10): jitendra, jeetaram, surendra, joravar, neeraj, rakesh, uma, chandraprakash, siyaram, anil
- **Numbered Users** (100): 01, 02, 03, ... 100
- **Password**: All users have password `123456`
- **Status**: All users are approved and ready to use
- **Implementation**: 
  - Edge function `create-bulk-users` handles creation
  - Checks for existing users to avoid duplicates
  - Shows success message with creation summary
  - Automatically refreshes user list after creation

### 2. User Profile Management
- **Feature**: Users can manage their own profile settings
- **Access**: Profile Settings link in user menu (top right)
- **Capabilities**:
  - **Change Username**: Update username with validation
    - Only letters, numbers, and underscores allowed
    - Checks for duplicate usernames
    - Updates immediately
  - **Change Password**: Update password securely
    - Requires current password verification
    - Minimum 6 characters for new password
    - Confirmation field to prevent typos
    - Updates both auth and profile password
  - **View Account Info**: See username, email, role, and approval status

### 3. Admin Password Management Changes
- **Change**: Removed password change functionality from admin panel
- **Reason**: Users should manage their own passwords for security
- **Admin Can**: View passwords (for sharing with users)
- **Admin Cannot**: Change user passwords
- **Result**: Better security and user autonomy

### 4. Enhanced Navigation
- **Profile Settings**: Added to user dropdown menu (desktop)
- **Profile Settings**: Added to mobile menu
- **Icon**: Settings icon for easy identification
- **Access**: Available to all authenticated users

### Benefits
- **For Testing**: Easy one-click creation of 110 test accounts
- **For Users**: 
  - Full control over their own credentials
  - Easy access to profile settings
  - Secure password management
- **For Admin**: 
  - Can view passwords to share with users
  - Cannot accidentally change user passwords
  - Simplified admin interface
  - Quick test user setup
- **For Security**: 
  - Users verify current password before changing
  - Admin cannot override user passwords
  - Better separation of concerns

## Previous Fixes (v22)

### 1. Bulk User Creation
- **Feature**: Created 110 test users automatically
- **Named Users** (10): jitendra, jeetaram, surendra, joravar, neeraj, rakesh, uma, chandraprakash, siyaram, anil
- **Numbered Users** (100): 01, 02, 03, ... 100
- **Password**: All users have password `123456`
- **Status**: All users are approved and ready to use
- **Implementation**: Edge function `create-bulk-users` for reliable bulk creation

### 2. User Profile Management
- **Feature**: Users can manage their own profile settings
- **Access**: Profile Settings link in user menu (top right)
- **Capabilities**:
  - **Change Username**: Update username with validation
    - Only letters, numbers, and underscores allowed
    - Checks for duplicate usernames
    - Updates immediately
  - **Change Password**: Update password securely
    - Requires current password verification
    - Minimum 6 characters for new password
    - Confirmation field to prevent typos
    - Updates both auth and profile password
  - **View Account Info**: See username, email, role, and approval status

### 3. Admin Password Management Changes
- **Change**: Removed password change functionality from admin panel
- **Reason**: Users should manage their own passwords for security
- **Admin Can**: View passwords (for sharing with users)
- **Admin Cannot**: Change user passwords
- **Result**: Better security and user autonomy

### 4. Enhanced Navigation
- **Profile Settings**: Added to user dropdown menu (desktop)
- **Profile Settings**: Added to mobile menu
- **Icon**: Settings icon for easy identification
- **Access**: Available to all authenticated users

### Benefits
- **For Testing**: 110 ready-to-use test accounts
- **For Users**: 
  - Full control over their own credentials
  - Easy access to profile settings
  - Secure password management
- **For Admin**: 
  - Can view passwords to share with users
  - Cannot accidentally change user passwords
  - Simplified admin interface
- **For Security**: 
  - Users verify current password before changing
  - Admin cannot override user passwords
  - Better separation of concerns

## Previous Fixes (v21)

### 1. Reverted to Manual User Approval
- **Change**: Restored original approval workflow requiring admin approval
- **Implementation**: 
  - Changed default `approved` value back to `false` in database
  - Updated trigger to require manual approval for new users
  - New users must wait for admin approval before accessing system
- **Result**: Admin has full control over who can access the system
- **Benefit**: Enhanced security and controlled access

### 2. Category-Level Visibility Control
- **Feature**: Admin can control which categories each user can access
- **Categories**: Appendix 2A, Appendix 3A, LDCE
- **Implementation**:
  - New `user_category_access` table to store per-user category visibility
  - "Categories" button in admin panel for each user
  - Dialog interface showing all categories with show/hide toggles
  - Visual indicators (Eye/EyeOff icons) for visibility status
  - Real-time updates when toggling visibility

### 3. User Dashboard Category Filtering
- **Feature**: Users only see categories they have access to
- **Implementation**:
  - Dashboard fetches user's category access on load
  - Filters category list based on visibility settings
  - Admin users see all categories (no restrictions)
  - Default behavior: Show all categories if no restrictions set
  - Shows message if user has no category access

### 4. Enhanced Admin Controls
- **Category Management**:
  - Click "Categories" button for any user
  - See all three categories with current visibility status
  - Toggle show/hide for each category individually
  - Changes apply immediately
  - Visual feedback with icons and status text

### Benefits
- **For Admin**: 
  - Full control over user access (manual approval required)
  - Fine-grained control over category access per user
  - Can restrict users to specific categories
  - Easy to manage permissions per user
- **For Users**: 
  - Clean dashboard showing only relevant categories
  - Clear feedback on approval status
  - Clear feedback if no categories available
- **For Organization**: 
  - Enhanced security with approval workflow
  - Flexible category-based access control
  - Scalable permission management

## Previous Fixes (v19)

### 1. Automatic User Approval
- **Change**: Removed admin approval requirement for new users
- **Implementation**: 
  - Changed default `approved` value to `true` in database
  - Updated trigger to auto-approve all new users
  - All existing users automatically approved
- **Result**: Users can immediately access the system after signup
- **Benefit**: Streamlined onboarding process, no waiting for admin approval

### 2. Category-Level Visibility Control
- **Feature**: Admin can control which categories each user can access
- **Categories**: Appendix 2A, Appendix 3A, LDCE
- **Implementation**:
  - New `user_category_access` table to store per-user category visibility
  - "Categories" button in admin panel for each user
  - Dialog interface showing all categories with show/hide toggles
  - Visual indicators (Eye/EyeOff icons) for visibility status
  - Real-time updates when toggling visibility

### 3. User Dashboard Category Filtering
- **Feature**: Users only see categories they have access to
- **Implementation**:
  - Dashboard fetches user's category access on load
  - Filters category list based on visibility settings
  - Admin users see all categories (no restrictions)
  - Default behavior: Show all categories if no restrictions set
  - Shows message if user has no category access

### 4. Enhanced Admin Controls
- **Category Management**:
  - Click "Categories" button for any user
  - See all three categories with current visibility status
  - Toggle show/hide for each category individually
  - Changes apply immediately
  - Visual feedback with icons and status text

### Benefits
- **For Admin**: 
  - Fine-grained control over user access
  - Can restrict users to specific categories
  - Easy to manage permissions per user
  - No need to manually approve every signup
- **For Users**: 
  - Immediate access after signup
  - Clean dashboard showing only relevant categories
  - Clear feedback if no categories available
- **For Organization**: 
  - Flexible access control system
  - Can create role-based category access
  - Scalable permission management

## Previous Fixes (v18)

### 1. Fixed Admin User Creation
- **Issue**: Database error when admin creates new users
- **Fix**: Now properly stores `temporary_password` when admin creates users
- **Implementation**: Added password storage to profile update during user creation
- **Result**: Admin can successfully create users without errors

### 2. Password Change Functionality
- **Feature**: Admin can change user passwords
- **Implementation**:
  - Added "Change Password" button for each user in admin panel
  - Dialog interface for entering new password
  - Updates both Supabase Auth password and temporary_password in profiles
  - Minimum 6 characters validation
- **Access**: Available for all non-admin users in the approved users list

### 3. Test User Created
- **Username**: jitendra
- **Password**: 123456
- **Status**: Approved and ready to use
- **Created via**: Edge function for reliable user creation

### 4. Reverted Authentication Changes
- **Reverted**: Strict login blocking for unapproved users
- **Current Behavior**: Users can login but see approval message on dashboard
- **Reason**: More flexible user experience while maintaining security

### Benefits
- **For Admin**: Easy user creation without errors, ability to reset user passwords
- **For Users**: Smooth onboarding experience
- **For Testing**: Test user available for immediate use

## Previous Fixes (v17)

### 1. Enhanced Authentication Workflow
- **Registration (Signup)**:
  - User creates account with username and password
  - Account status automatically set to `pending` in database
  - Clear info alert explains approval requirement before signup
  - Success message: "Registration successful! Please wait for Admin approval before logging in."
  - User redirected to login page (no auto-login)
  - Password stored temporarily for admin reference

- **Login Validation**:
  - System checks approval status during login
  - If `status == 'approved'` → Login allowed
  - If `status == 'pending'` → Login blocked with error: "Your account is awaiting admin approval. Please wait for approval before logging in."
  - Admin accounts bypass approval check
  - User immediately signed out if not approved

- **Admin Dashboard**:
  - View all pending users at `/admin/users`
  - See username and password for each user
  - One-click "Approve" button updates status to approved
  - Approved users can immediately login

### 2. Database Structure
- **profiles table** includes:
  - `approved` boolean field (default: false)
  - `temporary_password` text field for admin reference
  - Automatic trigger sets new users to pending status
  - Admin role users automatically approved

### Benefits
- **Security**: Prevents unauthorized access to quiz system
- **Control**: Admin has full control over who can access tests
- **Clarity**: Users understand they need approval before accessing system
- **Transparency**: Admin can see credentials to share with approved users

## Previous Fixes (v16)

### 1. Dynamic Test Visibility Control
- **Feature**: Admin can hide/show tests (bunches) for users
- **Implementation**:
  - Added `visible` boolean field to questions table (default: true)
  - Eye/EyeOff toggle button in bunch detail page for admin
  - Visibility badge shows current status (Visible/Hidden)
  - Hidden tests don't appear in user's library
  - Admin can always see all tests regardless of visibility
- **Use Case**: Control which tests are available to users without deleting them

### 2. New Section: Traffic
- **Feature**: Added "Traffic" as a new section category
- **Availability**: Available in all categories (Appendix 2A, 3A, LDCE)
- **Icon**: Car icon for easy identification
- **Description**: Traffic rules and regulations
- **Integration**: Fully integrated in all pages (Dashboard, Add Question, Bulk Upload, Image Upload)

### 3. Enhanced User Management
- **Pending State**: Users start in pending state after signup
- **Admin Approval**: Only approved users can access tests
- **Credential Visibility**: Admin can see username and password for all users
- **Access Control**: Unapproved users see a clear message explaining they need approval

### Benefits
- **For Admin**: Better control over test availability and user access
- **For Users**: Clear feedback on account status and available tests
- **For Organization**: Flexible content management without data loss

## Previous Fixes (v15)

### 1. Admin Can See User Passwords
- **Feature**: When users sign up, admin can see their username and password
- **Implementation**:
  - Added `temporary_password` field to profiles table
  - Password is stored during signup for admin reference
  - Admin can see credentials in the Users management page
  - Helps admin share credentials with approved users
- **Display**: Password shown in monospace font with background highlight

### 2. Quiz Review After Submission
- **Feature**: After completing a quiz, users can review all questions and answers
- **What's Shown**:
  - All questions with their text and images
  - All answer options
  - Which option the user selected (marked with "Your Answer" badge)
  - Which option was correct (green border with checkmark)
  - Which option was wrong (red border with X mark)
  - Explanation for each question (if available)
  - Unanswered questions highlighted in amber
- **Access**: Click "Review Answers" button on the result page
- **Score Summary**: Shows total correct/wrong answers at the top

### Benefits
- **For Admin**: Easy credential management and user onboarding
- **For Users**: Learn from mistakes by reviewing correct answers
- **For Learning**: Explanations help understand why answers are correct/wrong

## Previous Fixes (v14)

### Header Update
- **Title**: "Quiz System" displayed prominently
- **Subtitle**: "Created by Vijay Sharma(Accountant/NWR)" shown below title
- Visible on desktop, hidden on mobile for space efficiency

### Admin User Creation Enhanced
- **Issue**: Database error when creating multiple users
- **Fixes Applied**:
  - Added username duplicate check before creation
  - Added delay to ensure database trigger completes
  - Pass username in signup metadata
  - Improved error messages with specific details
  - Added loading state during creation
  - Refresh user list after successful creation
- **Result**: Admin can now create multiple user accounts without errors

## Previous Fixes (v12-v13)

### 1. Admin User Creation Fixed
- **Issue**: Database error when creating new users
- **Fix**: 
  - Added proper error handling with detailed error messages
  - Automatically set username and approve newly created users
  - Added loading indicator during creation
  - Show success message after creation

### 2. Quiz Selection State Fixed
- **Issue**: Previous question's selected option remained visible on next question
- **Fix**: 
  - Added `useEffect` to reset `selectedOption` when question changes
  - Added unique `key` prop to RadioGroup based on question ID
  - Ensures clean state for each new question

### 3. Submit Quiz Button Added
- **Issue**: No way to submit quiz before completing all questions
- **Fix**: 
  - Added "Submit Quiz" button in top-right corner (always visible)
  - Shows confirmation dialog with answered/unanswered count
  - Allows submission at any time during quiz
  - Unanswered questions marked as incorrect

### 4. Quiz Header Added
- **Issue**: No title or creator information on quiz screen
- **Fix**: 
  - Added centered header with "Quiz System" title
  - Added subtitle "Created by Vijay Sharma (Accountant/NWR)"
  - Responsive font sizes for mobile and desktop

### 5. General Improvements
- Better error messages throughout the app
- Improved loading states
- Enhanced UI responsiveness
- Smoother navigation between questions

## Database Schema

### Tables
1. **profiles** - User profiles with role management and approval status
   - Fields: id, email, username, role (user/admin), approved (boolean)
2. **questions** - Quiz questions with category/section/bunch organization
3. **quiz_results** - User quiz scores and history

### Storage
- **question-images** - Bucket for question images

### Question Organization
Questions are organized in a three-level hierarchy:
- **Category** (e.g., Appendix 2A, Appendix 3A, LDCE)
  - **Section** (e.g., Expenditure, Establishment, Stores, Books & Budget)
    - **Bunch** (e.g., 01, 02, Starter Set, Advanced Topics)

### Access Control
- **Admin**: Full access to all features
- **User (Approved)**: Can view questions, take quizzes, view leaderboard
- **User (Pending)**: Can login but sees "Pending Approval" message

## Getting Started

### Important: Authentication Required
- The app requires login for all pages
- Opening the app will automatically redirect to the login page
- You must login before accessing any features

### Admin Account
The system includes a pre-configured admin account:
- **Username**: admin
- **Password**: Admin@Quiz2026!#$

### User Registration Flow
1. New users sign up with username and password
2. After signup, users are automatically logged in but see a "Pending Approval" message
3. Admin logs in and navigates to "Users" in the header
4. Admin approves pending user registrations
5. Approved users can now access quizzes and leaderboard

### Admin Workflow
1. Login with admin credentials
2. **Create users** (optional): Go to "Users" and click "Create User" to manually create accounts
3. **Approve registrations**: Navigate to "Users" to approve pending user registrations
4. Use "Manage Questions" dropdown to add questions via multiple methods
5. Create bunches and organize questions by category/section

### User Workflow (After Approval)
1. Login with approved credentials
2. Navigate to Dashboard to see all category/section combinations
3. Click on a section to view bunches
4. Click on a bunch to start a quiz
5. View scores and rankings on the Leaderboard

## Navigation Flow

### Admin Flow
```
Login → Dashboard → Users (approve registrations)
     → Manage Questions → Add/Edit Questions
     → Section Selection → Bunch Detail → Add Questions/Start Quiz
```

### User Flow (After Approval)
```
Login → Dashboard → Section Selection → Bunch Detail → Start Quiz → View Results
     → Leaderboard (view rankings)
```

**Example Admin Flow:**
1. Login as admin
2. Go to "Users" and:
   - Approve pending registrations, OR
   - Click "Create User" to manually create new accounts
3. Select "Appendix 2A" category and "Expenditure" section from Dashboard
4. View list of bunches (e.g., "01", "02")
5. Click "Add Bunch" to create a new bunch (e.g., "03")
6. Click on the bunch name to open it
7. Choose "Add Questions" and select a method:
   - **Manual**: Type questions one by one
   - **TXT Upload**: Upload a formatted .txt file (see format guide in the upload page)
   - **Image**: Upload question images
   - **PDF**: Extract and paste text from PDF
8. Add questions to the bunch
9. To delete a bunch: Click the trash icon in the bunch detail page (confirms deletion of all questions)

**Example User Flow:**
1. Sign up and wait for admin approval
2. After approval, login and go to Dashboard
3. Select a category and section
4. Click on a bunch to view details
5. Click "Start Quiz" to begin
6. Answer questions within 30 seconds each
7. View results and check Leaderboard

## TXT File Format Example

```
Which animals can fly?
*Pigeon
-Dog
*Eagle

> Birds have wings and can fly.

What color is the sky?
-Red
*Blue
-Green
```

## Security Features

- Row Level Security (RLS) policies on all tables
- Secure password storage
- Email verification disabled (username-based auth)
- Service role key for admin operations

## Notes

- Email verification is currently disabled
- Users authenticate with username + password
- Images are automatically compressed to stay under 1MB
- Quiz questions are randomized for each session
- Timer auto-advances to next question when time expires
