# Frontend Architecture — Sinar Anugrah Sales Tracking System

> Refactored with SOLID principles, clean code, and modular design.

---

## 📁 Directory Structure

```
client/src/
├── constants/          # Immutable configuration (roles, navigation)
│   ├── roles.js        # Role definitions & access-control matrices
│   ├── navigation.js   # Tab registry & role-based nav builder
│   └── index.js        # Barrel export
│
├── context/            # Global state (React Context)
│   └── AppContext.jsx  # AppProvider composing domain action hooks
│
├── hooks/              # Custom React hooks (1 hook = 1 concern)
│   ├── useAuth.js           # Authentication state
│   ├── useTabNavigation.js  # Active tab management
│   ├── useSearch.js         # Search query state
│   ├── useModal.js          # Modal open/close + payload
│   ├── useSalesActions.js   # Sales business logic
│   ├── useSupervisorActions.js
│   ├── useOpsActions.js
│   ├── useAdminActions.js
│   ├── useDeliveryActions.js
│   ├── useRjpManagement.js
│   ├── useSupervisorRollingMatrix.js
│   ├── useLogisticsDispatch.js
│   ├── useGeofence.js
│   ├── useDeviceCamera.js
│   ├── useLiveClock.js
│   ├── useApi.js
│   ├── useOutletLockStatus.js
│   ├── useRouteFilter.js
│   └── index.js        # Barrel export
│
├── services/           # External I/O & API layer
│   ├── api.js                  # HTTP client
│   ├── notificationService.js  # User notifications (replaces alert)
│   ├── cameraSnapshotService.js
│   ├── nativeFileCaptureService.js
│   ├── deviceDetectionService.js
│   ├── googlePlacesService.js
│   ├── logisticsOptimizerService.js
│   ├── rjpOptimizationService.js
│   ├── spreadsheetImportService.js
│   └── index.js        # Barrel export
│
├── components/
│   ├── common/         # Reusable atomic components
│   │   ├── AccessDenied.jsx   # RBAC fallback UI
│   │   ├── EmptyState.jsx     # Consistent empty-state placeholder
│   │   ├── SectionHeader.jsx  # Section title + subtitle
│   │   ├── ErrorBoundary.jsx  # Class component error boundary
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Avatar.jsx
│   │   ├── FeatureCard.jsx
│   │   ├── SignatureCanvas.jsx
│   │   ├── StatusMonitor.jsx
│   │   ├── DeviceCameraCapture.jsx
│   │   └── index.js           # Barrel export
│   │
│   ├── layout/         # App shell layout components
│   │   ├── Sidebar.jsx        # Desktop nav rail (sub-components inside)
│   │   ├── Header.jsx
│   │   ├── MobileHeader.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Footer.jsx
│   │   ├── HomeBanner.jsx
│   │   └── NotificationCenterDropdown.jsx
│   │
│   ├── camera/         # Camera capture sub-components
│   │   ├── CameraLiveVideoFeed.jsx
│   │   ├── CameraLiveOverlay.jsx
│   │   ├── CameraGpsStatusBadge.jsx
│   │   ├── CameraErrorDisplay.jsx
│   │   ├── CapturedPhotoPreview.jsx
│   │   ├── CameraCaptureButton.jsx
│   │   └── CameraNativeFileTrigger.jsx
│   │
│   └── AppRouter.jsx   # Tab-based router with RBAC
│
├── pages/              # Page-level containers
│   ├── Login/
│   ├── Dashboard/
│   ├── Sales/
│   │   ├── SalesPage.jsx        # Thin wrapper → SalesFieldView
│   │   ├── SalesFieldView.jsx   # Orchestrator (uses useModal + SalesModals)
│   │   └── components/
│   │       ├── SalesModals.jsx  # Modal dispatcher (extracted)
│   │       └── ... (atomic child components)
│   ├── Delivery/
│   │   ├── DeliveryPage.jsx     # Orchestrator (uses useModal + DeliveryModals)
│   │   └── components/
│   │       ├── DeliveryModals.jsx # Modal dispatcher (extracted)
│   │       └── ... (atomic child components)
│   ├── Supervisor/
│   │   └── SupervisorPage.jsx   # Uses SectionHeader + EmptyState + useModal
│   ├── Admin/
│   ├── OpsManager/
│   │   └── OpsManagerPage.jsx   # Uses SectionHeader + notificationService
│   ├── RoutePlanning/
│   │   └── RoutePlanningPage.jsx # Uses constants for role-based tabs
│   ├── TeamTracking/
│   ├── Reports/
│   └── Home.jsx
│
├── data/               # Mock/seed data
├── utils/              # Pure utility functions
└── styles/             # CSS files organized by scope
```

---

## 🔑 SOLID Principles Applied

### S — Single Responsibility Principle
| Before | After |
|--------|-------|
| `App.jsx` contained routing + auth + layout | `AppRouter.jsx` (routing), `useAuth` (auth), `App.jsx` (composition) |
| `SalesFieldView` managed 6 modals inline | `SalesModals.jsx` (modal dispatcher), `useModal` (state) |
| `Sidebar` contained nav-item logic inline | `constants/navigation.js` (config), sub-components (UI) |
| Scattered `alert()` calls | `notificationService.js` (centralized) |

### O — Open/Closed Principle
- `notificationService` — swap `alert` for a toast library without touching consumers
- `ACCESS_CONTROL` map in `AppRouter` — add new restricted tabs without modifying routing logic
- `ROLE_TAB_MAP` in `RoutePlanningPage` — add new role tabs declaratively

### L — Liskov Substitution Principle
- All page components are interchangeable in `AppRouter` — they share the same contract (no props required beyond optional `searchQuery`)

### I — Interface Segregation Principle
- Each custom hook exposes only the state/actions relevant to its domain
- `useModal` provides a minimal API: `openModal`, `closeModal`, `isOpen`, `modalType`, `payload`

### D — Dependency Inversion Principle
- Components depend on the `useApp()` context abstraction, not on concrete state implementations
- Services (`api.js`, `notificationService.js`) are imported, not instantiated inline

---

## 📦 Barrel Exports

```js
// Instead of:
import { Button } from '../components/common/Button';
import { AccessDenied } from '../components/common/AccessDenied';

// Use:
import { Button, AccessDenied } from '../components/common';
```

Available barrel exports:
- `components/common/index.js`
- `hooks/index.js`
- `services/index.js`
- `constants/index.js`

---

## 🧩 Component Hierarchy Convention

```
Page (1 file = 1 orchestrator)
  └── Parent Component (1 file = 1 section)
        └── Child Component (1 file = 1 UI element)
```

Example:
```
SalesPage.jsx
  └── SalesFieldView.jsx (orchestrator)
        ├── SalesShiftHeader.jsx (section)
        ├── DailyPjpOverview.jsx (section)
        ├── SalesStopCard.jsx (repeated item)
        └── SalesModals.jsx (modal dispatcher)
              ├── AbsenInModal.jsx
              ├── AbsenOutModal.jsx
              └── ...
```
