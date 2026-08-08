import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeofence } from '../../../hooks/useGeofence';
import { getDetailedAddressFromGps } from '../../../services/reverseGeocodeService';

const FALLBACK_GPS = {
    lat: -6.8723,
    lng: 107.5432,
    accuracy: 12,
    timestamp: new Date().toLocaleTimeString(),
};

const FALLBACK_ADDRESS =
    'Jl. Jend. H. Amir Machmud No. 42, RT 03 / RW 08, Kel. Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi 40522';

/**
 * useOffPjpCheckIn Hook
 * Single Responsibility: State machine untuk form absen toko luar RJP
 * (identitas outlet, kamera capture, GPS geofence, reverse-geocode auto-fill).
 */
export const useOffPjpCheckIn = ({ isOpen, onSubmit }) => {
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

    const handleConfirm = () => {
        if (!outletName.trim()) return alert('Harap isi Nama Toko / Outlet terlebih dahulu.');
        if (!customerName.trim()) return alert('Harap isi Nama Customer / Pemilik Toko terlebih dahulu.');
        if (!capturedPhoto) return alert('Harap jepret foto presensi terlebih dahulu menggunakan kamera aktif.');

        onSubmit({
            outletName: outletName.trim(),
            customerName: customerName.trim(),
            phone: phone.trim() || '-',
            address: address.trim() || FALLBACK_ADDRESS,
            reason: notes || 'Kunjungan Luar RJP',
            photoUrl: capturedPhoto,
            gpsLocation: capturedGps || userLocation || FALLBACK_GPS,
        });
    };

    return {
        outletName, setOutletName,
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
