import React from 'react';
import { SpvAbsenInModal } from './SpvAbsenInModal';
import { SpvAuditModal } from './SpvAuditModal';
import { SpvAbsenOutModal } from './SpvAbsenOutModal';
import { SpvOffPjpModal } from './SpvOffPjpModal';

/**
 * SpvFieldModals Component (Modal Dispatcher)
 * Single Responsibility: Render modal aktif untuk SPV field view sesuai `activeModal`.
 */
export const SpvFieldModals = ({
    activeModal,
    selectedStop,
    inputNotes,
    onChangeNotes,
    checklist,
    onChangeChecklist,
    offPjpForm,
    onChangeOffPjpForm,
    onClose,
    onConfirmAbsenIn,
    onSaveAudit,
    onConfirmAbsenOut,
    onConfirmOffPjp,
}) => {
    if (activeModal === 'ABSEN_IN' && selectedStop) {
        return (
            <SpvAbsenInModal
                stop={selectedStop}
                inputNotes={inputNotes}
                onChangeNotes={onChangeNotes}
                onClose={onClose}
                onConfirm={onConfirmAbsenIn}
            />
        );
    }

    if (activeModal === 'AUDIT' && selectedStop) {
        return (
            <SpvAuditModal
                stop={selectedStop}
                checklist={checklist}
                onChangeChecklist={onChangeChecklist}
                inputNotes={inputNotes}
                onChangeNotes={onChangeNotes}
                onClose={onClose}
                onSave={onSaveAudit}
            />
        );
    }

    if (activeModal === 'ABSEN_OUT' && selectedStop) {
        return <SpvAbsenOutModal stop={selectedStop} onClose={onClose} onConfirm={onConfirmAbsenOut} />;
    }

    if (activeModal === 'OFF_PJP') {
        return (
            <SpvOffPjpModal
                form={offPjpForm}
                onChangeForm={onChangeOffPjpForm}
                onClose={onClose}
                onConfirm={onConfirmOffPjp}
            />
        );
    }

    return null;
};
