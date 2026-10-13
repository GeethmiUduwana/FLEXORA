import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { setAccessToken, setOnTokenExpired } from '../api/client.js';
import { IUser, UserRole } from '../types/index.js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<IUser>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    termsAccepted: boolean;
  }) => Promise<IUser>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName: string; lastName: string }) => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session via refresh cookie on app boot
  useEffect(() => {
    setOnTokenExpired(() => {
      setUser(null);
      toast.error('Session expired. Please log in again.');
    });

    const initAuth = async () => {
      try {
        const response = await api.post('/auth/refresh');
        if (response.data?.data) {
          setAccessToken(response.data.data.accessToken);
          setUser(response.data.data.user);
        }
      } catch (err) {
        // No active refresh session, user remains unauthenticated
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<IUser> => {
    const response = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    termsAccepted: boolean;
  }): Promise<IUser> => {
    const response = await api.post('/auth/register', data);
    const { user: registeredUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network errors
    } finally {
      setAccessToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data: { firstName: string; lastName: string }): Promise<void> => {
    const response = await api.patch('/users/me', data);
    setUser(response.data.data.user);
    toast.success('Profile updated successfully');
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<void> => {
    await api.patch('/users/me/password', data);
    toast.success('Password changed successfully');
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
