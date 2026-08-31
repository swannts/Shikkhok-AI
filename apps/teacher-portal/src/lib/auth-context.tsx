'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';

export interface TeacherUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  schoolName?: string;
}

interface AuthContextType {
  user: TeacherUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string, schoolName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TeacherUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('teacher_token');
    const savedUser = localStorage.getItem('teacher_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('teacher_token');
        localStorage.removeItem('teacher_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await apiClient.post('/auth/login', { phone, password });
    const { accessToken, user: userData } = res.data.data || res.data;
    
    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      throw new Error('Access denied: Only teacher or admin accounts can access the Teacher Portal.');
    }

    const teacherObj: TeacherUser = {
      id: userData.id || userData._id,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      schoolName: userData.schoolName,
    };

    localStorage.setItem('teacher_token', accessToken);
    localStorage.setItem('teacher_user', JSON.stringify(teacherObj));
    setToken(accessToken);
    setUser(teacherObj);
    router.push('/dashboard');
  };

  const register = async (name: string, phone: string, password: string, schoolName?: string) => {
    const res = await apiClient.post('/auth/register', {
      name,
      phone,
      password,
      role: 'teacher',
      schoolName,
    });
    const { accessToken, user: userData } = res.data.data || res.data;
    const teacherObj: TeacherUser = {
      id: userData.id || userData._id,
      name: userData.name,
      phone: userData.phone,
      role: 'teacher',
      schoolName,
    };

    localStorage.setItem('teacher_token', accessToken);
    localStorage.setItem('teacher_user', JSON.stringify(teacherObj));
    setToken(accessToken);
    setUser(teacherObj);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('teacher_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
