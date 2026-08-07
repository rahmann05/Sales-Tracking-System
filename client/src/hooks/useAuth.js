import { useState, useCallback } from 'react';

/**
 * useAuth Hook
 * Single Responsibility: Manage authentication state (login/logout).
 */
export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = useCallback(() => {
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
    }, []);

    return { isAuthenticated, login, logout };
};
