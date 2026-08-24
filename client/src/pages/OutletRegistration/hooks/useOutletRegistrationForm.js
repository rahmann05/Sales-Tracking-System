import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi, configApi } from '../../../services/api';

const INITIAL_FORM = {
  division: 'BELFOODS',
  branch: 'PADALARANG',
  name: '',
  ownerName: '',
  address: '',
  address2: '',
  address3: '',
  phone: '',
  locationType: 'PINGGIR_JALAN',
  mappingLocation: '',

  taxType: 'NON_PKP',
  taxNumber: '',
  taxName: '',
  taxAddress: '',
  taxDocumentUrl: '',

  area: 'CIMAHI',
  subAreaKecamatan: '',
  kelurahan: '',
  city: 'CIMAHI',
  latitude: -6.8722,
  longitude: 107.5422,
  photoUrl: '',

  channel: 'GENERAL_TRADE',
  subChannel: 'TOKO_RETAIL',
  channelTier: 'BRONZE_C',

  paymentType: 'CASH',
  cashMethod: 'TUNAI',
  termOfPaymentDays: 0,
  bankAccountInfo: '',

  visitWeekSchedule: 'ALL_WEEK',
  visitDays: ['SENIN'],

  outletKnownBy: '',
};

/**
 * useOutletRegistrationForm Hook
 * Single Responsibility: Manage form state, automatic GPS/Google Places autofill, lock/unlock mechanics, and submission.
 */
export const useOutletRegistrationForm = (onSuccess) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [verifiedPlace, setVerifiedPlace] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // 1. Load active division from database SystemConfig
  useEffect(() => {
    const fetchActiveDivision = async () => {
      try {
        const res = await configApi.getByKey('ACTIVE_DIVISION');
        if (res?.data) {
          const divVal = typeof res.data === 'string' ? res.data : res.data.value || 'BELFOODS';
          setFormData((prev) => ({ ...prev, division: divVal }));
        }
      } catch (err) {
        console.warn('[useOutletRegistrationForm] Failed to load ACTIVE_DIVISION config:', err);
      }
    };
    fetchActiveDivision();
  }, []);

  // 2. Auto-detect GPS on initial load
  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    setIsLocating(true);

    const onLocationSuccess = async (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));

      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      setIsLocating(false);

      // Reverse geocode to autofill subArea/kelurahan/area
      try {
        const geoRes = await customerRegistrationsApi.reverseGeocode(lat, lng);
        if (geoRes?.data) {
          setFormData((prev) => ({
            ...prev,
            subAreaKecamatan: prev.subAreaKecamatan || geoRes.data.subAreaKecamatan || '',
            kelurahan: prev.kelurahan || geoRes.data.kelurahan || '',
            area: geoRes.data.area || prev.area,
            address: prev.address || geoRes.data.address || '',
          }));
        }
      } catch (e) {
        console.debug('[GPS reverseGeocode notice]:', e.message);
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      () => {
        // Fallback with low accuracy if high accuracy times out
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          (err) => {
            console.debug('[GPS notice]:', err.message);
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    handleDetectGPS();
  }, [handleDetectGPS]);

  // 3. Search Google Places API by keyword
  const searchGooglePlaces = async (keyword) => {
    if (!keyword || keyword.trim().length < 2) {
      setPlaceSearchResults([]);
      return;
    }
    setIsSearchingPlace(true);
    try {
      const res = await customerRegistrationsApi.searchPlaces(
        keyword,
        formData.latitude,
        formData.longitude
      );
      setPlaceSearchResults(res?.data || []);
    } catch (err) {
      console.warn('[searchGooglePlaces error]:', err.message);
      setPlaceSearchResults([]);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  // 4. Select Google Place: Lock Google Place data, auto-fill address (editable), without changing typed name or GPS
  const handleSelectGooglePlace = (place) => {
    setVerifiedPlace(place);
    setPlaceSearchResults([]);

    setFormData((prev) => ({
      ...prev,
      // Nama toko diinput TIDAK dirubah (tetap seperti yang diketik user)
      name: prev.name,
      // Alamat otomatis auto-fill dari data Google API, tapi sales bebas mengeditnya
      address: place.address || prev.address,
      // Titik koordinat fisik saat ini tidak boleh dirubah oleh API Place
      latitude: prev.latitude,
      longitude: prev.longitude,
      area: place.area || prev.area,
      subAreaKecamatan: place.subAreaKecamatan || prev.subAreaKecamatan,
      kelurahan: place.kelurahan || prev.kelurahan,
      // Kunci data Google Place API ke database
      placeId: place.placeId || null,
      placeDetails: place,
    }));
  };

  const handleUnlockGooglePlace = () => {
    setVerifiedPlace(null);
    setFormData((prev) => ({
      ...prev,
      placeId: null,
      placeDetails: null,
    }));
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('photoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTaxDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('taxDocumentUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const current = prev.visitDays || [];
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return { ...prev, visitDays: updated.length > 0 ? updated : [day] };
    });
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setVerifiedPlace(null);
    setPlaceSearchResults([]);
    setSubmitError('');
    setSubmitSuccess(null);
    handleDetectGPS();
  };

  const submitForm = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(null);

    // Detailed Validation & Helpful Error Messages
    const validationErrors = [];
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push('Nama Outlet wajib diisi minimal 2 karakter.');
    }
    if (!formData.address || formData.address.trim().length < 3) {
      validationErrors.push('Alamat Outlet wajib diisi.');
    }
    if (!formData.photoUrl) {
      validationErrors.push('Foto fisik outlet wajib diambil langsung dari kamera.');
    }
    if (!formData.taxDocumentUrl) {
      const docName = formData.taxType === 'PKP' ? 'NPWP' : 'KTP';
      validationErrors.push(`Foto dokumen ${docName} wajib diambil langsung dari kamera.`);
    }
    if (!formData.visitDays || formData.visitDays.length === 0) {
      validationErrors.push('Pilih minimal satu hari rencana kunjungan (PJP).');
    }

    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join(' • '));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        visitDays: Array.isArray(formData.visitDays)
          ? formData.visitDays.join(',')
          : formData.visitDays,
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
        termOfPaymentDays: Number(formData.termOfPaymentDays) || 0,
      };

      const res = await customerRegistrationsApi.create(payload);
      setSubmitSuccess(res.data);
      resetForm();
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      let message = err.message || 'Gagal menyimpan pengajuan pendaftaran outlet.';
      if (err.errors && Array.isArray(err.errors)) {
        message = err.errors.map((e) => e.message || e).join(' • ');
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    updateField,
    isSubmitting,
    isLocating,
    isSearchingPlace,
    placeSearchResults,
    verifiedPlace,
    submitSuccess,
    submitError,
    handleDetectGPS,
    searchGooglePlaces,
    handleSelectGooglePlace,
    handleUnlockGooglePlace,
    handlePhotoUpload,
    handleTaxDocUpload,
    toggleDay,
    resetForm,
    submitForm,
  };
};
