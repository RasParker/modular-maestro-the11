import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { LogOut, Settings, User, Crown, Shield, Menu, X, Home, Compass, LayoutDashboard, UserCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'creator':
        return '/creator/dashboard';
      case 'fan':
        return '/fan/dashboard';
      default:
        return '/';
    }
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

  // Navigation items for both desktop and mobile
  const navigationItems = [
    { label: 'Explore', href: '/explore', icon: Compass, show: true },
    { label: 'Feed', href: '/fan/feed', icon: Home, show: user?.role === 'fan' },
    { label: 'Dashboard', href: getDashboardLink(), icon: LayoutDashboard, show: !!user },
    { label: 'My Profile', href: `/creator/${user?.username}`, icon: UserCircle, show: user?.role === 'creator' },
  ].filter(item => item.show);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">X</span>
            </div>
            <span className="text-xl font-bold text-gradient-primary">
              Xclusive
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden h-10 w-10 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">X</span>
                      </div>
                      <span className="text-xl font-bold text-gradient-primary">
                        Xclusive
                      </span>
                    </Link>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 py-6">
                    <div className="space-y-1 px-6">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.href}
                          onClick={closeMobileMenu}
                          className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
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
                                {user.username.charAt(0).toUpperCase()}
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
                            <button
                              onClick={() => {
                                handleLogout();
                                closeMobileMenu();
                              }}
                              className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
                            >
                              <LogOut className="h-5 w-5" />
                              <span>Log out</span>
                            </button>
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

                    {/* Mobile Auth Buttons */}
                    {!user && (
                      <div className="mt-6 px-6">
                        <div className="border-t pt-6 space-y-3">
                          <Button variant="ghost" asChild className="w-full">
                            <Link to="/login" onClick={closeMobileMenu}>Log In</Link>
                          </Button>
                          <Button variant="premium" asChild className="w-full">
                            <Link to="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Menu */}
            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.avatar ? (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/') ? user.avatar : `/uploads/${user.avatar}`) : undefined} 
                          alt={user.username} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          {getRoleIcon()}
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/${user.role}/settings`} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="premium" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};