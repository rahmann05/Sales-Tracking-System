import { AppContent } from "./AppContent";
import React from 'react';
import { AppProvider } from './context/AppContext';
import { MapProvider } from './context/MapContext';
import { MapDataProvider } from './context/MapDataContext';
/**
 * AppContent Component
 * Single Responsibility: Compose the app shell (layout + routing) for authenticated users.
 *
 * IMPORTANT: activeTab / setActiveTab come ONLY from AppContext so that any component
 * (e.g. RoutePlanningPage) can call useApp().setActiveTab() and the router reacts.
 */

/**
 * App Root Component
 * Single Responsibility: Provide global context and render the app shell.
 */
export default function App() {
  return <AppProvider>
      <MapProvider>
        <MapDataProvider>
          <AppContent />
        </MapDataProvider>
      </MapProvider>
    </AppProvider>;
}
