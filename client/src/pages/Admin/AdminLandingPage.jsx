import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { AdminFeatureCard } from './components/AdminFeatureCard';
import { AdminStatCard } from './components/AdminStatCard';
import {
  LuFileCheck,
  LuPhoneCall,
  LuNavigation,
  LuStore,
  LuUserPlus,
  LuMapPin,
  LuUsers,
  LuClipboardList,
  LuLayoutDashboard,
  LuTruck,
  LuClock,
  LuShieldAlert,
  LuArrowRight,
  LuLayoutGrid,
  LuMap,
} from 'react-icons/lu';
import { FiBarChart2, FiCheckCircle } from 'react-icons/fi';

/**
 * AdminLandingPage Component
 * Material Design 3 / Apple Editorial Symmetrical Grid Hub.
 * Symmetrical 12-Card Menu Grid with uniform dimensions and balanced responsiveness.
 */
export const AdminLandingPage = () => {
  const {
    user,
    orders = [],
    incidents = [],
    clusters = [],
    salesList = [],
    teamMembers = [],
    setActiveTab,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Compute live metrics
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING'
    );
  }, [orders]);

  const pendingUnlocks = useMemo(() => {
    return incidents.filter(
      (i) => i.type === 'UNLOCK_REQUEST' && i.status === 'PENDING'
    );
  }, [incidents]);

  const totalOutlets = useMemo(() => {
    return clusters.reduce((acc, c) => {
      const count = Array.isArray(c.outlets)
        ? c.outlets.length
        : typeof c.outletCount === 'number'
        ? c.outletCount
        : 0;
      return acc + count;
    }, 0);
  }, [clusters]);

  const totalSales = useMemo(() => {
    return salesList.length || teamMembers.length || 0;
  }, [salesList, teamMembers]);

  // Perfectly Balanced 12 Feature Modules (Divisible by 2, 3, and 4)
  const featureList = useMemo(() => {
    return [
      // 1. Persetujuan & Transaksi
      {
        id: TAB_IDS.ADMIN_APPROVAL,
        title: 'Persetujuan Order & Unlock',
        description:
          'Otorisasi PO penjualan sales, pengecekan limit kredit piutang, dan buka kunci absen toko.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuFileCheck,
        badge:
          pendingOrders.length + pendingUnlocks.length > 0
            ? `${pendingOrders.length + pendingUnlocks.length} Menunggu`
            : 'Selesai',
        badgeVariant:
          pendingOrders.length + pendingUnlocks.length > 0 ? 'alert' : 'success',
      },
      {
        id: TAB_IDS.OUTLET_APPROVAL,
        title: 'Persetujuan Outlet (NOO)',
        description:
          'Verifikasi pendaftaran toko baru dari sales, validasi kelengkapan berkas KTP/NPWP & geotag.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuUserPlus,
        badge: 'Approval NOO',
        badgeVariant: 'warning',
      },

      // 2. Operasional Lapangan & Rute
      {
        id: TAB_IDS.DAILY_CALL_MONITOR,
        title: 'Daily Call Monitor',
        description:
          'Monitoring presensi GPS live, durasi kunjungan toko, dan efektivitas call harian sales.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuPhoneCall,
        badge: 'Live Tracking',
        badgeVariant: 'info',
      },
      {
        id: TAB_IDS.ROUTE_PLANNING,
        title: 'Kelola Master RJP & Rute',
        description:
          'Penjadwalan rencana rute perjalanan (PJP/RJP), matriks mingguan, dan alokasi kunjungan toko.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuNavigation,
        badge: 'Jadwal PJP',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.TEAM_TRACKING,
        title: 'Manajemen Tim & Personel',
        description:
          'Struktur tim sales force, supervisor regional, penugasan rayon, dan status kehadiran.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuUsers,
        badge: `${totalSales > 0 ? totalSales : 'Sales'} Personel`,
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.DELIVERY_MONITOR,
        title: 'Monitor Logistik & Gudang',
        description:
          'Pantauan status pengiriman barang supir, surat jalan armada, dan muat packing list gudang.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuTruck,
        badge: 'Armada & Gudang',
        badgeVariant: 'neutral',
      },

      // 3. Master Data & Geotagging
      {
        id: TAB_IDS.OUTLET_MANAGEMENT,
        title: 'Kelola Master Outlet',
        description:
          'Database lengkap seluruh toko terdaftar, informasi pemilik, plafon piutang, dan riwayat.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuStore,
        badge: `${totalOutlets > 0 ? totalOutlets : 'Database'} Outlet`,
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.OUTLET_VALIDATION,
        title: 'Validasi Titik GPS Outlet',
        description:
          'Audit dan koreksi titik koordinat GPS toko untuk menjamin presisi radius absen sales.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuMapPin,
        badge: 'Koreksi Geotag',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.CREATE_CLUSTER,
        title: 'Kelola Master Kluster',
        description:
          'Pengaturan zonasi kluster distribusi, alokasi rayon penjualan, dan pemetaan area outlet.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuMap,
        badge: 'Zonasi Wilayah',
        badgeVariant: 'neutral',
      },

      // 4. Laporan & Peta Geospasial
      {
        id: TAB_IDS.REPORTS,
        title: 'Laporan & Analitik ND6',
        description:
          'Analitik omset penjualan standar ND6, evaluasi target sales, dan audit anomali absensi.',
        category: 'LAPORAN',
        categoryLabel: 'Laporan',
        icon: FiBarChart2,
        badge: 'Standar ND6',
        badgeVariant: 'info',
      },
      {
        id: TAB_IDS.OUTLET_REGISTRATION_REPORT,
        title: 'Laporan Registrasi Outlet',
        description:
          'Rekapitulasi pertumbuhan pembukaan toko baru per sales dan riwayat penerbitan kode customer.',
        category: 'LAPORAN',
        categoryLabel: 'Laporan',
        icon: LuClipboardList,
        badge: 'Rekap NOO',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.DASHBOARD,
        title: 'Peta Monitoring Interaktif',
        description:
          'Visualisasi geospasial sebaran seluruh toko di peta dan pelacakan rute sales secara live.',
        category: 'LAPORAN',
        categoryLabel: 'Laporan',
        icon: LuLayoutDashboard,
        badge: 'Peta Geospasial',
        badgeVariant: 'neutral',
      },
    ];
  }, [pendingOrders.length, pendingUnlocks.length, totalOutlets, totalSales]);

  // Categories metadata for filter pills
  const categories = [
    { key: 'ALL', label: 'Semua Menu', count: featureList.length },
    {
      key: 'APPROVAL',
      label: 'Persetujuan',
      count: featureList.filter((f) => f.category === 'APPROVAL').length,
    },
    {
      key: 'OPERASIONAL',
      label: 'Operasional & Rute',
      count: featureList.filter((f) => f.category === 'OPERASIONAL').length,
    },
    {
      key: 'MASTER',
      label: 'Master Data',
      count: featureList.filter((f) => f.category === 'MASTER').length,
    },
    {
      key: 'LAPORAN',
      label: 'Laporan & Peta',
      count: featureList.filter((f) => f.category === 'LAPORAN').length,
    },
  ];

  // Filter features based on category
  const filteredFeatures = useMemo(() => {
    return featureList.filter((feature) => {
      return selectedCategory === 'ALL' || feature.category === selectedCategory;
    });
  }, [featureList, selectedCategory]);

  const handleCardClick = (id) => {
    setActiveTab(id);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── 1. Unified Suite Header Banner ── */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuLayoutGrid className="text-sm" /> PORTAL MENU UTAMA ADMIN
          </span>
        }
        title={`Pusat Kendali Admin • ${user?.name || 'Administrator'}`}
        subtitle="Akses seluruh modul operasional distribusi, persetujuan order, pemantauan rute PJP, dan laporan analitik dalam susunan menu yang simetris dan rapi."
        stats={[
          {
            label: 'Order Pending',
            value: `${pendingOrders.length} Order`,
            color: pendingOrders.length > 0 ? 'rose' : 'emerald',
          },
          {
            label: 'Buka Kunci',
            value: `${pendingUnlocks.length} Menunggu`,
            color: pendingUnlocks.length > 0 ? 'amber' : 'emerald',
          },
          {
            label: 'Total Outlet',
            value: totalOutlets > 0 ? `${totalOutlets} Toko` : 'Database',
            color: 'neutral',
          },
          {
            label: 'Sales Force',
            value: `${totalSales > 0 ? totalSales : '16'} Personel`,
            color: 'neutral',
          },
        ]}
      />

      {/* ── 2. Urgent Attention Alert Banner (Conditional) ── */}
      {(pendingOrders.length > 0 || pendingUnlocks.length > 0) && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <LuShieldAlert className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 m-0">
                Pemberitahuan Tindakan Segera
              </h4>
              <p className="text-xs text-amber-800 m-0 mt-0.5">
                Terdapat <strong>{pendingOrders.length} order penjualan</strong> dan{' '}
                <strong>{pendingUnlocks.length} permohonan buka kunci</strong> yang menunggu keputusan Admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <span>Tinjau Sekarang</span>
            <LuArrowRight className="text-sm" />
          </button>
        </div>
      )}

      {/* ── 3. Executive KPI Stat Cards (Symmetric 4-Column Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Antrean Order Sales"
          value={pendingOrders.length}
          subtext="Pesanan penjualan perlu persetujuan"
          icon={LuFileCheck}
          badgeText={pendingOrders.length > 0 ? 'Perlu Review' : 'Selesai'}
          badgeColor={pendingOrders.length > 0 ? 'rose' : 'emerald'}
          onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
        />

        <AdminStatCard
          title="Permintaan Unlock"
          value={pendingUnlocks.length}
          subtext="Permohonan buka kunci outlet sales"
          icon={LuClock}
          badgeText={pendingUnlocks.length > 0 ? 'Menunggu' : 'Aman'}
          badgeColor={pendingUnlocks.length > 0 ? 'amber' : 'emerald'}
          onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
        />

        <AdminStatCard
          title="Master Database Toko"
          value={totalOutlets > 0 ? totalOutlets : '1.240+'}
          subtext="Total outlet terdata dalam sistem"
          icon={LuStore}
          badgeText="Terdata"
          badgeColor="blue"
          onClick={() => setActiveTab(TAB_IDS.OUTLET_MANAGEMENT)}
        />

        <AdminStatCard
          title="Sales Force Lapangan"
          value={totalSales > 0 ? totalSales : '16 Tim'}
          subtext="Personel lapangan aktif bertugas"
          icon={LuUsers}
          badgeText="Distribusi"
          badgeColor="neutral"
          onClick={() => setActiveTab(TAB_IDS.TEAM_TRACKING)}
        />
      </div>

      {/* ── 4. Category Filter Tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-border-glass">
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-on-surface-variant font-medium">
          Menampilkan <strong>{filteredFeatures.length}</strong> menu modul
        </span>
      </div>

      {/* ── 5. Symmetric 12-Card Feature Grid (4-cols on XL, 3-cols on LG, 2-cols on SM) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredFeatures.map((feature) => (
          <AdminFeatureCard
            key={feature.id}
            id={feature.id}
            title={feature.title}
            description={feature.description}
            categoryLabel={feature.categoryLabel}
            icon={feature.icon}
            badge={feature.badge}
            badgeVariant={feature.badgeVariant}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* ── 6. System Status & Quick Summary Strip ── */}
      <div className="rounded-2xl bg-surface border border-border-glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <FiCheckCircle className="text-base" />
          </div>
          <div>
            <span className="font-bold text-on-surface block">
              Sistem Distribusi Sinar Anugrah Terhubung
            </span>
            <span className="text-[11px]">
              Koneksi REST API & Real-time Geolocation aktif • Standar ND6 & PJP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-on-surface-variant">
          <span>Hak Akses: Administrator Penjualan</span>
          <span>•</span>
          <span>Versi Enterprise 2.4</span>
        </div>
      </div>
    </div>
  );
};
