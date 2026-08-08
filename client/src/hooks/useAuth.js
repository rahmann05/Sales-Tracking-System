import { useState, useCallback } from 'react';
import { authApi, getAuthToken } from '../services/api';

/**
 * useAuth Hook
 * Single Responsibility: Manage authentication state via backend (PostgreSQL).
 * Session dipulihkan dari token yang tersimpan (localStorage).
 */
export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const login = useCallback(async (email, password) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            await authApi.login(email, password); // simpan token + user ke localStorage
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            setAuthError(err.message || 'Login gagal. Periksa email & password.');
            setIsAuthenticated(false);
            return false;
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        authApi.logout();
        setIsAuthenticated(false);
    }, []);

    return { isAuthenticated, authLoading, authError, login, logout };
};
