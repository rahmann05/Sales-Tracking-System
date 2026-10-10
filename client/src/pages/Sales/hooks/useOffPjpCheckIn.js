import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import { useApp } from '../../../context/AppContext';
import {visitResultPolicyError} from '../../../../../shared/visit-outcome.mjs';
import { useState, useRef } from 'react';
import { useGeofence } from '../../../shared/hooks/useGeofence';
import {useAddressLookup} from '../../../shared/hooks/useAddressLookup';

/**
 * useOffPjpCheckIn Hook
 * Single Responsibility: State machine untuk form absen toko luar RJP
 * (identitas outlet, kamera capture, GPS geofence, reverse-geocode auto-fill).
 */
export const useOffPjpCheckIn = ({ isOpen, onSubmit }) => {
    const { settings } = useApp();
    const draft=useFormDraft('off-pjp',{salesResult:{orderAmount:'',productIds:[]},visitOutcome:{purpose:''},outletName:'',customerName:'',phone:'',address:'',notes:'Kunjungan Prospek Toko Baru di Luar RJP',pending:null});
    const salesResult=draft.value.salesResult,setSalesResult=draft.field('salesResult');
    const visitOutcome=draft.value.visitOutcome,setVisitOutcome=draft.field('visitOutcome');
    const outletName=draft.value.outletName,setOutletName=draft.field('outletName');
    const customerName=draft.value.customerName,setCustomerName=draft.field('customerName');
    const phone=draft.value.phone,setPhone=draft.field('phone');
    const address=draft.value.address,setAddress=draft.field('address');
    const notes=draft.value.notes,setNotes=draft.field('notes');
    const [capturedPhoto, setCapturedPhoto] = useState(draft.value.pending?.photoUrl||null);
    const [capturedGps, setCapturedGps] = useState(null);

    const { userLocation } = useGeofence(null, null,50,isOpen&&settings.OFF_PJP_REQUIRE_GPS!==false);
    const {lookupEnabled,lookupError,isAddressAutoFetched,isGeocodingLoading,fetchAddressFromCoords,handleAddressChange,refresh}=useAddressLookup({address,onChange:setAddress,autoLocation:userLocation,autoEnabled:isOpen});
    const handleCapture=(photoUrl,location)=>{
        setCapturedPhoto(photoUrl);const gps=location||userLocation;setCapturedGps(gps);
        if(gps)fetchAddressFromCoords(gps.lat,gps.lng);
    };
    const handleRetake=()=>{setCapturedPhoto(null);setCapturedGps(null);};
    const handleManualRefreshAddress=()=>refresh(userLocation);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const pendingSubmission = useRef(draft.value.pending), sending = useRef(false);
    const [retryPending, setRetryPending] = useState(!!draft.value.pending);
    const handleConfirm = async () => {
        if (sending.current) return;
        if (pendingSubmission.current) {
            sending.current = true; setSaving(true); setError('');
            try { await onSubmit(pendingSubmission.current); pendingSubmission.current = null; setRetryPending(false); draft.clear(); }
            catch (err) {
                if ([400, 403, 422].includes(err.status)) { pendingSubmission.current = null; setRetryPending(false); draft.setValue(prev=>({...prev,pending:null})); }
                setError(err.message);
            }
            finally { sending.current = false; setSaving(false); }
            return;
        }
        const outcomeError=visitResultPolicyError(visitOutcome.purpose?visitOutcome:null,settings,notes);
        if(outcomeError){setError(outcomeError);return;}
        const gps = capturedGps || userLocation;
        if (settings.OFF_PJP_REQUIRE_GPS&&(!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng))) { setError('GPS belum tersedia. Ambil ulang foto.'); return; }
        if (!outletName.trim()) {setError('Isi nama toko terlebih dahulu.');return;}
        if (!customerName.trim()) {setError('Isi nama pelanggan / pemilik toko terlebih dahulu.');return;}
        if (address.trim().length < 5) { setError('Isi alamat toko minimal 5 karakter.'); return; }
        if (settings.OFF_PJP_REQUIRE_PHOTO&&!capturedPhoto) {setError('Ambil foto presensi dari kamera aktif.');return;}

        sending.current = true; setSaving(true); setError('');
        const payload = {
            requestId: crypto.randomUUID(),
            ...(settings.ATTENDANCE_ALLOW_MANUAL_SALES ? { orderAmount: Number(salesResult.orderAmount || 0), productIds: salesResult.productIds } : {}),
            outletName: outletName.trim(),
            customerName: customerName.trim(),
            phone: phone.trim() || '-',
            address: address.trim(),
            reason: notes || 'Kunjungan Luar RJP',
            ...(visitOutcome.purpose?{visitOutcome}:{}),
            photoUrl: capturedPhoto,
            gpsLocation: gps,
        };
        if(!draft.persist(prev=>({...prev,pending:payload}))){sending.current=false;setSaving(false);setError('Browser tidak dapat menyimpan identitas pengajuan. Kosongkan ruang browser lalu coba lagi.');return;}
        pendingSubmission.current = structuredClone(payload);
        setRetryPending(true);
        try { await onSubmit(pendingSubmission.current); pendingSubmission.current = null; setRetryPending(false); draft.clear(); }
        catch (err) {
            if ([400, 403, 422].includes(err.status)) { pendingSubmission.current = null; setRetryPending(false); draft.setValue(prev=>({...prev,pending:null})); }
            setError(err.message);
        } finally { sending.current = false; setSaving(false); }
    };

    return {
        dirty:draft.dirty||!!capturedPhoto,restored:draft.restored,draftNotice:draft.restored||draft.policyChanged?draft.restoreMessage:'',draftError:draft.storageError,
        visitOutcome,setVisitOutcome,
        saving, error, retryPending, salesResult, setSalesResult,        outletName, setOutletName,
        customerName, setCustomerName,
        phone, setPhone,
        address, handleAddressChange,
        isAddressAutoFetched, isGeocodingLoading,lookupEnabled,lookupError,
        notes, setNotes,
        capturedPhoto, userLocation,settings,setCapturedGps,
        handleCapture, handleRetake,
        handleManualRefreshAddress, handleConfirm,
    };
};
