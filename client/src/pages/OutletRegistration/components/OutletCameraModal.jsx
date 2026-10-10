import React from 'react';
import {RegistrationPhotoDialog} from './RegistrationPhotoDialog';
export function OutletCameraModal({isOpen,onClose,onCapture,outletName,latitude,longitude,division='BELFOODS',policyValues}){
 return isOpen?<RegistrationPhotoDialog title="Foto toko" onClose={onClose} onCapture={onCapture} outletName={outletName} latitude={latitude} longitude={longitude} division={division} policyValues={policyValues}/>:null;
}
