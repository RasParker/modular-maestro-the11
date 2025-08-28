import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MinimalNavbar } from './MinimalNavbar';
import { SidebarNavigation } from './SidebarNavigation';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = React.memo(({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Don't show navigation on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Get user only when not on auth pages to avoid context issues
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar Navigation for logged in users, MinimalNavbar for guests */}
      {!isMobile && user && <SidebarNavigation />}
      {!isMobile && !user && <MinimalNavbar />}
      
      {/* Mobile: Top Navigation */}
      {isMobile && <MinimalNavbar />}

      {/* Main Content */}
      <main 
        className={`
          ${isMobile ? 'pb-16 pt-16' : ''} 
          ${!isMobile && user ? 'ml-64' : ''}
          ${!isMobile && !user ? 'pt-16' : ''}
        `} 
        style={{ minHeight: '100vh' }}
      >
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && user && <BottomNavigation />}
    </div>
  );
});