import React from 'react';
import { AbsenInModal } from './AbsenInModal';
import { AbsenOutModal } from './AbsenOutModal';
import { RequestUnlockModal } from './RequestUnlockModal';
import { InputOrderModal } from './InputOrderModal';
import { ReportClosedModal } from './ReportClosedModal';
import { AbsenOffPjpModal } from './AbsenOffPjpModal';

/**
 * SalesModals Component
 * Single Responsibility: Render the correct modal based on modalType.
 * Extracted from SalesFieldView to keep the parent orchestrator clean.
 */
export const SalesModals = ({
    modalType,
    selectedStop,
    activeVisitingStop,
    isOpen,
    onClose,
    handlers,
}) => {
    if (!modalType) return null;

    switch (modalType) {
        case 'ABSEN_IN':
            return (
                <AbsenInModal
                    stop={selectedStop}
                    onClose={onClose}
                    onConfirm={handlers.handleSalesAbsenIn}
                />
            );

        case 'ABSEN_OUT':
            return (
                <AbsenOutModal
                    stop={selectedStop}
                    onClose={onClose}
                    onConfirm={handlers.handleSalesAbsenOut}
                />
            );

        case 'UNLOCK_REQUEST':
            return (
                <RequestUnlockModal
                    stop={selectedStop}
                    activeVisitingStop={activeVisitingStop}
                    onClose={onClose}
                    onSubmitUnlockRequest={handlers.handleRequestUnlockOutlet}
                />
            );

        case 'ORDER':
            return (
                <InputOrderModal
                    stop={selectedStop}
                    onClose={onClose}
                    onSubmitOrder={handlers.handleSubmitOrder}
                />
            );

        case 'CLOSED_REPORT':
            return (
                <ReportClosedModal
                    stop={selectedStop}
                    onClose={onClose}
                    onSubmitReport={handlers.handleReportClosedOutlet}
                />
            );

        case 'OFFPJP_ABSEN':
            return (
                <AbsenOffPjpModal
                    isOpen={isOpen('OFFPJP_ABSEN')}
                    onClose={onClose}
                    onSubmit={handlers.handleSalesAbsenOffPJP}
                />
            );

        default:
            return null;
    }
};
