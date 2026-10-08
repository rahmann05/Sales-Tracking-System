import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {notifySuccess} from '../../services/notificationService';
import { AdminApprovalView } from './AdminApprovalView';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { ordersApi, outletsApi, absensiApi, collectPages } from '../../services/api';
import { mapServerOrder } from '../../utils/orderMapper';
import { mapServerUnlockRequest } from '../../utils/incidentMapper';

/**
 * AdminApprovalPage Component (Container Page for Admin Order & Unlock Approvals)
 * Single Responsibility: Admin workspace for order approval and unlock requests.
 */
export const AdminApprovalPage = ({
  onGoBack,
  ordersOnly=false,hideHeading=false,
  embedded = false
}) => {
  const {
    orders = [],
    setOrders,
    handleAdminOrderDecision,
    incidents = [],
    setIncidents,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    setActiveTab,
    salesList = []
  } = useApp();
  const [orderFilter, setOrderFilter] = useWorkspaceState('orderStatus','PENDING'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [selectedSales, setSelectedSales] = useWorkspaceState('orderSales','ALL'); // 'ALL' | <salesName>
  const [loading, setLoading] = useState(false);
  const [loadError,setLoadError]=useState('');
  const [manualPendingCount, setManualPendingCount] = useState(0);
  const unlockRequests = (incidents || []).filter(i => i.type === 'UNLOCK_REQUEST');
  const pendingUnlockCount = unlockRequests.filter(r => r.status === 'PENDING').length;
  const salesOptions = useMemo(() => {
    const names = new Set();
    orders.forEach(o => {
      const n = o.salesName?.trim();
      if (n) names.add(n);
    });
    salesList.forEach(s => {
      const n = s.name?.trim();
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [orders, salesList]);
  const ordersBySales = useMemo(() => {
    if (selectedSales === 'ALL') return orders;
    return orders.filter(o => (o.salesName || '').trim().toLowerCase() === selectedSales.trim().toLowerCase());
  }, [orders, selectedSales]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING'), [orders]);
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'APPROVED'), [orders]);
  const pendingOrdersBySales = useMemo(() => ordersBySales.filter(o => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING'), [ordersBySales]);
  const approvedOrdersBySales = useMemo(() => ordersBySales.filter(o => o.status === 'APPROVED'), [ordersBySales]);
  const loadApprovalData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, unlockRes, manualPjpRes, manualOffRes] = await Promise.all([collectPages(ordersApi.getAllOrders).catch(() => null), outletsApi.getUnlockRequests().catch(() => null), absensiApi.getManualSales({
        kind: 'PJP',
        status: 'PENDING',
        limit: 1
      }).catch(() => null), absensiApi.getManualSales({
        kind: 'OFF_PJP',
        status: 'PENDING',
        limit: 1
      }).catch(() => null)]);
      setLoadError([!ordersRes&&'order',!unlockRes&&'izin presensi',(!manualPjpRes||!manualOffRes)&&'presensi manual'].filter(Boolean).length?'Sebagian data gagal dimuat: '+[!ordersRes&&'order',!unlockRes&&'izin presensi',(!manualPjpRes||!manualOffRes)&&'presensi manual'].filter(Boolean).join(', ')+'.':'');
      if (ordersRes?.data && setOrders) {
        const raw = Array.isArray(ordersRes.data) ? ordersRes.data : Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : ordersRes.data.items || [];
        setOrders(raw.map(mapServerOrder));
      }
      if (unlockRes && setIncidents) {
        const rawUnlocks = Array.isArray(unlockRes.data) ? unlockRes.data : Array.isArray(unlockRes.data?.data) ? unlockRes.data.data : [];
        const mapped = rawUnlocks.map(mapServerUnlockRequest);
        setIncidents(prev => {
          const nonUnlocks = prev.filter(i => i.type !== 'UNLOCK_REQUEST');
          return [...nonUnlocks, ...mapped];
        });
      }
      const pjpTotal = Number(manualPjpRes?.data?.total || manualPjpRes?.total || 0);
      const offTotal = Number(manualOffRes?.data?.total || manualOffRes?.total || 0);
      if(manualPjpRes&&manualOffRes)setManualPendingCount(pjpTotal + offTotal);
    } catch (err) {
      console.warn('Failed to load approval data:', err);
    } finally {
      setLoading(false);
    }
  }, [setOrders, setIncidents]);
  useEffect(() => {
    loadApprovalData();
    window.addEventListener('operational-data-changed', loadApprovalData);
    return () => {
      window.removeEventListener('operational-data-changed', loadApprovalData);
    };
  }, [loadApprovalData]);
  const handleDecision = async payload => {
    const success = await handleAdminOrderDecision(payload);
    if (success === false) return false;
    if (payload.approved) {
      notifySuccess('Order berhasil disetujui.');
    } else {
      notifySuccess('Order ditolak.');
    }
    loadApprovalData();
    return true;
  };
  const handleApproveUnlock = async (requestId, stopId) => {
    const success = await handleApproveUnlockRequest(requestId, stopId);
    if (success === false) return;
    alert('Permintaan Unlock disetujui! Pengecualian presensi diberikan kepada pemohon sesuai masa berlaku.');
    loadApprovalData();
  };
  const handleRejectUnlock = async requestId => {
    const success = await handleRejectUnlockRequest(requestId);
    if (success === false) return;
    alert('Permintaan Unlock ditolak.');
    loadApprovalData();
  };
  const handleBackToHub = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setActiveTab(TAB_IDS.ROLE_WORKSPACE);
    }
  };

  // Filtered orders
  const filteredOrders = ordersBySales.filter(o => {
    if (orderFilter === 'PENDING') {
      return o.status === 'PENDING_APPROVAL' || o.status === 'PENDING';
    }
    if (orderFilter === 'APPROVED') {
      return o.status === 'APPROVED';
    }
    if (orderFilter === 'REJECTED') {
      return o.status === 'REJECTED';
    }
    return true;
  });
  return <AdminApprovalView ordersOnly={ordersOnly} hideHeading={hideHeading} loadError={loadError} approvedOrders={approvedOrders} approvedOrdersBySales={approvedOrdersBySales} embedded={embedded} filteredOrders={filteredOrders} handleApproveUnlock={handleApproveUnlock} handleBackToHub={handleBackToHub} handleDecision={handleDecision} handleRejectUnlock={handleRejectUnlock} loadApprovalData={loadApprovalData} loading={loading} manualPendingCount={manualPendingCount} orderFilter={orderFilter} orders={orders} ordersBySales={ordersBySales} pendingOrders={pendingOrders} pendingOrdersBySales={pendingOrdersBySales} pendingUnlockCount={pendingUnlockCount} salesOptions={salesOptions} selectedSales={selectedSales} setOrderFilter={setOrderFilter} setSelectedSales={setSelectedSales} unlockRequests={unlockRequests} />;
};
