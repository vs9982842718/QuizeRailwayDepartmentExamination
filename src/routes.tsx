import AdminPasswordResetPage from './pages/AdminPasswordResetPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SectionSelectionPage from './pages/SectionSelectionPage';
import BunchDetailPage from './pages/BunchDetailPage';
import QuizPage from './pages/QuizPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import ResultPage from './pages/ResultPage';
import QuizReviewPage from './pages/QuizReviewPage';
import AddQuestionPage from './pages/AddQuestionPage';
import BulkUploadPage from './pages/BulkUploadPage';
import ImageUploadPage from './pages/ImageUploadPage';
import PdfImportPage from './pages/PdfImportPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ProfilePage from './pages/ProfilePage';
import HelpDeskPage from './pages/HelpDeskPage';
import ChatPage from './pages/ChatPage';
import AdminQueriesPage from './pages/AdminQueriesPage';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Root',
    path: '/',
    element: <Navigate to="/login" replace />,
    public: true,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <SignupPage />,
    public: true,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    name: 'Section Selection',
    path: '/section-selection',
    element: <SectionSelectionPage />,
  },
  {
    name: 'Bunch Detail',
    path: '/bunch-detail',
    element: <BunchDetailPage />,
  },
  {
    name: 'Quiz',
    path: '/quiz',
    element: <QuizPage />,
  },
  {
    name: 'Result',
    path: '/result',
    element: <ResultPage />,
  },
  {
    name: 'Quiz Review',
    path: '/quiz-review',
    element: <QuizReviewPage />,
  },
  {
    name: 'Add Question',
    path: '/add-question',
    element: <AddQuestionPage />,
  },
  {
    name: 'Bulk Upload',
    path: '/bulk-upload',
    element: <BulkUploadPage />,
  },
  {
    name: 'Image Upload',
    path: '/image-upload',
    element: <ImageUploadPage />,
  },
  {
    name: 'PDF Import',
    path: '/pdf-import',
    element: <PdfImportPage />,
  },
  {
    name: 'Leaderboard',
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    name: 'Help Desk',
    path: '/help',
    element: <HelpDeskPage />,
  },
  {
    name: 'Chat',
    path: '/chat',
    element: <ChatPage />,
  },
  {
    name: 'Admin Queries',
    path: '/admin/queries',
    element: <AdminQueriesPage />,
  },
  {
    name: 'Admin Password Resets',
    path: '/admin/password-resets',
    element: <AdminPasswordResetPage />,
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: <AdminUsersPage />,
  },
  {
    name: 'Admin Questions',
    path: '/admin/questions',
    element: <AdminQuestionsPage />,
  },
];
