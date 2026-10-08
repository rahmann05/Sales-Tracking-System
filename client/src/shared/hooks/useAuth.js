import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../services/api';

/**
 * useAuth Hook
 * Single Responsibility: Manage authentication state via backend (PostgreSQL).
 * Session dipulihkan dari token yang tersimpan (localStorage).
 */
export const useAuth = () => {
    const { user, sessionLoading, sessionError } = useApp();
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const login = useCallback(async (email, password) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            await authApi.login(email, password); // simpan token + user ke localStorage
            window.dispatchEvent(new CustomEvent('auth:login'));
            return true;
        } catch (err) {
            setAuthError(err.message || 'Login gagal. Periksa email & password.');
            return false;
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setAuthLoading(true);
        try{await authApi.logout();window.dispatchEvent(new CustomEvent('auth:logout'));return true;}
        catch(error){window.alert(`Sesi server belum berhasil dicabut: ${error.message}`);return false;}
        finally{setAuthLoading(false);}
    }, []);

    return { isAuthenticated: Boolean(user), authLoading: authLoading || sessionLoading, authError: authError || sessionError, login, logout };
};
