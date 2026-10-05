import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { AdminFeatureCard } from './components/AdminFeatureCard';
import { SectionSlider } from './components/SectionSlider';
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
  LuSettings,
  LuSearch,
  LuX,
  LuLock,
  LuUserCheck,
} from 'react-icons/lu';
import { FiBarChart2, FiCheckCircle } from 'react-icons/fi';

/**
 * Route prefetch map for instant transitions (Zero-delay navigation).
 */
const PREFETCH_MAP = {
  [TAB_IDS.ADMIN_APPROVAL]: () => import('./AdminApprovalPage'),
  [TAB_IDS.OUTLET_APPROVAL]: () => import('../OutletApproval/OutletApprovalPage'),
  [TAB_IDS.OUTLET_REGISTRATION]: () => import('../OutletRegistration/OutletRegistrationPage'),
  [TAB_IDS.DAILY_CALL_MONITOR]: () => import('../DailyCallMonitor/DailyCallMonitorPage'),
  [TAB_IDS.ROUTE_PLANNING]: () => import('../RoutePlanning/RoutePlanningPage'),
  [TAB_IDS.DASHBOARD]: () => import('../Dashboard/DashboardPage'),
  [TAB_IDS.TEAM_TRACKING]: () => import('../TeamTracking/TeamTrackingPage'),
  [TAB_IDS.OUTLET_MANAGEMENT]: () => import('../OutletManagement/OutletManagementPage'),
  [TAB_IDS.OUTLET_VALIDATION]: () => import('../OutletValidation/OutletValidationPage'),
  [TAB_IDS.CREATE_CLUSTER]: () => import('../RoutePlanning/CreateClusterPage'),
  [TAB_IDS.DELIVERY_MONITOR]: () => import('../Warehouse/components/DeliveryMonitor'),
  [TAB_IDS.REPORTS]: () => import('../Reports/ReportsPage'),
  [TAB_IDS.OUTLET_REGISTRATION_REPORT]: () => import('../OutletRegistrationReport/OutletRegistrationReportPage'),
  [TAB_IDS.USER_MANAGEMENT]: () => import('./AdminUserListPage'),
  [TAB_IDS.SYSTEM_CONFIG]: () => import('./AdminConfigPage'),
};

const preloadedRoutes = new Set();
const preloadRoute = (id) => {
  if (preloadedRoutes.has(id)) return;
  const loader = PREFETCH_MAP[id];
  if (loader) {
    preloadedRoutes.add(id);
    loader().catch(() => {});
  }
};

/**
 * AdminLandingPage Component
 * Apple Editorial Enterprise Monochrome Design System.
 * Mathematically symmetrical 16-card matrix (4 rows × 4 columns, 4 cards per category),
 * cohesive monochrome aesthetics, unclipped typography, and zero-delay navigation.
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
  const [searchQuery, setSearchQuery] = useState('');

  // Preload priority modules on idle to eliminate transition delay
  useEffect(() => {
    const idlePreload = () => {
      preloadRoute(TAB_IDS.ADMIN_APPROVAL);
      preloadRoute(TAB_IDS.OUTLET_MANAGEMENT);
      preloadRoute(TAB_IDS.DAILY_CALL_MONITOR);
      preloadRoute(TAB_IDS.USER_MANAGEMENT);
      preloadRoute(TAB_IDS.SYSTEM_CONFIG);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(idlePreload, { timeout: 1200 });
      return () => window.cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(idlePreload, 350);
      return () => clearTimeout(timer);
    }
  }, []);

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

  // Perfectly balanced 16 Feature Modules: Exactly 4 categories with 4 cards each (4x4 matrix)
  const featureList = useMemo(() => {
    return [
      // ── Kategori 1: Persetujuan & Otorisasi Transaksi (4 Modul) ──
      {
        id: TAB_IDS.ADMIN_APPROVAL,
        title: 'Persetujuan Order Penjualan (PO)',
        description:
          'Otorisasi PO penjualan sales, verifikasi plafon kredit piutang, dan persetujuan alokasi stok gudang.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuFileCheck,
        badge:
          pendingOrders.length > 0
            ? `${pendingOrders.length} Menunggu`
            : 'Siap Diproses',
        badgeVariant: pendingOrders.length > 0 ? 'alert' : 'neutral',
      },
      {
        id: TAB_IDS.OUTLET_APPROVAL,
        title: 'Persetujuan Outlet Baru (NOO)',
        description:
          'Verifikasi pendaftaran toko baru dari sales, validasi kelengkapan berkas KTP/NPWP dan verifikasi geotag.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuUserCheck,
        badge: 'Approval NOO',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.ADMIN_APPROVAL,
        title: 'Otorisasi Buka Kunci Presensi',
        description:
          'Persetujuan izin dispensasi check-in sales di luar radius geofence toko karena kendala sinyal atau lokasi.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuLock,
        badge:
          pendingUnlocks.length > 0
            ? `${pendingUnlocks.length} Pengajuan`
            : 'Normal',
        badgeVariant: pendingUnlocks.length > 0 ? 'alert' : 'neutral',
      },
      {
        id: TAB_IDS.OUTLET_REGISTRATION,
        title: 'Registrasi Outlet Baru (NOO)',
        description:
          'Input pendaftaran gerai baru secara langsung, penentuan batas plafon kredit, dan pemetaan koordinat toko.',
        category: 'APPROVAL',
        categoryLabel: 'Persetujuan',
        icon: LuUserPlus,
        badge: 'Buka Toko',
        badgeVariant: 'neutral',
      },

      // ── Kategori 2: Operasional Lapangan & Rute PJP (4 Modul) ──
      {
        id: TAB_IDS.DAILY_CALL_MONITOR,
        title: 'Daily Call Monitor & Presensi',
        description:
          'Monitoring presensi GPS real-time, durasi kunjungan toko, kepatuhan rute, dan status call harian sales.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuPhoneCall,
        badge: 'Live GPS',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.ROUTE_PLANNING,
        title: 'Kelola Master RJP & Rute Sales',
        description:
          'Penjadwalan rencana rute perjalanan (PJP/RJP), matriks kunjungan mingguan, dan alokasi rayon toko.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuNavigation,
        badge: 'Jadwal PJP',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.DASHBOARD,
        title: 'Peta Monitoring Distribusi',
        description:
          'Visualisasi geospasial sebaran seluruh toko di peta interaktif dan pelacakan lintasan rute sales.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuLayoutDashboard,
        badge: 'Peta Interaktif',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.TEAM_TRACKING,
        title: 'Manajemen Tim & Personel Sales',
        description:
          'Struktur tim sales force lapangan, pembagian rayon supervisor, penugasan wilayah, dan status kehadiran.',
        category: 'OPERASIONAL',
        categoryLabel: 'Operasional',
        icon: LuUsers,
        badge: `${totalSales > 0 ? totalSales : '16'} Personel`,
        badgeVariant: 'neutral',
      },

      // ── Kategori 3: Master Data Toko & Logistik (4 Modul) ──
      {
        id: TAB_IDS.OUTLET_MANAGEMENT,
        title: 'Database Master Outlet Toko',
        description:
          'Database terpadu seluruh outlet terdaftar, identitas pemilik, riwayat transaksi, dan batas kredit piutang.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuStore,
        badge: `${totalOutlets > 0 ? totalOutlets : '1.240+'} Outlet`,
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.OUTLET_VALIDATION,
        title: 'Audit & Validasi Titik Geotag',
        description:
          'Verifikasi dan koreksi koordinat latitude/longitude toko untuk menjamin presisi radius presensi sales.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuMapPin,
        badge: 'Geotag Audit',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.CREATE_CLUSTER,
        title: 'Kelola Master Kluster Distribusi',
        description:
          'Pengaturan zonasi wilayah distribusi, pemetaan rayon penjualan, dan pembagian area kerja supervisor.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuMap,
        badge: 'Zonasi Wilayah',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.DELIVERY_MONITOR,
        title: 'Monitor Logistik & Armada Gudang',
        description:
          'Pantauan status pengiriman armada supir, surat jalan distribusi, dan status muat barang packing list.',
        category: 'MASTER',
        categoryLabel: 'Master Data',
        icon: LuTruck,
        badge: 'Armada & Driver',
        badgeVariant: 'neutral',
      },

      // ── Kategori 4: Laporan, Analitik & Tata Kelola (4 Modul) ──
      {
        id: TAB_IDS.REPORTS,
        title: 'Laporan Analitik Penjualan ND6',
        description:
          'Analitik omset distribusi standar ND6, evaluasi pencapaian target sales, dan rekapitulasi audit transaksi.',
        category: 'TATA_KELOLA',
        categoryLabel: 'Laporan & Sistem',
        icon: FiBarChart2,
        badge: 'Standar ND6',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.OUTLET_REGISTRATION_REPORT,
        title: 'Laporan Pertumbuhan Outlet NOO',
        description:
          'Rekapitulasi pembukaan toko baru per wilayah kerja sales dan riwayat penerbitan kode customer toko.',
        category: 'TATA_KELOLA',
        categoryLabel: 'Laporan & Sistem',
        icon: LuClipboardList,
        badge: 'Rekap NOO',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.USER_MANAGEMENT,
        title: 'Manajemen Pengguna & Izin RBAC',
        description:
          'Kelola akun pengguna, reset kata sandi, pengaturan role hierarki, dan konfigurasi hak akses granular.',
        category: 'TATA_KELOLA',
        categoryLabel: 'Laporan & Sistem',
        icon: LuUsers,
        badge: 'Akun & Akses',
        badgeVariant: 'neutral',
      },
      {
        id: TAB_IDS.SYSTEM_CONFIG,
        title: 'Pengaturan Parameter & Geofence',
        description:
          'Konfigurasi radius geofence presensi, batas durasi kunjungan, timeout GPS, dan parameter sesi sistem.',
        category: 'TATA_KELOLA',
        categoryLabel: 'Laporan & Sistem',
        icon: LuSettings,
        badge: 'Parameter Inti',
        badgeVariant: 'neutral',
      },
    ];
  }, [pendingOrders.length, pendingUnlocks.length, totalOutlets, totalSales]);

  // Categories metadata for section headers and filter pills
  const CATEGORIES = useMemo(() => [
    {
      key: 'ALL',
      label: 'Semua Menu',
      shortLabel: 'Semua',
      description: 'Seluruh 16 modul operasional, transaksi, master data, dan tata kelola distribusi.',
      count: featureList.length,
    },
    {
      key: 'APPROVAL',
      label: 'Persetujuan & Otorisasi Transaksi',
      shortLabel: 'Persetujuan',
      description: 'Otorisasi PO penjualan sales, batas plafon kredit piutang, dan verifikasi outlet baru NOO.',
      count: 4,
    },
    {
      key: 'OPERASIONAL',
      label: 'Operasional Lapangan & Rute PJP',
      shortLabel: 'Operasional',
      description: 'Monitoring presensi GPS live, jadwal rencana perjalanan (PJP), tim sales, dan peta sebaran.',
      count: 4,
    },
    {
      key: 'MASTER',
      label: 'Master Data Toko & Logistik',
      shortLabel: 'Master Data',
      description: 'Database toko aktif, audit koordinat GPS, kluster distribusi, dan armada logistik.',
      count: 4,
    },
    {
      key: 'TATA_KELOLA',
      label: 'Laporan, Analitik & Tata Kelola',
      shortLabel: 'Laporan & Sistem',
      description: 'Laporan omset penjualan standar ND6, rekapitulasi NOO, akun pengguna, dan konfigurasi sistem.',
      count: 4,
    },
  ], [featureList.length]);

  // Filter features based on search query and category
  const filteredFeatures = useMemo(() => {
    return featureList.filter((feature) => {
      const matchCategory =
        selectedCategory === 'ALL' || feature.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        feature.title.toLowerCase().includes(q) ||
        feature.description.toLowerCase().includes(q) ||
        feature.categoryLabel.toLowerCase().includes(q) ||
        (feature.badge && feature.badge.toLowerCase().includes(q))
      );
    });
  }, [featureList, selectedCategory, searchQuery]);

  const handleCardClick = useCallback((id) => {
    setActiveTab(id);
  }, [setActiveTab]);

  const handleCardHover = useCallback((id) => {
    preloadRoute(id);
  }, []);

  // Symmetrical 4 sections with exactly 4 cards each
  const categorizedSections = useMemo(() => {
    const sections = [
      {
        key: 'APPROVAL',
        label: '1. Persetujuan & Otorisasi Transaksi',
        description: 'Otorisasi PO penjualan, limit piutang, pembukaan kunci presensi, dan NOO toko.',
      },
      {
        key: 'OPERASIONAL',
        label: '2. Operasional Lapangan & Rute PJP',
        description: 'Pantauan presensi GPS, jadwal rute mingguan, peta interaktif, dan tim sales force.',
      },
      {
        key: 'MASTER',
        label: '3. Master Data Toko & Logistik',
        description: 'Database master toko, audit titik geotag, zonasi kluster, dan logistik gudang.',
      },
      {
        key: 'TATA_KELOLA',
        label: '4. Laporan, Analitik & Tata Kelola Sistem',
        description: 'Laporan analitik ND6, rekap NOO, manajemen pengguna, dan parameter geofence.',
      },
    ];

    return sections
      .map((sec) => ({
        ...sec,
        items: featureList.filter((f) => f.category === sec.key),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [featureList]);

  const isGroupedView = selectedCategory === 'ALL' && !searchQuery.trim();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto pb-24">
      {/* ── 1. Page Header Banner (Monochrome & Executive) ── */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuLayoutGrid className="text-sm text-neutral-900" /> PORTAL UTAMA ADMINISTRATOR
          </span>
        }
        title={`Pusat Kendali Admin • ${user?.name || 'Administrator Sistem'}`}
        subtitle="Akses terpadu seluruh modul operasional distribusi, otorisasi transaksi, audit geolokasi, dan konfigurasi sistem."
        stats={[
          {
            label: 'Order Pending',
            value: `${pendingOrders.length} Order`,
            color: pendingOrders.length > 0 ? 'rose' : 'neutral',
          },
          {
            label: 'Buka Kunci',
            value: `${pendingUnlocks.length} Izin`,
            color: pendingUnlocks.length > 0 ? 'rose' : 'neutral',
          },
          {
            label: 'Total Outlet',
            value: totalOutlets > 0 ? `${totalOutlets} Toko` : 'Database',
            color: 'neutral',
          },
          {
            label: 'Sales Force',
            value: `${totalSales > 0 ? totalSales : '16'} Tim`,
            color: 'neutral',
          },
        ]}
      />

      {/* ── 2. Urgent Attention Alert Banner (Refined Monochrome with Soft Rose Accent) ── */}
      {(pendingOrders.length > 0 || pendingUnlocks.length > 0) && (
        <div className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_rgba(244,63,94,0.06)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200/90">
              <LuShieldAlert className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 m-0">
                Pemberitahuan Tindakan Prioritas Admin
              </h4>
              <p className="text-xs text-neutral-600 m-0 mt-0.5 leading-relaxed">
                Terdapat <strong>{pendingOrders.length} order penjualan</strong> dan{' '}
                <strong>{pendingUnlocks.length} permohonan buka kunci</strong> yang menunggu keputusan otorisasi Admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Otorisasi</span>
            <LuArrowRight className="text-sm" />
          </button>
        </div>
      )}

      {/* ── 3. Executive KPI Stat Cards (Symmetric 4-Column Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AdminStatCard
          title="Antrean Order Sales"
          value={pendingOrders.length}
          subtext="Pesanan penjualan menunggu persetujuan"
          icon={LuFileCheck}
          badgeText={pendingOrders.length > 0 ? 'Perlu Review' : 'Tuntas'}
          badgeColor={pendingOrders.length > 0 ? 'rose' : 'neutral'}
          onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
        />

        <AdminStatCard
          title="Permintaan Unlock"
          value={pendingUnlocks.length}
          subtext="Permohonan buka kunci outlet sales"
          icon={LuClock}
          badgeText={pendingUnlocks.length > 0 ? 'Menunggu' : 'Terkendali'}
          badgeColor={pendingUnlocks.length > 0 ? 'rose' : 'neutral'}
          onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
        />

        <AdminStatCard
          title="Master Database Toko"
          value={totalOutlets > 0 ? totalOutlets : '1.240+'}
          subtext="Total outlet terdaftar dalam sistem"
          icon={LuStore}
          badgeText="Terdata"
          badgeColor="neutral"
          onClick={() => setActiveTab(TAB_IDS.OUTLET_MANAGEMENT)}
        />

        <AdminStatCard
          title="Sales Force Lapangan"
          value={totalSales > 0 ? totalSales : '16 Tim'}
          subtext="Personel sales aktif bertugas"
          icon={LuUsers}
          badgeText="Personel"
          badgeColor="neutral"
          onClick={() => setActiveTab(TAB_IDS.TEAM_TRACKING)}
        />
      </div>

      {/* ── 4. Filter Toolbar & Search Bar (Sleek Apple Editorial Tone) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  <span>{cat.shortLabel || cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white font-extrabold'
                        : 'bg-neutral-100 text-neutral-600 font-bold'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu modul..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-md cursor-pointer"
                title="Hapus pencarian"
              >
                <LuX className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Status Text Bar */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-0.5">
          <span>
            {searchQuery ? (
              <>
                Hasil pencarian untuk "<strong>{searchQuery}</strong>": Ditemukan{' '}
                <strong>{filteredFeatures.length}</strong> modul
              </>
            ) : (
              <>
                Menampilkan <strong>{filteredFeatures.length}</strong> menu modul
                {selectedCategory !== 'ALL' && (
                  <> pada kategori <strong>{CATEGORIES.find((c) => c.key === selectedCategory)?.label}</strong></>
                )}
              </>
            )}
          </span>

          {(selectedCategory !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="text-neutral-900 font-bold hover:underline cursor-pointer text-xs"
            >
              Reset Tampilan Semua
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Modular Content Presentation (100% Symmetrical 4-Column Grids) ── */}
      {isGroupedView ? (
        /* STRUCTURED VIEW: Section Sliders with 3D Snap Cards */
        <div className="space-y-8">
          {categorizedSections.map((section) => (
            <SectionSlider
              key={section.key}
              title={section.label}
              count={`${section.items.length} Modul`}
              description={section.description}
              items={section.items}
              onCardClick={handleCardClick}
              onCardHover={handleCardHover}
            />
          ))}
        </div>
      ) : (
        /* FILTERED OR SEARCH VIEW (Flush 4-column grid) */
        <div>
          {filteredFeatures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredFeatures.map((feature) => (
                <AdminFeatureCard
                  key={feature.id + feature.title}
                  id={feature.id}
                  title={feature.title}
                  description={feature.description}
                  category={feature.category}
                  categoryLabel={feature.categoryLabel}
                  icon={feature.icon}
                  badge={feature.badge}
                  badgeVariant={feature.badgeVariant}
                  onClick={handleCardClick}
                  onMouseEnter={handleCardHover}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center text-xl mx-auto border border-neutral-200">
                <LuSearch />
              </div>
              <h3 className="text-base font-bold text-neutral-900 m-0">
                Menu Modul Tidak Ditemukan
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto m-0">
                Tidak ada menu yang sesuai dengan kata kunci "<strong>{searchQuery}</strong>". Silakan periksa ejaan atau reset filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Tampilkan Seluruh Menu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 6. System Status & Enterprise Summary Strip ── */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/90">
            <FiCheckCircle className="text-base" />
          </div>
          <div>
            <span className="font-bold text-neutral-900 block">
              Sistem Distribusi Sinar Anugrah Terhubung
            </span>
            <span className="text-[11px] text-neutral-500">
              Koneksi REST API & Real-time Geolocation aktif • Standar ND6 & PJP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-500">
          <span>Hak Akses: Administrator Sistem (Penuh)</span>
          <span>•</span>
          <span>Versi Enterprise 2.4</span>
        </div>
      </div>
    </div>
  );
};
