import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { 
  LogOut, 
  Settings, 
  User, 
  Crown, 
  Shield, 
  Home, 
  Compass, 
  BarChart3,
  Users,
  CreditCard,
  MessageSquare,
  Upload,
  Grid3X3,
  ChevronDown
} from 'lucide-react';

export const SidebarNavigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'creator':
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      { 
        label: 'Explore', 
        href: '/explore', 
        icon: Compass,
        active: location.pathname === '/explore'
      }
    ];

    switch (user.role) {
      case 'fan':
        return [
          { 
            label: 'Feed', 
            href: '/fan/feed', 
            icon: Home,
            active: location.pathname === '/fan/feed'
          },
          ...commonItems,
          { 
            label: 'Dashboard', 
            href: '/fan/dashboard', 
            icon: BarChart3,
            active: location.pathname === '/fan/dashboard'
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
          ...commonItems,
          { 
            label: 'Content', 
            href: '/creator/manage-content', 
            icon: Grid3X3,
            active: location.pathname === '/creator/manage-content'
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
          ...commonItems,
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
          }
        ];

      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">X</span>
          </div>
          <span className="text-xl font-bold text-gradient-primary">
            Xclusive
          </span>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              item.active 
                ? 'bg-accent text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-border space-y-4">
        {/* Notifications and Theme Toggle */}
        <div className="flex items-center justify-between px-2">
          {user && <NotificationBell />}
          <ThemeToggle />
        </div>

        {/* User Section */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-between p-3 h-auto hover:bg-accent"
                data-testid="user-menu-trigger"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.avatar ? (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/') ? user.avatar : `/uploads/${user.avatar}`) : undefined} 
                      alt={user.username} 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">{user.username}</span>
                    <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      {getRoleIcon()}
                      {user.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
              <DropdownMenuItem asChild>
                <Link to={`/${user.role}/settings`} className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {user.role === 'creator' && (
                <DropdownMenuItem asChild>
                  <Link to={`/creator/${user.username}`} className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="flex items-center space-x-2 text-white focus:text-white"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
};