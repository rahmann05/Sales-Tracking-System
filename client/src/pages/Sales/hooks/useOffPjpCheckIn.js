import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {writeDraft} from '../../../../../shared/form-draft.mjs';
import { useApp } from '../../../context/AppContext';
import {visitOutcomeError} from '../../../../../shared/visit-outcome.mjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeofence } from '../../../shared/hooks/useGeofence';
import { getDetailedAddressFromGps } from '../../../services/reverseGeocodeService';

/**
 * useOffPjpCheckIn Hook
 * Single Responsibility: State machine untuk form absen toko luar RJP
 * (identitas outlet, kamera capture, GPS geofence, reverse-geocode auto-fill).
 */
export const useOffPjpCheckIn = ({ isOpen, onSubmit }) => {
    const { settings,user } = useApp();
    const draft=useFormDraft('off-pjp',{salesResult:{orderAmount:'',productIds:[]},visitOutcome:{purpose:''},outletName:'',customerName:'',phone:'',address:'',notes:'Kunjungan Prospek Toko Baru di Luar RJP',pending:null});
    const salesResult=draft.value.salesResult,setSalesResult=draft.field('salesResult');
    const visitOutcome=draft.value.visitOutcome,setVisitOutcome=draft.field('visitOutcome');
    const outletName=draft.value.outletName,setOutletName=draft.field('outletName');
    const customerName=draft.value.customerName,setCustomerName=draft.field('customerName');
    const phone=draft.value.phone,setPhone=draft.field('phone');
    const address=draft.value.address,setAddress=draft.field('address');
    const [isAddressAutoFetched, setIsAddressAutoFetched] = useState(false);
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
    const notes=draft.value.notes,setNotes=draft.field('notes');
    const [capturedPhoto, setCapturedPhoto] = useState(draft.value.pending?.photoUrl||null);
    const [capturedGps, setCapturedGps] = useState(null);

    const { userLocation, refreshGpsLocation } = useGeofence(null, null);
    const manualAddress=useRef(Boolean(address)),addressFlight=useRef(0);
    const lastGeocodedCoords = useRef({ lat: null, lng: null });

    const fetchAddressFromCoords = useCallback(async (lat, lng, force = false) => {
        if (!lat || !lng) return;
        if (!force && lastGeocodedCoords.current.lat === lat && lastGeocodedCoords.current.lng === lng) return;

        lastGeocodedCoords.current = { lat, lng };
        const version=++addressFlight.current;setIsGeocodingLoading(true);
        try {
            const detailedAddress = await getDetailedAddressFromGps(lat, lng);
            if (detailedAddress&&version===addressFlight.current&&!manualAddress.current) {
                setAddress(detailedAddress);
                setIsAddressAutoFetched(true);
            }
        } catch (err) {
            console.warn('Detailed geocode error:', err);
        } finally {
            if(version===addressFlight.current)setIsGeocodingLoading(false);
        }
    }, []);

    // Auto-fetch alamat saat modal dibuka
    useEffect(() => {
        if (!isOpen || !navigator.geolocation || manualAddress.current) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude),
            () => {
                if (userLocation?.lat && userLocation?.lng) {
                    fetchAddressFromCoords(userLocation.lat, userLocation.lng);
                }
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, [isOpen, fetchAddressFromCoords]); // eslint-disable-line react-hooks/exhaustive-deps

    // Ikuti perubahan userLocation dari geofence hook
    useEffect(() => {
        if (userLocation?.lat && userLocation?.lng && (!address || isAddressAutoFetched)) {
            fetchAddressFromCoords(userLocation.lat, userLocation.lng);
        }
    }, [userLocation, address, isAddressAutoFetched, fetchAddressFromCoords]);

    const handleCapture = (photoUrl, location) => {
        setCapturedPhoto(photoUrl);
        const effectiveLocation = location || userLocation;
        setCapturedGps(effectiveLocation);
        if (effectiveLocation?.lat && effectiveLocation?.lng && (!address || isAddressAutoFetched)) {
            fetchAddressFromCoords(effectiveLocation.lat, effectiveLocation.lng, true);
        }
    };

    const handleRetake = () => setCapturedPhoto(null);

    const handleManualRefreshAddress = () => {
        manualAddress.current=false;
        if (userLocation?.lat && userLocation?.lng) {
            fetchAddressFromCoords(userLocation.lat, userLocation.lng, true);
        } else {
            refreshGpsLocation();
        }
    };

    const handleAddressChange = (value) => {
        manualAddress.current=true;addressFlight.current++;setIsGeocodingLoading(false);
        setAddress(value);
        setIsAddressAutoFetched(false);
    };

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
        const outcomeError=visitOutcome.purpose&&visitOutcomeError(visitOutcome);
        if(outcomeError){setError(outcomeError);return;}
        const gps = capturedGps || userLocation;
        if (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) { setError('GPS belum tersedia. Ambil ulang foto.'); return; }
        if (!outletName.trim()) {setError('Isi nama toko terlebih dahulu.');return;}
        if (!customerName.trim()) {setError('Isi nama pelanggan / pemilik toko terlebih dahulu.');return;}
        if (address.trim().length < 5) { setError('Isi alamat toko minimal 5 karakter.'); return; }
        if (!capturedPhoto) {setError('Ambil foto presensi dari kamera aktif.');return;}

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
        if(!writeDraft(()=>sessionStorage,`form-draft:${user.id}:off-pjp`,{...draft.value,pending:payload})){sending.current=false;setSaving(false);setError('Browser tidak dapat menyimpan identitas pengajuan. Jangan kirim sebelum ruang sesi tersedia.');return;}
        draft.setValue(prev=>({...prev,pending:payload}));
        pendingSubmission.current = structuredClone(payload);
        setRetryPending(true);
        try { await onSubmit(pendingSubmission.current); pendingSubmission.current = null; setRetryPending(false); draft.clear(); }
        catch (err) {
            if ([400, 403, 422].includes(err.status)) { pendingSubmission.current = null; setRetryPending(false); draft.setValue(prev=>({...prev,pending:null})); }
            setError(err.message);
        } finally { sending.current = false; setSaving(false); }
    };

    return {
        dirty:draft.dirty||!!capturedPhoto,restored:draft.restored,draftError:draft.storageError,
        visitOutcome,setVisitOutcome,
        saving, error, retryPending, salesResult, setSalesResult,        outletName, setOutletName,
        customerName, setCustomerName,
        phone, setPhone,
        address, handleAddressChange,
        isAddressAutoFetched, isGeocodingLoading,
        notes, setNotes,
        capturedPhoto, userLocation,
        handleCapture, handleRetake,
        handleManualRefreshAddress, handleConfirm,
    };
};
