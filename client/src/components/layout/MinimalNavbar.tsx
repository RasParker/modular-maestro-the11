import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
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
  Menu,
  X
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const MinimalNavbar: React.FC = React.memo(() => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if this is an edge-to-edge page that needs floating navbar
  const isEdgeToEdgePage = false; // Removed video watch from edge-to-edge to restore solid navbar

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
          ...commonItems,
          { 
            label: 'Feed', 
            href: '/fan/feed', 
            icon: Home,
            active: location.pathname === '/fan/feed'
          },
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
          ...commonItems,
          { 
            label: 'Dashboard', 
            href: '/creator/dashboard', 
            icon: BarChart3,
            active: location.pathname === '/creator/dashboard'
          },
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
          ...commonItems,
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
          }
        ];

      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isEdgeToEdgePage 
        ? 'bg-transparent pointer-events-none' 
        : 'bg-background border-b border-border'
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">X</span>
            </div>
            <span className="text-xl font-bold text-gradient-primary hidden sm:block">
              Xclusive
            </span>
          </Link>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-md">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {user && <NotificationBell />}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-8 px-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={user.avatar ? (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/') ? user.avatar : `/uploads/${user.avatar}`) : undefined} 
                        alt={user.username} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden flex items-center space-x-3">
            {user && <NotificationBell />}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-background">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-start p-6 border-b">
                    <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">X</span>
                      </div>
                      <span className="text-xl font-bold text-gradient-primary">Xclusive</span>
                    </Link>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 py-6">
                    <div className="space-y-1 px-6">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={closeMobileMenu}
                          className={`flex items-center space-x-3 px-3 py-3 text-base font-medium rounded-lg transition-colors ${
                            item.active 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-foreground hover:text-primary hover:bg-accent'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Mobile User Section */}
                    {user && (
                      <div className="mt-6 px-6">
                        <div className="border-t pt-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={user.avatar ? (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/') ? user.avatar : `/uploads/${user.avatar}`) : undefined} 
                                alt={user.username} 
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                {getRoleIcon()}
                                {user.role}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Link
                              to={`/${user.role}/settings`}
                              onClick={closeMobileMenu}
                              className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            >
                              <Settings className="h-5 w-5" />
                              <span>Settings</span>
                            </Link>
                            {user.role === 'creator' && (
                              <Link
                                to={`/creator/${user.username}`}
                                onClick={closeMobileMenu}
                                className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                              >
                                <User className="h-5 w-5" />
                                <span>My Profile</span>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              onClick={() => { handleLogout(); closeMobileMenu(); }}
                              className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors w-full justify-start"
                            >
                              <LogOut className="h-5 w-5" />
                              <span>Log out</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Theme Toggle Section */}
                    <div className="mt-6 px-6">
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Theme</span>
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>


        </div>
      </div>
    </nav>
  );
});