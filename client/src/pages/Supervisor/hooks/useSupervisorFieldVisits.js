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
    const { settings, user } = useApp();
    const submitting = useRef(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [spvMode, setSpvMode] = useState(SPV_MODES.JOINT_VISIT);
    const [selectedSales, setSelectedSales] = useState('');
    
    // Auto-select first sales when options load
    useEffect(() => {
      if (salesOptions.length > 0 && !selectedSales) {
          setSelectedSales(salesOptions[0].value);
      }
    }, [salesOptions, selectedSales]);

    const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN' | 'AUDIT' | 'ABSEN_OUT' | 'OFF_PJP'
    const [selectedStop, setSelectedStop] = useState(null);
    const [inputNotes, setInputNotes] = useState('');
    const [checklist, setChecklist] = useState(DEFAULT_SPV_CHECKLIST);
    const [offPjpForm, setOffPjpForm] = useState({ outletName: '', address: '', owner: '', reason: '' });

    const [spvVisitRecords, setSpvVisitRecords] = useState({});

    const spvStops=useMemo(()=>todayPjps.filter(p=>spvMode!=='JOINT_VISIT'||p.user?.id===selectedSales).flatMap(p=>(p.stops||[]).map((s,i)=>mapStop(s,p,i,spvMode))),[todayPjps,spvMode,selectedSales]);
    const [followUp,setFollowUp]=useState({ownerId:'',dueDate:'',note:''});
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
        setFollowUp(existing?.followUp||{ownerId:stop.salesId||'',dueDate:'',note:''});
        setChecklist(existing?.checklist || DEFAULT_SPV_CHECKLIST);
        setActiveModal('AUDIT');
    };

    const saveAudit = () => selectedStop && submit({ action: 'AUDIT', stopId: selectedStop.id, notes: inputNotes, checklist, ...(followUp.note.trim()?{followUp:{ownerId:followUp.ownerId,dueDate:followUp.dueDate,note:followUp.note}}:{}) });

    const openAbsenOut = (stop) => {
        setSelectedStop(stop);
        setActiveModal('ABSEN_OUT');
    };

    const confirmAbsenOut = () => selectedStop && submit({ action: 'VISIT_OUT', stopId: selectedStop.id });

    const openOffPjp = () => {
        setOffPjpForm({ outletName: '', address: '', owner: '', reason: '' });
        setActiveModal('OFF_PJP');
    };

    const confirmOffPjp = () => submit({ action: 'OFF_PJP', outletName: offPjpForm.outletName, notes: [offPjpForm.reason, offPjpForm.address, offPjpForm.owner].filter(Boolean).join(' · ') });

    const closeModal = () => { if (!submitting.current) setActiveModal(null); };

    const completedCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'COMPLETED').length;
    const inVisitCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'IN_VISIT').length;

    return {
        saving, error, followUp,setFollowUp,
        spvMode, setSpvMode,
        selectedSales, setSelectedSales,
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
