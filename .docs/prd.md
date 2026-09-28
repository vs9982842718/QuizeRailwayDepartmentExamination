# Requirements Document

## 1. Application Overview

### 1.1 Application Name
Quiz Management System

### 1.2 Application Description
A comprehensive quiz application featuring structured navigation through categories and sections, user authentication, multiple question input methods (manual entry, bulk TXT upload, image-based, PDF import), timed quiz experience with instant feedback, score tracking capabilities, admin configuration for question timers, question management, and full test mode with detailed progress tracking.

## 2. Users and Usage Scenarios

### 2.1 Target Users
- Students and learners preparing for assessments
- Educators managing quiz content
- Administrators overseeing the quiz system and configuring quiz settings

### 2.2 Core Usage Scenarios
- Users register and login to access personalized quiz content
- Users navigate through categories and sections to select specific quiz topics
- Users take timed quizzes with instant feedback or full test mode
- Content managers add questions manually or through bulk upload
- Administrators configure question timers and manage question content
- Administrators review user scores and manage leaderboards

## 3. Page Structure and Functionality

### 3.1 Page Structure
```
├── Signup Page
├── Login Page
├── Dashboard Page
│   ├── Category Selection (Appendix 2A / Appendix 3A / LDCE)
│   └── Section Selection (Expenditure / Establishment / Stores / Books & Budget)
├── Quiz Page
├── Full Test Quiz Page
├── Result Page
├── Add Question Page (Manual Entry)
├── Bulk Upload Page (TXT File)
├── Image Question Upload Page
├── PDF Import Page
├── Leaderboard Page
├── Admin Settings Page
└── Admin Question Management Page
```

### 3.2 Signup Page
- Input fields: Username, Password, Confirm Password
- Validation: Username must be unique, passwords must match
- Action: Create account and store user data securely
- Redirect to Login Page after successful signup

### 3.3 Login Page
- Input fields: Username, Password
- Validation: Verify credentials against stored user data
- Action: Authenticate user and redirect to Dashboard Page
- Error handling: Display error message for invalid credentials

### 3.4 Dashboard Page
- Display three category options: Appendix 2A, Appendix 3A, LDCE
- User selects one category
- After category selection, display four section options: Expenditure, Establishment, Stores, Books & Budget
- User selects one section
- Action: Navigate to Quiz Page or Full Test Quiz Page based on category type

### 3.5 Quiz Page
- Display current question number and total questions
- Display question text (support multi-line)
- Display multiple choice options
- Display timer: countdown per question using configured time
- Display progress bar showing quiz completion percentage
- Show instant feedback: correct answer highlighted in green, wrong answer in red
- Auto-advance to next question when timer reaches zero
- Action: Record user answer and move to next question
- Navigate to Result Page after all questions completed

### 3.6 Full Test Quiz Page
- Top navigation bar:
  - Previous button (navigate to previous question)
  - Numbered question buttons (1, 2, 3...) showing question status by color
  - Scrollable with left/right arrows when questions exceed visible area
  - Next button (green, navigate to next question)
  - Countdown timer in orange pill format (MM:SS) on the right
- Below navigation bar:
  - Test title line: TestName • N questions • X minutes
- Main two-column layout:
  - Left column (wider):
    - Question card header: Question X of N (top-left), Marks: 1 (top-right)
    - Question text
    - 2x2 grid of answer options with radio buttons, light blue background
    - Report Question link (bottom-right)
    - Bottom action buttons: Clear Response (outlined red), Mark For Review (outlined orange), Next (filled blue)
  - Right column (narrow):
    - Question Legend card:
      - Total Questions count
      - Legend items: Not Visited (gray square), Not Answered (white square with border), Answered (green square), Marked for Review (orange square)
      - Submit Test button (red) at bottom
- Question button states:
  - Gray: not visited
  - White with border: visited but not answered
  - Green: answered
  - Orange: marked for review
- Timer counts down from configured total time
- Auto-submit when timer reaches zero
- Action: Record user answers, question states, and navigate between questions
- Navigate to Result Page after submission

### 3.7 Result Page
- Display total score (correct answers / total questions)
- Display percentage score
- Display summary of correct and incorrect answers
- Option to return to Dashboard or view Leaderboard

### 3.8 Add Question Page (Manual Entry)
- Dropdown: Select Category (Appendix 2A / Appendix 3A / LDCE)
- Dropdown: Select Section (Expenditure / Establishment / Stores / Books & Budget)
- Text area: Enter question text
- Dynamic option fields: Add/remove option inputs
- Checkbox: Mark correct answer(s) for each option
- Text area: Optional explanation
- Action: Save question to storage with category and section metadata

### 3.9 Bulk Upload Page (TXT File)
- File input: Upload .txt file
- Display upload status and validation results
- Parse file according to strict format rules:
  - Questions separated by single empty line
  - Question text: multi-line, no blank lines within
  - Options: start with * (correct) or - (wrong), continuous lines
  - Explanation: optional, starts with >, immediately after options
- Action: Parse and save all valid questions to storage
- Error handling: Display invalid question blocks and reasons

### 3.10 Image Question Upload Page
- Select Category and Section
- Upload question image
- Upload option images
- Mark correct answer(s)
- Optional explanation
- Action: Save question with image references

### 3.11 PDF Import Page
- File input: Upload PDF file
- Action: Extract text from PDF
- Convert extracted text to TXT format
- Parse using same TXT format rules
- Display preview of parsed questions
- Action: Save validated questions to storage

### 3.12 Leaderboard Page
- Display ranked list of users by score
- Show username, total score, and percentage
- Filter by category and section

### 3.13 Admin Settings Page
- Input field: Configure per-question timer duration (in seconds)
- Action: Save timer configuration
- Display current timer setting

### 3.14 Admin Question Management Page
- Display list of all questions
- Filter options: Category, Section, Bunch
- For each question, display:
  - Question text
  - Answer options
  - Correct answer(s) indicator
  - Edit button
- Edit mode:
  - Text area: Edit question text
  - Dynamic fields: Edit answer options
  - Checkbox: Change correct answer(s)
  - Save button: Save changes to storage
  - Cancel button: Discard changes

## 4. Business Rules and Logic

### 4.1 Authentication Rules
- Username must be unique across all users
- Password must be stored securely using localStorage or database
- Session maintained after successful login
- Redirect unauthenticated users to Login Page

### 4.2 Quiz Flow Rules
- Navigation path: Login → Category Selection → Section Selection → Quiz or Full Test Quiz
- Category type determines quiz mode:
  - type='full_test': Navigate to Full Test Quiz Page
  - Other types: Navigate to standard Quiz Page
- Standard Quiz:
  - Questions displayed in random order
  - Timer starts automatically when question appears
  - Timer duration: configured value per question
  - Auto-advance when timer expires, treating unanswered as incorrect
  - Instant feedback shown after user selects answer
  - No option to go back to previous questions
- Full Test Quiz:
  - Questions displayed in order
  - Timer counts down from total configured time
  - Users can navigate between questions using numbered buttons or Previous/Next
  - Users can mark questions for review
  - Users can clear responses
  - No instant feedback during quiz
  - Auto-submit when timer reaches zero
  - Manual submit via Submit Test button

### 4.3 Question Format Rules
- Minimum 2 options required per question
- At least 1 correct answer required
- Question text cannot be empty
- Options marked with * are correct answers
- Support single or multiple correct answers

### 4.4 TXT File Parsing Rules
- Questions separated by exactly ONE empty line
- Question block structure:
  - Question text (multi-line, no blank lines)
  - Options (continuous lines starting with * or -)
  - Explanation (optional, starts with >, immediately after options)
- Invalid blocks skipped with error notification
- UTF-8 encoding support
- Trim extra spaces from all text

### 4.5 Scoring Rules
- Correct answer: +1 point
- Wrong or unanswered: 0 points
- Final score = (Correct answers / Total questions) × 100%
- Store user scores with timestamp

### 4.6 Admin Configuration Rules
- Admin can configure per-question timer duration
- Timer configuration applies to all new quizzes
- Default timer: 30 seconds if not configured
- Admin can edit existing questions
- Question edits take effect immediately for future quizzes

### 4.7 Full Test Question State Rules
- Not Visited: Question not yet opened
- Not Answered: Question visited but no answer selected
- Answered: Question has selected answer
- Marked for Review: Question flagged by user for later review
- Clear Response: Remove selected answer, change state to Not Answered

### 4.8 Data Storage Structure
```
{
  category: \"Appendix 2A\",
  section: \"Expenditure\",
  question: \"Question text\",
  options: [\"Option 1\", \"Option 2\", \"Option 3\"],
  correct: [0, 2],
  explanation: \"Optional explanation text\",
  image: \"optional_image_path\"
}

Category:
{
  name: \"Appendix 2A\",
  type: \"full_test\" or \"standard\"
}

Timer Configuration:
{
  per_question_seconds: 30
}
```

## 5. Exception and Boundary Cases

| Scenario | Handling |
|----------|----------|
| User enters existing username during signup | Display error: Username already exists |
| User enters wrong credentials during login | Display error: Invalid username or password |
| No questions available for selected category/section | Display message: No questions available, return to Dashboard |
| Timer expires before user selects answer (standard quiz) | Auto-advance to next question, mark as incorrect |
| Timer expires in full test mode | Auto-submit quiz with current answers |
| TXT file contains invalid format | Skip invalid blocks, display error details, save valid questions |
| TXT file has blank lines within question block | Reject block as invalid |
| Question has less than 2 options | Reject question, display validation error |
| Question has no correct answer marked | Reject question, display validation error |
| PDF extraction fails | Display error: Unable to extract text from PDF |
| Image upload fails | Display error: Image upload failed, retry |
| User closes browser during quiz | Session lost, no score saved |
| Admin sets invalid timer value (negative or zero) | Display error: Timer must be positive integer |
| Admin edits question to invalid state | Display validation error, prevent save |
| User clicks Submit Test with unanswered questions | Show confirmation dialog, allow submission |
| User navigates away from full test quiz | Show warning: Progress will be lost |

## 6. Acceptance Criteria

1. Users can successfully signup with unique username and password
2. Users can login with correct credentials and access Dashboard
3. Dashboard displays three categories and four sections correctly
4. Standard quiz displays questions in random order with configured timer per question
5. Full test quiz displays questions with top navigation bar, numbered buttons, and countdown timer
6. Full test quiz allows navigation between questions using Previous/Next and numbered buttons
7. Full test quiz question buttons change color based on state (gray/white/green/orange)
8. Full test quiz allows marking questions for review and clearing responses
9. Full test quiz auto-submits when timer reaches zero
10. Result page displays accurate score and percentage
11. Manual question entry form saves questions with all required fields
12. TXT bulk upload correctly parses questions following strict format rules
13. Admin can configure per-question timer duration from Admin Settings Page
14. Admin can view all questions with filters on Admin Question Management Page
15. Admin can edit question text, options, and correct answers
16. Question edits save successfully and apply to future quizzes
17. Leaderboard displays users ranked by score
18. All user data stored securely in localStorage or database

## 7. Out of Scope for Current Release

- Admin control panel for user management
- Difficulty level settings for questions
- Question deletion functionality
- Export quiz results to external formats
- Multi-language support
- Email notifications for quiz completion
- Social sharing features
- Question tagging or advanced filtering beyond category/section/bunch
- Analytics dashboard for quiz performance
- Mobile app version
- Question version history or audit log
- Bulk edit questions
- Question duplication feature