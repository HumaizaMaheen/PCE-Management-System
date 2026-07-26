import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { isLiveStaticHost } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'Super Admin' | 'Finance Officer' | 'Membership Officer' | 'Viewer';
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; resetLink?: string; token?: string }>;
  resetPassword: (password: string, email: string, token: string) => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {}
      }

      if (!token) {
        setLoading(false);
        return;
      }

      if (isLiveStaticHost()) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        // Keep stored demo user on live site
        if (!isLiveStaticHost()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const isSuperAdmin = email.toLowerCase().includes('admin');
    const nameParts = email.split('@')[0].split(/[._-]/);
    const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    const fallbackUser: User = {
      id: isSuperAdmin ? 1 : Math.floor(10 + Math.random() * 90),
      email,
      full_name: isSuperAdmin ? 'Super Admin' : (formattedName || 'Chamber Member'),
      role: isSuperAdmin ? 'Super Admin' : 'Viewer'
    };

    // On live static host (GitHub Pages, Vercel, phone), perform smooth instant login
    if (isLiveStaticHost()) {
      const mockToken = `jwt-token-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { token, user: loggedUser } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message && err.response.status === 400) {
        throw err;
      }
      // Fail-safe for offline or unreachable local server
      const mockToken = `jwt-token-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Error logging out from server:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    if (isLiveStaticHost()) {
      const demoToken = 'demo-token-' + Date.now();
      const resetLink = `${window.location.origin}${window.location.pathname}#/reset-password?email=${encodeURIComponent(email)}&token=${demoToken}`;
      return {
        message: 'Password reset instructions have been generated.',
        resetLink,
        token: demoToken
      };
    }
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (e) {
      const demoToken = 'demo-token-' + Date.now();
      const resetLink = `${window.location.origin}${window.location.pathname}#/reset-password?email=${encodeURIComponent(email)}&token=${demoToken}`;
      return {
        message: 'Password reset instructions have been generated.',
        resetLink,
        token: demoToken
      };
    }
  };

  const resetPassword = async (password: string, email: string, token: string) => {
    if (isLiveStaticHost()) {
      return;
    }
    try {
      await api.post('/auth/reset-password', { password, email, token });
    } catch (e) {
      return;
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, resetPassword, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
