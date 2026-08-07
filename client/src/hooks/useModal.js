import { useState, useCallback } from 'react';

/**
 * useModal Hook
 * Single Responsibility: Manage modal open/close state with optional payload.
 * Replaces the scattered `activeModal` + `selectedItem` pattern.
 */
export const useModal = () => {
    const [modalType, setModalType] = useState(null);
    const [payload, setPayload] = useState(null);

    const openModal = useCallback((type, data = null) => {
        setModalType(type);
        setPayload(data);
    }, []);

    const closeModal = useCallback(() => {
        setModalType(null);
        setPayload(null);
    }, []);

    const isOpen = useCallback((type) => modalType === type, [modalType]);

    return { modalType, payload, openModal, closeModal, isOpen };
};
