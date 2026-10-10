import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import { registrationDefaults } from "./registrationInitialForm";
import {registrationRevisionFields} from './registrationRevision';
import { useState, useEffect, useCallback, useRef } from 'react';
import { customerRegistrationsApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { manualCodeRequired } from '../../../../../shared/coding.mjs';
// Manages registration drafts, explicit location capture, submission and revisions.
export const useOutletRegistrationForm = onSuccess => {
  const {settings,settingsReady} = useApp();
  const searchVersion = useRef(0);
  const lookupEnabled=settingsReady&&settings.FEATURE_MAPS_MODE==='ACTIVE'&&settings.PLACE_LOOKUP_PROVIDER!=='OFF';
  const lookupRef=useRef(lookupEnabled);lookupRef.current=lookupEnabled;
  const gpsVersion = useRef(0);
  const submissionId=useRef(crypto.randomUUID());
  const [dirty,setDirty]=useState(false);
  const draft=useFormDraft('outlet-registration',()=>registrationDefaults(settings),value=>({...value,latitude:null,longitude:null,photoUrl:null,taxDocumentUrl:null,placeId:null,placeDetails:null,locationEvidence:null}));
  const formData=draft.value,setFormData=draft.setValue;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsError,setGpsError]=useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeSearchError,setPlaceSearchError]=useState('');
  useEffect(()=>{if(!lookupEnabled){searchVersion.current++;setPlaceSearchResults([]);setIsSearchingPlace(false);setPlaceSearchError('');}},[lookupEnabled]);
  const [verifiedPlace, setVerifiedPlace] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');
  useUnsavedNavigation(dirty||draft.restored,isSubmitting);
  useEffect(()=>()=>{gpsVersion.current++;searchVersion.current++;},[]);

  // Apply effective defaults only to a fresh form; never overwrite a restored draft or revision.
  useEffect(() => {
    if(settingsReady&&!dirty&&!draft.restored&&!formData.revisionId)setFormData(prev=>({...prev,...Object.fromEntries(['division','branch','paymentType','termOfPaymentDays','visitIntervalWeeks'].map(key=>[key,registrationDefaults(settings)[key]]))}));
  }, [settingsReady,settings]); // Defaults refresh without replacing entered data.

  // 2. GPS is requested explicitly while the sales rep is at the outlet.
  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Browser ini belum mendukung GPS. Gunakan perangkat yang mendukung lokasi.');return;
    }
    const version=++gpsVersion.current;
    setGpsError('');setIsLocating(true);
    const onLocationSuccess = async pos => {
      if(version!==gpsVersion.current)return;
      setDirty(true);
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));
      searchVersion.current++;
      setVerifiedPlace(null);
      setPlaceSearchResults([]);
      setIsSearchingPlace(false);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        locationEvidence:{source:'GPS',accuracyMeters:pos.coords.accuracy,capturedAt:new Date(pos.timestamp).toISOString()},
        placeId: null,
        placeDetails: null
      }));
      setIsLocating(false);

      // Reverse geocode is optional; device GPS remains usable when lookup is off.
      if(!lookupRef.current)return;
      try {
        const geoRes = await customerRegistrationsApi.reverseGeocode(lat, lng);
        if (geoRes?.data && lookupRef.current && version===gpsVersion.current) {
          setFormData(prev => ({
            ...prev,
            subAreaKecamatan: prev.subAreaKecamatan || geoRes.data.subAreaKecamatan || '',
            kelurahan: prev.kelurahan || geoRes.data.kelurahan || '',
            area: geoRes.data.area || prev.area,
            address: prev.address || geoRes.data.address || ''
          }));
        }
      } catch (e) {
        console.debug('[GPS reverseGeocode notice]:', e.message);
      }
    };
    navigator.geolocation.getCurrentPosition(onLocationSuccess, () => {
      if(version!==gpsVersion.current)return;
      // Fallback with low accuracy if high accuracy times out
      navigator.geolocation.getCurrentPosition(onLocationSuccess, err => {
        if(version!==gpsVersion.current)return;
        setGpsError('Lokasi belum diperoleh. Aktifkan izin lokasi lalu coba Ambil ulang GPS.');
        setIsLocating(false);
      }, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      });
    }, {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 30000
    });
  }, []);

  // 3. Search Google Places API by keyword
  const searchGooglePlaces = async keyword => {
    const version = ++searchVersion.current;
    if (!lookupRef.current || !keyword || keyword.trim().length < 2) {
      setPlaceSearchResults([]);
      return;
    }
    setPlaceSearchError('');
    setIsSearchingPlace(true);
    try {
      const res = await customerRegistrationsApi.searchPlaces(keyword, formData.latitude, formData.longitude);
      if (version === searchVersion.current) setPlaceSearchResults(res?.data || []);
    } catch (err) {
      if (version === searchVersion.current){setPlaceSearchResults([]);setPlaceSearchError(err.message||'Layanan peta belum tersedia. Isi alamat manual.');}
    } finally {
      if (version === searchVersion.current) setIsSearchingPlace(false);
    }
  };

  // 4. Select Google Place: Lock Google Place data, auto-fill address (editable), without changing typed name or GPS
  const handleSelectGooglePlace = place => {
    setDirty(true);
    searchVersion.current++;
    setIsSearchingPlace(false);
    setVerifiedPlace(place);
    setPlaceSearchResults([]);
    setFormData(prev => ({
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
      placeDetails: place
    }));
  };
  const handleUnlockGooglePlace = () => {
    setDirty(true);
    setVerifiedPlace(null);
    setFormData(prev => ({
      ...prev,
      placeId: null,
      placeDetails: null
    }));
  };
  const updateField = (field, value) => {
    setDirty(true);
    if (['name', 'latitude', 'longitude'].includes(field)) {
      searchVersion.current++;
      setPlaceSearchResults([]);
      setIsSearchingPlace(false);
      handleUnlockGooglePlace();
    }
    setFormData(prev => ({
      ...prev,
      submissionRequestId:prev.submissionRequestId || submissionId.current,
      [field]: value
    }));
  };
  const handlePhotoUpload = e => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('photoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleTaxDocUpload = e => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('taxDocumentUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const toggleDay = day => {
    setDirty(true);
    setFormData(prev => {
      const current = prev.visitDays || [];
      const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
      return {
        ...prev,
        visitDays: updated.length > 0 ? updated : [day]
      };
    });
  };
  const resetForm = () => {
    submissionId.current=crypto.randomUUID();
    gpsVersion.current++;
    setDirty(false);setGpsError('');setIsLocating(false);
    searchVersion.current++;
    setIsSearchingPlace(false);
    setFormData(prev=>({...registrationDefaults(settings),division:prev.division,divisionName:prev.divisionName,divisionId:prev.divisionId}));
    draft.clear();
    setVerifiedPlace(null);
    setPlaceSearchResults([]);
    setSubmitError('');
    setSubmitSuccess(null);
  };
  const startRevision=item=>{
    submissionId.current=crypto.randomUUID();setSubmitError('');setSubmitSuccess(null);setDirty(true);
    setFormData(registrationRevisionFields(item,submissionId.current));
    setVerifiedPlace(item.placeDetails || null);
  };
  const submitForm = async e => {
    if (e) e.preventDefault();
    if(isSubmitting)return;
    setSubmitError('');
    setSubmitSuccess(null);

    // Detailed Validation & Helpful Error Messages
    const validationErrors = [];
    if(formData.latitude==null||formData.longitude==null||!Number.isFinite(Number(formData.latitude))||!Number.isFinite(Number(formData.longitude))||Math.abs(Number(formData.latitude))>90||Math.abs(Number(formData.longitude))>180)validationErrors.push('Ambil lokasi GPS outlet sebelum mengajukan.');
    if (manualCodeRequired('NOO', settings) && !formData.registrationCode?.trim()) validationErrors.push('Kode pengajuan NOO wajib diisi manual.');
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push('Nama Outlet wajib diisi minimal 2 karakter.');
    }
    if (!formData.address || formData.address.trim().length < 3) {
      validationErrors.push('Alamat Outlet wajib diisi.');
    }
    if (settings.CUSTOMER_REG_REQUIRE_PHOTO && !formData.photoUrl) {
      validationErrors.push('Foto fisik outlet wajib diambil langsung dari kamera.');
    }
    if (settings.CUSTOMER_REG_REQUIRE_TAX_DOCUMENT && !formData.taxDocumentUrl) {
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
        requestId:formData.submissionRequestId || submissionId.current,
        visitDays: Array.isArray(formData.visitDays) ? formData.visitDays.join(',') : formData.visitDays,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        termOfPaymentDays:formData.paymentType==='TOP'?Number(formData.termOfPaymentDays):0
      };
      const res = formData.revisionId?await customerRegistrationsApi.revise(formData.revisionId,{...payload,updatedAt:formData.revisionUpdatedAt,revisionReason:formData.revisionReason}):await customerRegistrationsApi.create(payload);
      resetForm();
      setSubmitSuccess(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      let message = err.message || 'Gagal menyimpan pengajuan pendaftaran outlet.';
      if (err.errors && Array.isArray(err.errors)) {
        message = err.errors.map(e => e.message || e).join(' • ');
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    formData,
    draftRestored:draft.restored||draft.policyChanged,draftNotice:draft.restoreMessage,draftError:draft.storageError,
    updateField,
    isSubmitting,
    isLocating,gpsError,
    isSearchingPlace,placeSearchError,
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
    submitForm,startRevision
  };
};
