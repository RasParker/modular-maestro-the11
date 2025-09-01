import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, role: 'fan' | 'creator', primaryCategoryId?: number) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for stored user session and verify with server
    const verifySession = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('xclusive_user');
        
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          try {
            // Set user immediately from localStorage for faster initial render
            const userData = JSON.parse(storedUser);
            
            // Validate user data structure
            if (userData && typeof userData === 'object' && userData.id) {
              setUser(userData);
              
              // Verify session with server in background
              fetch('/api/auth/verify', {
                credentials: 'include'
              }).then(response => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error('Session invalid');
                }
              }).then(data => {
                if (data.user && typeof data.user === 'object') {
                  setUser(data.user);
                }
              }).catch((error) => {
                // Session expired or invalid, clear local storage
                console.log('Session expired, clearing local storage', error);
                localStorage.removeItem('xclusive_user');
                setUser(null);
              }).finally(() => {
                setIsLoading(false);
              });
            } else {
              throw new Error('Invalid user data structure');
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('xclusive_user');
            setUser(null);
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        // Clear local storage on error
        localStorage.removeItem('xclusive_user');
        setUser(null);
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      // Store user data
      localStorage.setItem('xclusive_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('xclusive_token', data.token);
      }

      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string, role: 'fan' | 'creator', primaryCategoryId?: number) => {
    setIsLoading(true);

    try {
      const requestBody: any = { email, password, username, role };
      if (role === 'creator' && primaryCategoryId) {
        requestBody.primaryCategoryId = primaryCategoryId;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      const user = {
        ...data.user,
        id: data.user.id.toString() // Convert to string for compatibility
      };

      setUser(user);
      localStorage.setItem('xclusive_user', JSON.stringify(user));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call server logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear client state
      setUser(null);
      localStorage.removeItem('xclusive_user');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('xclusive_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};