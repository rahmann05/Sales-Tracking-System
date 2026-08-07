import { useState, useCallback } from 'react';

/**
 * useSearch Hook
 * Single Responsibility: Manage search query state.
 */
export const useSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    return { searchQuery, setSearchQuery, clearSearch };
};
