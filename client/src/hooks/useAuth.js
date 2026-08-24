import { useState, useCallback, useEffect } from 'react';
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

    useEffect(() => {
        const handleAuthExpired = () => {
            setIsAuthenticated(false);
        };
        window.addEventListener('auth:expired', handleAuthExpired);
        return () => window.removeEventListener('auth:expired', handleAuthExpired);
    }, []);

    const login = useCallback(async (email, password) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            await authApi.login(email, password); // simpan token + user ke localStorage
            setIsAuthenticated(true);
            window.dispatchEvent(new CustomEvent('auth:login'));
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
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }, []);

    return { isAuthenticated, authLoading, authError, login, logout };
};
