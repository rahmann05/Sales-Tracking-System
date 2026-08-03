import React, { createContext, useContext, useState } from 'react';

// Default Demo Users per Role
export const DEMO_USERS = {
  SALES: {
    id: 'usr-sales-1',
    name: 'Budi Santoso',
    email: 'sales@sinaranugrah.com',
    role: 'SALES',
    roleLabel: 'Sales Field Rep',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    region: 'Jakarta Barat',
    cluster: 'Cluster Roxy & Grogol',
  },
  DRIVER: {
    id: 'usr-driver-1',
    name: 'Hendra Wijaya',
    email: 'driver@sinaranugrah.com',
    role: 'DRIVER',
    roleLabel: 'Driver Logistik',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    vehiclePlate: 'B 9421 SF',
    helperName: 'Rian Putra',
  },
  HELPER: {
    id: 'usr-helper-1',
    name: 'Rian Putra',
    email: 'helper@sinaranugrah.com',
    role: 'HELPER',
    roleLabel: 'Helper Logistik',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    driverName: 'Hendra Wijaya',
  },
  SUPERVISOR: {
    id: 'usr-spv-1',
    name: 'Ahmad Subagja',
    email: 'spv@sinaranugrah.com',
    role: 'SUPERVISOR',
    roleLabel: 'Supervisor Operasional',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    teamCount: 8,
  },
  ADMIN: {
    id: 'usr-admin-1',
    name: 'Maria Ulfah',
    email: 'admin@sinaranugrah.com',
    role: 'ADMIN',
    roleLabel: 'Admin Penjualan',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  },
  OPERATIONAL_MANAGER: {
    id: 'usr-ops-1',
    name: 'Bambang Suroso',
    email: 'ops@sinaranugrah.com',
    role: 'OPERATIONAL_MANAGER',
    roleLabel: 'Manajer Operasional',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
  },
};

// Initial Mock PJP Outlets for Sales
const INITIAL_SALES_STOPS = [
  {
    id: 'stop-101',
    sequence: 1,
    outletCode: 'OTL-001',
    outletName: 'Toko Sumber Rezeki',
    owner: 'Hj. Aminah',
    phone: '0812-3456-7890',
    address: 'Jl. Kyai Tapa No. 12, Grogol',
    latitude: -6.1685,
    longitude: 106.7892,
    radiusMeters: 50,
    currentDistance: 24, // inside geofence
    status: 'PENDING', // PENDING, ARRIVED, ORDERED, NO_ORDER, CLOSED, SKIPPED
    callFrequency: 'F4',
    creditLimit: 15000000,
    outstanding: 3500000,
  },
  {
    id: 'stop-102',
    sequence: 2,
    outletCode: 'OTL-002',
    outletName: 'Minimarket Maju Jaya',
    owner: 'Pak Koes',
    phone: '0813-8888-9999',
    address: 'Jl. Roxy Mas Blok C3 No. 8',
    latitude: -6.1652,
    longitude: 106.7981,
    radiusMeters: 50,
    currentDistance: 42, // inside geofence
    status: 'PENDING',
    callFrequency: 'F2',
    creditLimit: 25000000,
    outstanding: 12000000,
  },
  {
    id: 'stop-103',
    sequence: 3,
    outletCode: 'OTL-003',
    outletName: 'Toko Kelontong Berkah',
    owner: 'Ibu Susanti',
    phone: '0811-2233-4455',
    address: 'Jl. Daan Mogot KM 2 No. 45',
    latitude: -6.162,
    longitude: 106.782,
    radiusMeters: 50,
    currentDistance: 120, // outside geofence simulation
    status: 'PENDING',
    callFrequency: 'F1',
    creditLimit: 10000000,
    outstanding: 8500000,
  },
  {
    id: 'stop-104',
    sequence: 4,
    outletCode: 'OTL-004',
    outletName: 'Grosir Sinar Abadi',
    owner: 'Bpk. Hendro',
    phone: '0857-1122-3344',
    address: 'Jl. Tanjung Duren Barat No. 88',
    latitude: -6.171,
    longitude: 106.785,
    radiusMeters: 50,
    currentDistance: 15,
    status: 'PENDING',
    callFrequency: 'F4',
    creditLimit: 50000000,
    outstanding: 42000000,
  },
];

// Product Catalog
export const MOCK_PRODUCTS = [
  { id: 'prd-1', code: 'SKU-001', name: 'Minyak Goreng Sawit 2L', category: 'Sembako', price: 34000, stock: 150 },
  { id: 'prd-2', code: 'SKU-002', name: 'Gula Pasir Kristal 1kg', category: 'Sembako', price: 17500, stock: 300 },
  { id: 'prd-3', code: 'SKU-003', name: 'Beras Premium Super 5kg', category: 'Sembako', price: 72000, stock: 80 },
  { id: 'prd-4', code: 'SKU-004', name: 'Susu Kental Manis 370g', category: 'Minuman', price: 12500, stock: 220 },
  { id: 'prd-5', code: 'SKU-005', name: 'Kopi Bubuk Murni 200g', category: 'Minuman', price: 21000, stock: 140 },
];

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(DEMO_USERS.SALES);
  
  // Shift Attendance State
  const [shiftAttendance, setShiftAttendance] = useState({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    photoUrl: null,
  });

  // Sales Daily PJP Stops
  const [salesStops, setSalesStops] = useState(INITIAL_SALES_STOPS);

  // Orders List
  const [orders, setOrders] = useState([
    {
      id: 'ORD-8801',
      dailyStopId: 'stop-101',
      outletName: 'Toko Sumber Rezeki',
      salesName: 'Budi Santoso',
      createdAt: '2026-08-03 09:30',
      totalAmount: 1870000,
      paymentType: 'TOP_14',
      status: 'PENDING_APPROVAL', // PENDING_APPROVAL, APPROVED, REJECTED
      creditLimit: 15000000,
      outstanding: 3500000,
      items: [
        { productName: 'Minyak Goreng Sawit 2L', qty: 30, price: 34000, subtotal: 1020000 },
        { productName: 'Gula Pasir Kristal 1kg', qty: 45, price: 17500, subtotal: 787500 },
      ],
    },
  ]);

  // Incidents / Closed Outlets Reports
  const [incidents, setIncidents] = useState([]);

  // Delivery Manifest PJP H+1 for Driver & Helper
  const [deliveryStops, setDeliveryStops] = useState([
    {
      id: 'del-201',
      orderId: 'ORD-8700',
      outletName: 'Toko Melati Abadi',
      address: 'Jl. Palmerah Utara No. 15',
      driverName: 'Hendra Wijaya',
      helperName: 'Rian Putra',
      itemsCount: 4,
      totalAmount: 3450000,
      paymentType: 'COD',
      status: 'PENDING', // PENDING, ARRIVED, DELIVERED, FAILED
      podSignature: null,
      podPhoto: null,
      cashCollected: 0,
    },
  ]);

  // Real-time Notifications Center
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Order Baru Masuk',
      message: 'Sales Budi Santoso menginput order #ORD-8801 di Toko Sumber Rezeki.',
      timestamp: '10 min ago',
      read: false,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    },
  ]);

  // Handle Login Switcher
  const loginAsRole = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setUser(DEMO_USERS[roleKey]);
    }
  };

  // Clock In Shift
  const handleShiftClockIn = () => {
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setShiftAttendance({
      clockedIn: true,
      clockInTime: now,
      clockOutTime: null,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    });
    addNotification({
      title: 'Shift Dimulai',
      message: `${user.name} melakukan Absen Shift Masuk pukul ${now}`,
      roleTarget: [user.role, 'SUPERVISOR'],
    });
  };

  // Clock Out Shift
  const handleShiftClockOut = () => {
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setShiftAttendance((prev) => ({
      ...prev,
      clockedIn: false,
      clockOutTime: now,
    }));
  };

  // Helper Add Notification
  const addNotification = ({ title, message, roleTarget }) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title,
        message,
        timestamp: 'Just now',
        read: false,
        roleTarget,
      },
      ...prev,
    ]);
  };

  // Absen In Outlet (Sales)
  const handleSalesAbsenIn = (stopId) => {
    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'ARRIVED', checkInTime: new Date().toLocaleTimeString() } : s))
    );
  };

  // Submit Order (Sales)
  const handleSubmitOrder = ({ stopId, items, paymentType, totalAmount }) => {
    const stop = salesStops.find((s) => s.id === stopId);
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      dailyStopId: stopId,
      outletName: stop ? stop.outletName : 'Unknown Outlet',
      salesName: user.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      totalAmount,
      paymentType,
      status: 'PENDING_APPROVAL',
      creditLimit: stop?.creditLimit || 10000000,
      outstanding: stop?.outstanding || 2000000,
      items,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update stop status
    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'ORDERED' } : s))
    );

    // Trigger Notification to SPV and Admin
    addNotification({
      title: 'Order Baru Menunggu Approval',
      message: `Sales ${user.name} menginput order ${newOrder.id} (${stop?.outletName}) sebesar Rp ${totalAmount.toLocaleString('id-ID')}`,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  };

  // Report Closed Outlet (Sales -> SPV)
  const handleReportClosedOutlet = ({ stopId, reason, photoUrl }) => {
    const stop = salesStops.find((s) => s.id === stopId);
    const newIncident = {
      id: `inc-${Date.now()}`,
      stopId,
      outletName: stop?.outletName,
      salesName: user.name,
      reason,
      photoUrl,
      reportedAt: new Date().toLocaleTimeString(),
      status: 'PENDING_SPV', // PENDING_SPV, RESOLVED_SKIP, RESOLVED_REROUTE_PENDING_OPS, RESOLVED_REROUTE_APPROVED
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'CLOSED' } : s))
    );

    addNotification({
      title: 'Laporan Toko Tutup',
      message: `Sales ${user.name} melaporkan Toko Tutup: ${stop?.outletName}. Membutuhkan penanganan SPV.`,
      roleTarget: ['SUPERVISOR'],
    });
  };

  // Supervisor Action: Skip Outlet
  const handleSupervisorSkipOutlet = (incidentId) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_SKIP' } : i))
    );

    setSalesStops((prev) =>
      prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s))
    );

    // Informative notification only to Operational Manager (no approval required)
    addNotification({
      title: 'Info Skip Toko (Dari SPV)',
      message: `Supervisor ${user.name} menyetujui pengelewatan (Skip) outlet ${incident.outletName} karena ${incident.reason}.`,
      roleTarget: ['OPERATIONAL_MANAGER'],
    });
  };

  // Supervisor Action: Request Reroute
  const handleSupervisorRequestReroute = ({ incidentId, newOutletName, reason }) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'RESOLVED_REROUTE_PENDING_OPS',
              newOutletName,
              rerouteReason: reason,
            }
          : i
      )
    );

    // Requires Approval from Operational Manager
    addNotification({
      title: 'Permohonan Approval Perubahan Rute',
      message: `SPV ${user.name} mengajukan pengalihan rute dari ${incident.outletName} ke ${newOutletName}. Menunggu approval Manajer Operasional.`,
      roleTarget: ['OPERATIONAL_MANAGER'],
    });
  };

  // Operational Manager Action: Approve / Reject Reroute
  const handleOpsManagerRerouteDecision = ({ incidentId, approved }) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    if (approved) {
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_REROUTE_APPROVED' } : i))
      );

      // Add replacement outlet to Sales Daily PJP
      const newStop = {
        id: `stop-replaced-${Date.now()}`,
        sequence: salesStops.length + 1,
        outletCode: `OTL-REP-${Math.floor(100 + Math.random() * 900)}`,
        outletName: incident.newOutletName || 'Toko Pengganti Baru',
        owner: 'Bpk. Pengganti',
        phone: '0812-9999-0000',
        address: 'Jl. Rute Pengganti Cluster Roxy',
        latitude: -6.167,
        longitude: 106.787,
        radiusMeters: 50,
        currentDistance: 18,
        status: 'PENDING',
        callFrequency: 'F1',
        creditLimit: 15000000,
        outstanding: 0,
      };

      setSalesStops((prev) => [...prev, newStop]);

      addNotification({
        title: 'Perubahan Rute Disetujui!',
        message: `Manajer Operasional menyetujui penggantian rute ke ${newStop.outletName}. Rute sales telah diperbarui.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    } else {
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_SKIP' } : i))
      );
    }
  };

  // Admin Action: Approve / Reject Order
  const handleAdminOrderDecision = ({ orderId, approved, rejectionReason }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (approved) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o))
      );

      // Automatically synthesize Delivery PJP H+1 for Driver & Helper!
      const newDeliveryStop = {
        id: `del-${Date.now()}`,
        orderId: order.id,
        outletName: order.outletName,
        address: 'Jl. Alamat Delivery Pengiriman',
        driverName: 'Hendra Wijaya',
        helperName: 'Rian Putra',
        itemsCount: order.items.length,
        totalAmount: order.totalAmount,
        paymentType: order.paymentType,
        status: 'PENDING',
        podSignature: null,
        podPhoto: null,
        cashCollected: 0,
      };

      setDeliveryStops((prev) => [newDeliveryStop, ...prev]);

      addNotification({
        title: 'Order Approved & Rute Pengiriman Dibuat',
        message: `Order #${order.id} (${order.outletName}) telah disetujui oleh Admin dan dijadwalkan untuk pengiriman H+1.`,
        roleTarget: ['SALES', 'DRIVER', 'HELPER'],
      });
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'REJECTED', rejectionReason } : o
        )
      );

      addNotification({
        title: 'Order Ditolak Admin',
        message: `Order #${order.id} ditolak oleh Admin. Alasan: ${rejectionReason}`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    }
  };

  // Driver / Helper POD Submission
  const handleSubmitPOD = ({ deliveryStopId, signature, photo, cashCollected }) => {
    setDeliveryStops((prev) =>
      prev.map((d) =>
        d.id === deliveryStopId
          ? {
              ...d,
              status: 'DELIVERED',
              podSignature: signature,
              podPhoto: photo,
              cashCollected,
              checkOutTime: new Date().toLocaleTimeString(),
            }
          : d
      )
    );

    addNotification({
      title: 'Pengiriman Berhasil (POD)',
      message: `Driver Hendra Wijaya & Helper Rian Putra menyelesaikan pengiriman ke ${deliveryStops.find(d => d.id === deliveryStopId)?.outletName}`,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loginAsRole,
        shiftAttendance,
        handleShiftClockIn,
        handleShiftClockOut,
        salesStops,
        handleSalesAbsenIn,
        handleSubmitOrder,
        handleReportClosedOutlet,
        orders,
        handleAdminOrderDecision,
        incidents,
        handleSupervisorSkipOutlet,
        handleSupervisorRequestReroute,
        handleOpsManagerRerouteDecision,
        deliveryStops,
        handleSubmitPOD,
        notifications,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
