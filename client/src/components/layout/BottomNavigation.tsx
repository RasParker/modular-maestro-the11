import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Compass, 
  BarChart3,
  Users,
  CreditCard,
  MessageSquare,
  Upload,
  Grid3X3,
  Shield,
  UserCircle
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Navigation items based on user role
  const getNavigationItems = () => {
    switch (user.role) {
      case 'fan':
        return [
          { 
            label: 'Feed', 
            href: '/fan/feed', 
            icon: Home,
            active: location.pathname === '/fan/feed'
          },
          { 
            label: 'Explore', 
            href: '/explore', 
            icon: Compass,
            active: location.pathname === '/explore'
          },
          { 
            label: 'Subscriptions', 
            href: '/fan/subscriptions', 
            icon: CreditCard,
            active: location.pathname === '/fan/subscriptions'
          },
          { 
            label: 'Messages', 
            href: '/fan/messages', 
            icon: MessageSquare,
            active: location.pathname === '/fan/messages'
          },
          { 
            label: 'Dashboard', 
            href: '/fan/dashboard', 
            icon: BarChart3,
            active: location.pathname === '/fan/dashboard'
          }
        ];

      case 'creator':
        return [
          { 
            label: 'Dashboard', 
            href: '/creator/dashboard', 
            icon: BarChart3,
            active: location.pathname === '/creator/dashboard'
          },
          { 
            label: 'Upload', 
            href: '/creator/upload', 
            icon: Upload,
            active: location.pathname === '/creator/upload'
          },
          { 
            label: 'Subscribers', 
            href: '/creator/subscribers', 
            icon: Users,
            active: location.pathname === '/creator/subscribers'
          },
          { 
            label: 'Messages', 
            href: '/creator/messages', 
            icon: MessageSquare,
            active: location.pathname === '/creator/messages'
          },
          {
            label: 'My Profile',
            href: `/creator/${user?.username}`,
            icon: UserCircle,
            active: location.pathname === `/creator/${user?.username}`
          }
        ];

      case 'admin':
        return [
          { 
            label: 'Dashboard', 
            href: '/admin/dashboard', 
            icon: BarChart3,
            active: location.pathname === '/admin/dashboard'
          },
          { 
            label: 'Users', 
            href: '/admin/users', 
            icon: Users,
            active: location.pathname === '/admin/users'
          },
          { 
            label: 'Content', 
            href: '/admin/content', 
            icon: Grid3X3,
            active: location.pathname === '/admin/content'
          },
          { 
            label: 'Explore', 
            href: '/explore', 
            icon: Compass,
            active: location.pathname === '/explore'
          },
          { 
            label: 'Admin', 
            href: '/admin/settings', 
            icon: Shield,
            active: location.pathname === '/admin/settings'
          }
        ];

      default:
        return [
          { 
            label: 'Explore', 
            href: '/explore', 
            icon: Compass,
            active: location.pathname === '/explore'
          }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-center h-16 px-4 max-w-screen-sm mx-auto">
        <div className="flex items-center justify-between w-full max-w-lg">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-2 py-3 rounded-lg transition-colors min-w-0 ${
                item.active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};