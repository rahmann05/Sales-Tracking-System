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
    const { settings } = useApp();
    const [salesResult, setSalesResult] = useState({ orderAmount: '', productIds: [] });
    const [visitOutcome,setVisitOutcome]=useState({purpose:''});
    const [outletName, setOutletName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isAddressAutoFetched, setIsAddressAutoFetched] = useState(false);
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
    const [notes, setNotes] = useState('Kunjungan Prospek Toko Baru di Luar RJP');
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [capturedGps, setCapturedGps] = useState(null);

    const { userLocation, refreshGpsLocation } = useGeofence(null, null);
    const lastGeocodedCoords = useRef({ lat: null, lng: null });

    const fetchAddressFromCoords = useCallback(async (lat, lng, force = false) => {
        if (!lat || !lng) return;
        if (!force && lastGeocodedCoords.current.lat === lat && lastGeocodedCoords.current.lng === lng) return;

        lastGeocodedCoords.current = { lat, lng };
        setIsGeocodingLoading(true);
        try {
            const detailedAddress = await getDetailedAddressFromGps(lat, lng);
            if (detailedAddress) {
                setAddress(detailedAddress);
                setIsAddressAutoFetched(true);
            }
        } catch (err) {
            console.warn('Detailed geocode error:', err);
        } finally {
            setIsGeocodingLoading(false);
        }
    }, []);

    // Auto-fetch alamat saat modal dibuka
    useEffect(() => {
        if (!isOpen || !navigator.geolocation) return;
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
        if (userLocation?.lat && userLocation?.lng) {
            fetchAddressFromCoords(userLocation.lat, userLocation.lng, true);
        } else {
            refreshGpsLocation();
        }
    };

    const handleAddressChange = (value) => {
        setAddress(value);
        setIsAddressAutoFetched(false);
    };

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const pendingSubmission = useRef(null), sending = useRef(false);
    const [retryPending, setRetryPending] = useState(false);
    const handleConfirm = async () => {
        if (sending.current) return;
        if (pendingSubmission.current) {
            sending.current = true; setSaving(true); setError('');
            try { await onSubmit(pendingSubmission.current); pendingSubmission.current = null; setRetryPending(false); }
            catch (err) {
                if ([400, 403, 422].includes(err.status)) { pendingSubmission.current = null; setRetryPending(false); }
                setError(err.message);
            }
            finally { sending.current = false; setSaving(false); }
            return;
        }
        const outcomeError=visitOutcome.purpose&&visitOutcomeError(visitOutcome);
        if(outcomeError){setError(outcomeError);return;}
        const gps = capturedGps || userLocation;
        if (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) { setError('GPS belum tersedia. Ambil ulang foto.'); return; }
        if (!outletName.trim()) return alert('Harap isi Nama Toko / Outlet terlebih dahulu.');
        if (!customerName.trim()) return alert('Harap isi Nama Customer / Pemilik Toko terlebih dahulu.');
        if (address.trim().length < 5) { setError('Isi alamat toko minimal 5 karakter.'); return; }
        if (!capturedPhoto) return alert('Harap jepret foto presensi terlebih dahulu menggunakan kamera aktif.');

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
        pendingSubmission.current = structuredClone(payload);
        setRetryPending(true);
        try { await onSubmit(pendingSubmission.current); pendingSubmission.current = null; setRetryPending(false); }
        catch (err) {
            if ([400, 403, 422].includes(err.status)) { pendingSubmission.current = null; setRetryPending(false); }
            setError(err.message);
        } finally { sending.current = false; setSaving(false); }
    };

    return {
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
