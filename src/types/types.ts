// User and Authentication Types
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  username: string;
  role: UserRole;
  approved: boolean;
  temporary_password?: string | null;
  full_name?: string | null;
  mobile_number?: string | null;
  date_of_birth?: string | null;
  is_temp_password?: boolean;
  created_at: string;
}

// Password Reset Request
export interface PasswordResetRequest {
  id: string;
  full_name: string;
  mobile_number: string;
  date_of_birth: string;
  username: string | null;
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface UserCategoryAccess {
  id: string;
  user_id: string;
  category: Category;
  visible: boolean;
  created_at: string;
}

// Quiz Categories and Sections
export type Category = 'Appendix 2A' | 'Appendix 3A' | 'LDCE' | 'Chapter Wise Questions';
export type Section = 'Expenditure' | 'Establishment' | 'Stores' | 'Books & Budget' | 'Traffic' | 'General';
export type CategoryType = 'normal' | 'full_test';

// Category Metadata
export interface CategoryMetadata {
  id: string;
  name: string;
  category_type: CategoryType;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// Help Desk
export interface HelpDeskInstructions {
  id: string;
  content: string;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

// Question Types
export interface Question {
  id: string;
  category: Category;
  section: Section;
  bunch: string;
  question: string;
  options: string[];
  correct: number[];
  explanation?: string;
  question_image_url?: string;
  visible: boolean;
  time_limit_seconds?: number | null;
  created_by?: string;
  created_at: string;
}

export interface QuestionInput {
  category: Category;
  section: Section;
  bunch: string;
  question: string;
  options: string[];
  correct: number[];
  explanation?: string;
  question_image_url?: string;
}

// Bunch Types
export interface Bunch {
  name: string;
  question_count: number;
  visible?: boolean;
}

// Quiz Result Types
export interface QuizResult {
  id: string;
  user_id: string;
  category: Category;
  section: Section;
  score: number;
  total_questions: number;
  percentage: number;
  marked_for_review?: number[];
  time_remaining_seconds?: number | null;
  created_at: string;
}

export interface QuizResultInput {
  user_id: string;
  category: Category;
  section: Section;
  score: number;
  total_questions: number;
  percentage: number;
}

// Quiz State Types
export interface QuizAnswer {
  question_id: string;
  selected: number[];
  correct: number[];
  is_correct: boolean;
  marked_for_review?: boolean;
}

export interface QuizReviewAnswer extends QuizAnswer {
  question: Question;
}

export interface QuizState {
  questions: Question[];
  current_index: number;
  answers: QuizAnswer[];
  time_remaining: number;
  is_finished: boolean;
  is_full_test?: boolean;
  time_limit_minutes?: number | null;
}

// App Settings
export type FontWeight = 'regular' | 'medium' | 'bold';

export interface AppSettings {
  id: number;
  quiz_time_per_question: number;
  font_style: string;
  font_size: number;
  font_weight: FontWeight;
  updated_at: string;
}

// Messaging / Chat Types
export interface Conversation {
  id: string;
  user_id: string;
  status: 'pending' | 'resolved';
  last_message_at: string | null;
  unread_by_admin: number;
  unread_by_user: number;
  created_at: string;
  // joined
  profile?: { username: string; email: string | null };
}

export interface Message {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  content: string;
  msg_status: 'sent' | 'delivered' | 'read';
  is_announcement: boolean;
  created_at: string;
  // joined
  sender?: { username: string };
}

// TXT Parsing Types
export interface ParsedQuestion {
  question: string;
  options: string[];
  correct: number[];
  explanation?: string;
}

export interface ParseResult {
  valid: ParsedQuestion[];
  invalid: { block: string; reason: string }[];
}
