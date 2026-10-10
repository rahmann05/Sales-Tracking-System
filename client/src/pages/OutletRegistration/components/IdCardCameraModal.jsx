import React from 'react';
import {RegistrationPhotoDialog} from './RegistrationPhotoDialog';
export function IdCardCameraModal({isOpen,onClose,onCapture,cardType='KTP',outletName='',division='BELFOODS',policyValues}){
 return isOpen?<RegistrationPhotoDialog title={'Foto dokumen '+cardType} onClose={onClose} onCapture={onCapture} outletName={cardType+' · '+(outletName||'Outlet baru')} division={division} policyValues={policyValues} document/>:null;
}
