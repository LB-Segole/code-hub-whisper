
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendService } from '@/services/BackendService';

interface AuthContextProps {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await backendService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const session = await backendService.signIn(credentials.email, credentials.password);
      setUser(session?.user || null);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; name?: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const session = await backendService.signUp(userData.email, userData.password, userData);
      setUser(session?.user || null);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    backendService.signOut();
    setUser(null);
    navigate('/login');
  };

  const resetPassword = async (email: string): Promise<void> => {
    console.log('Reset password requested for:', email);
    // Simulate password reset in local mode
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const updatePassword = async (password: string): Promise<void> => {
    console.log('Password update requested');
    // Simulate password update in local mode
    setUser((prev: any) => prev ? { ...prev, updated_at: new Date().toISOString() } : null);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const value: AuthContextProps = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
