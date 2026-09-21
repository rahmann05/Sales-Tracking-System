import { useState } from 'react';

/**
 * useDomainState - Core domain state containers.
 * Single Responsibility: owns the shared domain state slices
 * (stops, orders, teams, routes, products, incidents, ...)
 * and provides a single reset for auth logout/expiration.
 */
export const useDomainState = () => {
  // Sales Daily PJP Stops (diisi dari PostgreSQL saat login)
  const [salesStops, setSalesStops] = useState([]);
  // Supervisor Teams List (dari PostgreSQL)
  const [supervisorTeams, setSupervisorTeams] = useState([]);
  // Field Team Members List (dari PostgreSQL)
  const [teamMembers, setTeamMembers] = useState([]);
  // Dashboard Active Routes List (diisi dari PostgreSQL)
  const [activeRoutes, setActiveRoutes] = useState([]);
  // Master PJP Routes List (Route Planning) - diisi dari PostgreSQL
  const [masterRoutes, setMasterRoutes] = useState([]);
  // Detailed Sales Reps List (dari PostgreSQL)
  const [salesList, setSalesList] = useState([]);
  // Tim RJP / Tim Kunjungan List (dari PostgreSQL)
  const [rjpTeams, setRjpTeams] = useState([]);
  // Off-PJP Store Absen Records (diisi dari PostgreSQL)
  const [offPjpAttendances, setOffPjpAttendances] = useState([]);
  // Sales Orders List
  const [orders, setOrders] = useState([]);
  // Master Products List
  const [products, setProducts] = useState([]);
  // Store incidents (closed shop reports, unlock requests, etc.)
  const [incidents, setIncidents] = useState([]);

  // Reset state saat token kadaluwarsa atau logout
  const resetDomainState = () => {
    setSalesStops([]);
    setOrders([]);
    setProducts([]);
    setActiveRoutes([]);
    setSupervisorTeams([]);
    setTeamMembers([]);
  };

  return {
    salesStops, setSalesStops,
    supervisorTeams, setSupervisorTeams,
    teamMembers, setTeamMembers,
    activeRoutes, setActiveRoutes,
    masterRoutes, setMasterRoutes,
    salesList, setSalesList,
    rjpTeams, setRjpTeams,
    offPjpAttendances, setOffPjpAttendances,
    orders, setOrders,
    products, setProducts,
    incidents, setIncidents,
    resetDomainState,
  };
};
