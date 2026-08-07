import React from 'react';
import { DeliveryAbsenInModal } from './DeliveryAbsenInModal';
import { DeliveryAbsenOutModal } from './DeliveryAbsenOutModal';
import { PodModal } from './PodModal';
import { RequestUnlockModal } from '../../Sales/components/RequestUnlockModal';

/**
 * DeliveryModals Component
 * Single Responsibility: Render the correct modal based on modalType.
 * Extracted from DeliveryPage to keep the parent orchestrator clean.
 */
export const DeliveryModals = ({
    modalType,
    selectedStop,
    isOpen,
    onClose,
    handlers,
}) => {
    if (!modalType) return null;

    switch (modalType) {
        case 'ABSEN_IN':
            return (
                <DeliveryAbsenInModal
                    stop={selectedStop}
                    onClose={onClose}
                    onConfirm={handlers.handleDeliveryAbsenIn}
                />
            );

        case 'POD':
            return (
                <PodModal
                    stop={selectedStop}
                    onClose={onClose}
                    onSubmitPOD={handlers.handleSubmitPOD}
                />
            );

        case 'ABSEN_OUT':
            return (
                <DeliveryAbsenOutModal
                    stop={selectedStop}
                    onClose={onClose}
                    onConfirm={handlers.handleDeliveryAbsenOut}
                />
            );

        case 'UNLOCK_REQUEST':
            return (
                <RequestUnlockModal
                    isOpen={isOpen('UNLOCK_REQUEST')}
                    outlet={selectedStop}
                    onClose={onClose}
                    onSubmit={handlers.handleDeliveryRequestUnlock}
                />
            );

        default:
            return null;
    }
};
