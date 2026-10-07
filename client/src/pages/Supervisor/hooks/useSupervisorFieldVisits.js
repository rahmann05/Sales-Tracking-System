import { useApp } from '../../../context/AppContext';
import { staffAttendanceApi } from '../../../services/api';
import { useState, useMemo, useEffect, useRef } from 'react';
import { notifySuccess } from '../../../services/notificationService';
import {
    SPV_MODES,
    DEFAULT_SPV_CHECKLIST,
} from '../../../constants/supervisor';

const timeWib = value => value ? new Date(value).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB' : null;
const mapRecord = r => ({ ...r, status: r.checkOutAt ? 'COMPLETED' : 'IN_VISIT', checkInTime: timeWib(r.checkInAt), checkOutTime: timeWib(r.checkOutAt) });

const mapStop=(s,p,i,mode)=>({id:s.id,latitude:s.outlet?.latitude,longitude:s.outlet?.longitude,sequence:i+1,outletName:s.outlet?.name||'—',owner:s.outlet?.ownerName||'—',phone:s.outlet?.phone||'—',address:s.outlet?.address||'—',radiusMeters:s.outlet?.radiusMeters||50,currentDistance:null,spvVisitType:mode==='JOINT_VISIT'?'Pendampingan sales':mode==='PRIORITY_AUDIT'?'Audit toko pilihan':'Inspeksi toko pilihan',assignedSales:p.user?.name||'—',salesId:p.userId});
export const useSupervisorFieldVisits = (todayPjps = [], salesOptions = []) => {
    const { user } = useApp();
    const submitting = useRef(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [spvMode, setSpvMode] = useState(SPV_MODES.JOINT_VISIT);
    const [selectedSales, setSelectedSales] = useState('');
    
    const [selectedTargetStopId, setSelectedTargetStopId] = useState('');
    
    // Auto-select first sales when options load
    useEffect(() => {
      if (salesOptions.length > 0 && !selectedSales) {
          setSelectedSales(salesOptions[0].value);
      }
      setSelectedTargetStopId('');
    }, [salesOptions, selectedSales]);

    const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN' | 'AUDIT' | 'ABSEN_OUT' | 'OFF_PJP'
    const [selectedStop, setSelectedStop] = useState(null);
    const [inputNotes, setInputNotes] = useState('');
    const [checklist, setChecklist] = useState(DEFAULT_SPV_CHECKLIST);
    const [offPjpForm, setOffPjpForm] = useState({ outletName: '', address: '', owner: '', reason: '' });

    const [spvVisitRecords, setSpvVisitRecords] = useState({});

    const spvStops=useMemo(()=>todayPjps.filter(p=>p.user?.id===selectedSales).flatMap(p=>(p.stops||[]).map((s,i)=>mapStop(s,p,i,spvMode))),[todayPjps,spvMode,selectedSales]);

    useEffect(() => {
      let active = true;
      staffAttendanceApi.getToday().then(res => {
        if (active) setSpvVisitRecords(Object.fromEntries(res.data.filter(r => r.kind === 'VISIT').map(r => [r.activityKey, mapRecord(r)])));
      }).catch(err => { if (active) setError(err.message); });
      return () => { active = false; };
    }, [user?.id]);

    const submit = async data => {
      if (submitting.current) return;
      submitting.current = true; setSaving(true); setError('');
      try {
        const res = await staffAttendanceApi.record(data);
        if (res.data.kind === 'VISIT') setSpvVisitRecords(prev => ({ ...prev, [res.data.activityKey]: mapRecord(res.data) }));
        setActiveModal(null);
        notifySuccess('Catatan supervisi berhasil disimpan.');
      } catch (err) { setError(err.message); }
      finally { submitting.current = false; setSaving(false); }
    };

    const openAbsenIn = (stop) => {
        setSelectedStop(stop);
        setInputNotes('');
        setActiveModal('ABSEN_IN');
    };

    const confirmAbsenIn = payload => selectedStop && submit({ action: 'VISIT_IN', visitMode:spvMode, stopId: selectedStop.id, notes: inputNotes, ...payload });

    const openAudit = (stop) => {
        setSelectedStop(stop);
        const existing = spvVisitRecords[stop.id];
        setInputNotes(existing?.notes || '');

        setChecklist(existing?.checklist || DEFAULT_SPV_CHECKLIST);
        setActiveModal('AUDIT');
    };

    const saveAudit = () => selectedStop && submit({ action: 'AUDIT', stopId: selectedStop.id, notes: inputNotes, checklist });

    const openAbsenOut = (stop) => {
        setSelectedStop(stop);
        setActiveModal('ABSEN_OUT');
    };

    const confirmAbsenOut = () => selectedStop && submit({ action: 'VISIT_OUT', stopId: selectedStop.id });

    const openOffPjp = () => {
        setOffPjpForm({ outletName: '', address: '', owner: '', reason: '' });
        setActiveModal('OFF_PJP');
    };

    const confirmOffPjp = (payload) => {
      const data = payload || offPjpForm;
      const outlet = (data.outletName || offPjpForm.outletName || '').trim();
      const notesParts = [
        data.reason || offPjpForm.reason,
        data.address || offPjpForm.address,
        data.owner || offPjpForm.owner,
        data.phone ? `Telp: ${data.phone}` : null
      ].filter(Boolean);
      const notes = notesParts.join(' · ') || 'Kunjungan Supervisi Luar RJP';

      return submit({
        action: 'OFF_PJP',
        outletName: outlet,
        notes,
        latitude: data.latitude,
        longitude: data.longitude,
        photoUrl: data.photoUrl,
        visitMode: data.visitMode || spvMode,
        accompaniedSalesId: (data.visitMode || spvMode) === 'JOINT_VISIT' ? selectedSales : undefined
      });
    };

    const closeModal = () => { if (!submitting.current) setActiveModal(null); };

    const completedCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'COMPLETED').length;
    const inVisitCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'IN_VISIT').length;

    return {
        saving, error,
        spvMode, setSpvMode,
        selectedSales, setSelectedSales,
        selectedTargetStopId, setSelectedTargetStopId,
        spvStops, spvVisitRecords,
        activeModal, selectedStop, closeModal,
        inputNotes, setInputNotes,
        checklist, setChecklist,
        offPjpForm, setOffPjpForm,
        completedCount, inVisitCount,
        openAbsenIn, confirmAbsenIn,
        openAudit, saveAudit,
        openAbsenOut, confirmAbsenOut,
        openOffPjp, confirmOffPjp,
    };
};
