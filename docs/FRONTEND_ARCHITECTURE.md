# Frontend Architecture — Sinar Anugrah Sales Tracking System

> Refactored with SOLID principles, clean code, and modular design.
> **1 file = 1 component** · Parent → Child hierarchy · UI dipisah dari data & logic.

---

## 📁 Directory Structure

```
client/src/
├── constants/              # Immutable configuration
│   ├── roles.js            # Role definitions & access-control matrices
│   ├── navigation.js       # Tab registry & role-based nav builder
│   ├── maps.js             # Google Maps options & default depot location
│   ├── routePlanning.js    # RJP_ROLE_TAB_MAP (tab per role)
│   ├── supervisor.js       # Supervisor domain constants
│   └── index.js            # Barrel export
│
├── context/                # Global state (React Context)
│   └── AppContext.jsx      # AppProvider composing domain action hooks
│
├── hooks/                  # Global custom hooks (1 hook = 1 concern)
│   ├── useAuth.js, useTabNavigation.js, useSearch.js, useModal.js
│   ├── useSalesActions.js, useSupervisorActions.js, useOpsActions.js,
│   ├── useAdminActions.js, useDeliveryActions.js
│   ├── useRjpManagement.js, useSupervisorRollingMatrix.js, useLogisticsDispatch.js
│   ├── useGeofence.js, useDeviceCamera.js, useLiveClock.js, useApi.js
│   ├── useOutletLockStatus.js, useRouteFilter.js
│   └── index.js            # Barrel export
│
├── services/               # External I/O & API layer
│   ├── api.js                  # HTTP client
│   ├── notificationService.js  # User notifications (replaces alert)
│   ├── cameraSnapshotService.js / nativeFileCaptureService.js / deviceDetectionService.js
│   ├── googlePlacesService.js / googleDirectionsService.js / reverseGeocodeService.js
│   ├── salesPerformanceService.js / clusterColorService.js
│   ├── logisticsOptimizerService.js / rjpOptimizationService.js / spreadsheetImportService.js
│   └── index.js            # Barrel export
│
├── data/                   # Mock/seed data — dipisah per domain (bukan 1 file raksasa)
│   ├── usersData.js        # INITIAL_USERS, CURRENT_USER
│   ├── salesStopsData.js   # INITIAL_SALES_STOPS
│   ├── teamsData.js        # INITIAL_RJP_TEAMS
│   ├── routesData.js       # INITIAL_ROUTES
│   ├── productsData.js     # PRODUCT_CATALOG
│   ├── coverageOutletsData.js / initialClustersData.js
│   └── index.js            # Barrel export
│
├── components/
│   ├── common/         # Reusable atomic components (Button, Card, Input, Badge, Avatar,
│   │                   #  AccessDenied, EmptyState, SectionHeader, ErrorBoundary, ...)
│   ├── layout/         # App shell (Sidebar, Header, MobileHeader, BottomNav, Footer, ...)
│   ├── camera/         # Camera capture sub-components (CameraLiveVideoFeed, CameraLiveOverlay, ...)
│   └── AppRouter.jsx   # Tab-based router dengan RBAC (ACCESS_CONTROL map)
│
└── pages/              # Page-level orchestrators — 1 Page = 1 orchestrator tipis
    │
    ├── Dashboard/
    │   ├── DashboardPage.jsx
    │   ├── hooks/
    │   │   ├── useClusterStops.js      # Seleksi + nearest-neighbor ordering stops
    │   │   └── useRoadDirections.js    # Fetch road path dari Google DirectionsService
    │   └── components/
    │       ├── GoogleClusterRouteMap.jsx  # Orchestrator peta (logic ada di hooks)
    │       ├── ClusterMapLegend.jsx / SelectedSalesMapHeader.jsx
    │       └── ...
    │
    ├── Sales/
    │   ├── SalesPage.jsx / SalesFieldView.jsx
    │   ├── hooks/
    │   │   └── useOffPjpCheckIn.js     # State machine form absen luar RJP (GPS + geocode)
    │   └── components/
    │       ├── SalesModals.jsx            # Modal dispatcher
    │       ├── AbsenOffPjpModal.jsx       # Orchestrator modal (state di hook)
    │       ├── OffPjpIdentityForm.jsx     # Child: form identitas outlet + alamat GPS
    │       └── ... (atomic child components)
    │
    ├── Supervisor/
    │   ├── SupervisorPage.jsx
    │   ├── hooks/useSupervisorFieldVisits.js
    │   └── components/
    │       ├── SupervisorFieldView.jsx        # Parent
    │       ├── SpvKpiCard / SpvMetricsGrid / SpvModeSelector / SpvStopCard (children)
    │       ├── SpvFieldModals.jsx             # Modal dispatcher
    │       ├── SupervisorPerformanceAnalytics.jsx  # Orchestrator analitik
    │       ├── ComplianceKpiCards.jsx       # Child: header + 4 KPI kepatuhan
    │       ├── AdherenceGauge.jsx           # Child: gauge distribusi RJP vs luar RJP
    │       ├── SalesRepProgressCard.jsx     # Child: kartu progres 1 sales rep
    │       └── ...
    │
    ├── RoutePlanning/
    │   ├── RoutePlanningPage.jsx            # Orchestrator tipis (tab + modal)
    │   ├── hooks/useSalesRouteSelection.js  # Seleksi sales & hari + filter stops
    │   └── components/
    │       ├── RjpRoleTabBar.jsx        # Child: tab bar navigasi per role
    │       ├── SalesViewTab.jsx         # Child: konten tab pratinjau rute sales
    │       ├── MapDirectoryTab.jsx      # Child: peta + direktori tim
    │       ├── ops/  (RjpOpsHeader, MasterClusterTable, CreateClusterModal, ...)
    │       ├── spv/  (WeeklyRollingMatrixTable, MobileMatrixFilters,
    │       │         MobileMatrixSalesCard, RollingMatrixRow, RollingMatrixCell, ...)
    │       └── sales/ (SalesDailyRouteSummaryCard, SalesRollingScheduleView)
    │
    ├── Delivery/ / Admin/ / OpsManager/ / TeamTracking/ / Reports/ / Login/ / Home.jsx
```

---

## 🔑 Prinsip yang Diterapkan

### S — Single Responsibility
| Sebelum | Sesudah |
|--------|-------|
| `mockData.js` 776 baris campur semua domain | Dipecah per domain: `usersData`, `salesStopsData`, `teamsData`, `routesData`, `productsData` + barrel `data/index.js` |
| `SupervisorPerformanceAnalytics` 261 baris (header + KPI + gauge + rep cards inline) | Orchestrator + `ComplianceKpiCards`, `AdherenceGauge`, `SalesRepProgressCard` |
| `GoogleClusterRouteMap` 384 baris (map config + sorting + directions inline) | Orchestrator + `useClusterStops`, `useRoadDirections`, `constants/maps.js` |
| `AbsenOffPjpModal` 337 baris (form state + geocode + UI inline) | Orchestrator + `useOffPjpCheckIn` (hook) + `OffPjpIdentityForm` (child) |
| `RoutePlanningPage` 267 baris (tab config + selection logic + tab UI inline) | Orchestrator + `RJP_ROLE_TAB_MAP` (constant), `useSalesRouteSelection` (hook), `RjpRoleTabBar` / `SalesViewTab` / `MapDirectoryTab` (children) |
| `WeeklyRollingMatrixTable` 204 baris (desktop + mobile view inline) | Parent + `MobileMatrixFilters`, `MobileMatrixSalesCard` children |
| `SupervisorFieldView` (KPI, mode selector, stop cards, modals inline) | Parent + `SpvKpiCard`, `SpvMetricsGrid`, `SpvModeSelector`, `SpvStopCard`, `SpvFieldModals` |

### O — Open/Closed
- `RJP_ROLE_TAB_MAP` — tambah tab role baru secara deklaratif tanpa ubah routing logic
- `notificationService` — swap `alert` → toast library tanpa menyentuh consumer
- `ACCESS_CONTROL` map di `AppRouter` — tambah restricted tab baru tanpa ubah logic

### L — Liskov Substitution
- Semua page component interchangeable di `AppRouter` (kontrak sama: tanpa props wajib selain optional `searchQuery`)

### I — Interface Segregation
- Setiap hook hanya expose state/actions domainnya (`useModal`: `openModal`, `closeModal`, `isOpen`, `modalType`, `payload`)

### D — Dependency Inversion
- Component bergantung pada abstraksi `useApp()` context & services, bukan implementasi state konkret

---

## 🧩 Component Hierarchy Convention

```
Page (1 file = 1 orchestrator tipis)
  └── Parent Component (1 file = 1 section)
        └── Child Component (1 file = 1 UI element terkecil)
```

Aturan:
- **1 file = 1 component** (class atau functional).
- Business logic → custom hook (`hooks/` global atau `pages/<Page>/hooks/` lokal).
- Data (mock sekalipun) → `data/` atau `constants/`, tidak inline di JSX.
- Umumnya 1 file ≤ 100 baris (30–70 baris).

Contoh:
```
RoutePlanningPage.jsx (orchestrator)
  ├── RjpRoleTabBar.jsx
  ├── SalesViewTab.jsx
  │     ├── SalesDailyRouteSummaryCard.jsx
  │     └── SalesRollingScheduleView.jsx
  ├── WeeklyRollingMatrixTable.jsx (parent)
  │     ├── RollingMatrixRow.jsx → RollingMatrixCell.jsx
  │     ├── MobileMatrixFilters.jsx
  │     └── MobileMatrixSalesCard.jsx
  └── hooks/useSalesRouteSelection.js
```

## 📦 Barrel Exports

```js
import { Button, AccessDenied } from '../components/common';
import { INITIAL_SALES_STOPS, INITIAL_USERS } from '../data';
```

Available: `components/common/index.js`, `hooks/index.js`, `services/index.js`, `constants/index.js`, `data/index.js`.
