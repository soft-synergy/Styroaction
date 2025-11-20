'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from '@/components/admin/LoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';
import styles from './admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (authToken: string) => {
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('adminToken', authToken);
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
  };

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <AdminDashboard token={token!} onLogout={handleLogout} />
      )}
    </div>
  );
}

