import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy load pages for better performance
const Login = React.lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import('@/pages/Signup').then(m => ({ default: m.Signup })));
const Explore = React.lazy(() => import('@/pages/Explore').then(m => ({ default: m.Explore })));
const CreatorProfile = React.lazy(() => import('@/pages/CreatorProfile').then(m => ({ default: m.CreatorProfile })));
const VideoWatch = React.lazy(() => import('@/pages/VideoWatch').then(m => ({ default: m.VideoWatch })));
const FeedPage = React.lazy(() => import('@/pages/fan/FeedPage').then(m => ({ default: m.FeedPage })));
const FanDashboard = React.lazy(() => import('@/pages/fan/FanDashboard').then(m => ({ default: m.FanDashboard })));
const CreatorDashboard = React.lazy(() => import('@/pages/creator/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const CreatePost = React.lazy(() => import('@/pages/creator/CreatePost').then(m => ({ default: m.CreatePost })));
const Analytics = React.lazy(() => import('@/pages/creator/Analytics').then(m => ({ default: m.Analytics })));
const Subscribers = React.lazy(() => import('@/pages/creator/Subscribers').then(m => ({ default: m.Subscribers })));
const CreatorSettings = React.lazy(() => import('@/pages/creator/CreatorSettings').then(m => ({ default: m.CreatorSettings })));
const EditPost = React.lazy(() => import('@/pages/creator/EditPost').then(m => ({ default: m.EditPost })));
const ManageTiers = React.lazy(() => import('@/pages/creator/ManageTiers').then(m => ({ default: m.ManageTiers })));
const ManageContent = React.lazy(() => import('@/pages/creator/ManageContent').then(m => ({ default: m.ManageContent })));
const Earnings = React.lazy(() => import('@/pages/creator/Earnings').then(m => ({ default: m.Earnings })));
const CreatorMessages = React.lazy(() => import('@/pages/creator/Messages').then(m => ({ default: m.Messages })));

// Fan pages
const ManageSubscriptions = React.lazy(() => import('@/pages/fan/ManageSubscriptions').then(m => ({ default: m.ManageSubscriptions })));
const Messages = React.lazy(() => import('@/pages/fan/Messages').then(m => ({ default: m.Messages })));
const PaymentMethod = React.lazy(() => import('@/pages/fan/PaymentMethod').then(m => ({ default: m.PaymentMethod })));
const FanSettings = React.lazy(() => import('@/pages/fan/FanSettings').then(m => ({ default: m.FanSettings })));
const Notifications = React.lazy(() => import('@/pages/fan/Notifications').then(m => ({ default: m.Notifications })));

// Admin pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminSettings = React.lazy(() => import('@/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminRedirect = React.lazy(() => import('@/pages/admin/AdminRedirect').then(m => ({ default: m.AdminRedirect })));
const ManageUsers = React.lazy(() => import('@/pages/admin/ManageUsers').then(m => ({ default: m.ManageUsers })));
const ReviewContent = React.lazy(() => import('@/pages/admin/ReviewContent').then(m => ({ default: m.ReviewContent })));
const Reports = React.lazy(() => import('@/pages/admin/Reports').then(m => ({ default: m.Reports })));
const AdminAnalytics = React.lazy(() => import('@/pages/admin/AdminAnalytics'));

// Payment pages
const PaymentCallback = React.lazy(() => import('@/pages/PaymentCallback'));
const PaymentTest = React.lazy(() => import('@/pages/PaymentTest'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

function App() {
  useEffect(() => {
    // Force dark theme on app initialization to ensure YouTube red colors show
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="xclusive-theme">
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppLayout>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                }>
                  <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Public Routes */}
              <Route path="/explore" element={<Explore />} />

              {/* Public Creator Profile Route - Must be accessible to everyone */}
              <Route path="/creator/:username" element={<CreatorProfile />} />

              {/* Public Post Viewing Route - Must be accessible to everyone */}
              <Route path="/creator/posts/:id" element={<CreatorProfile />} />

                {/* Fan Routes */}
              <Route path="/fan/dashboard" element={<ProtectedRoute allowedRoles={['fan']}><FanDashboard /></ProtectedRoute>} />
              <Route path="/fan/feed" element={<ProtectedRoute allowedRoles={['fan']}><FeedPage /></ProtectedRoute>} />
              <Route path="/fan/subscriptions" element={<ProtectedRoute allowedRoles={['fan']}><ManageSubscriptions /></ProtectedRoute>} />
              <Route path="/fan/messages" element={<ProtectedRoute allowedRoles={['fan']}><Messages /></ProtectedRoute>} />
              <Route path="/fan/notifications" element={<ProtectedRoute allowedRoles={['fan']}><Notifications /></ProtectedRoute>} />
              <Route path="/fan/payment" element={<ProtectedRoute allowedRoles={['fan']}><PaymentMethod /></ProtectedRoute>} />
              <Route path="/fan/settings" element={<ProtectedRoute allowedRoles={['fan']}><FanSettings /></ProtectedRoute>} />

              {/* Payment Routes */}
              <Route path="/payment-callback" element={<PaymentCallback />} />
              <Route path="/payment-test" element={<PaymentTest />} />


              {/* Creator Routes */}
              <Route path="/creator/dashboard" element={<ProtectedRoute allowedRoles={['creator']}><CreatorDashboard /></ProtectedRoute>} />
              <Route path="/creator/upload" element={<ProtectedRoute allowedRoles={['creator']}><CreatePost /></ProtectedRoute>} />
              <Route path="/creator/manage-content" element={<ProtectedRoute allowedRoles={['creator']}><ManageContent /></ProtectedRoute>} />
              <Route path="/creator/earnings" element={<ProtectedRoute allowedRoles={['creator']}><Earnings /></ProtectedRoute>} />
              <Route path="/creator/analytics" element={<ProtectedRoute allowedRoles={['creator']}><Analytics /></ProtectedRoute>} />
              <Route path="/creator/subscribers" element={<ProtectedRoute allowedRoles={['creator']}><Subscribers /></ProtectedRoute>} />
              <Route path="/creator/schedule" element={<ProtectedRoute allowedRoles={['creator']}><Navigate to="/creator/manage-content" replace /></ProtectedRoute>} />
              <Route path="/creator/settings" element={<ProtectedRoute allowedRoles={['creator']}><CreatorSettings /></ProtectedRoute>} />
              <Route path="/creator/tiers" element={<ProtectedRoute allowedRoles={['creator']}><ManageTiers /></ProtectedRoute>} />
              <Route path="/creator/messages" element={<ProtectedRoute allowedRoles={['creator']}><CreatorMessages /></ProtectedRoute>} />
              <Route path="/creator/notifications" element={<ProtectedRoute allowedRoles={['creator']}><Notifications /></ProtectedRoute>} />
              <Route path="/creator/edit-post/:id" element={<ProtectedRoute allowedRoles={['creator']}><EditPost /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
              <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['admin']}><ReviewContent /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />

              {/* Default route */}
              <Route path="/" element={<Login />} />
              <Route path="/video/:id" element={<VideoWatch />} />

              {/* Catch-all route for undefined paths */}
              <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </Router>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;