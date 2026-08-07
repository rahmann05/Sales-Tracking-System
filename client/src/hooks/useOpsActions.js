/**
 * Custom hook containing all business logic for Ops Manager actions.
 */
export const useOpsActions = ({
  user,
  rjpTeams,
  setRjpTeams,
  masterRoutes,
  setMasterRoutes,
  incidents,
  setIncidents,
  salesStops,
  setSalesStops,
  addNotification
}) => {

  const handleCreateRjpTeam = ({ name, spvName, cluster, memberSalesNames, routesCount }) => {
    const newTeam = {
      id: `rjp-team-${Date.now()}`,
      name,
      spvName: spvName || user.name,
      cluster: cluster || 'Klaster Cimahi & Bandung Barat',
      memberSalesNames: memberSalesNames || ['Budi Santoso'],
      routesCount: routesCount || 6,
      createdAt: new Date().toISOString().substring(0, 10),
      createdBy: `${user.name} (${user.roleLabel})`,
    };
    setRjpTeams((prev) => [newTeam, ...prev]);

    addNotification({
      title: 'Tim RJP / Kunjungan Baru Dibuat',
      message: `Tim RJP "${newTeam.name}" berhasil dibuat oleh ${user.name}`,
      roleTarget: ['SUPERVISOR', 'OPERATIONAL_MANAGER', 'SALES'],
    });
  };

  const handleCreateMasterRoute = ({ name, rep }) => {
    const newRoute = {
      id: `R-${Math.floor(100 + Math.random() * 900)}`,
      name: name || 'Rute PJP Baru Cimahi',
      rep: rep || user.name || 'Sales Rep',
      stops: 6,
      completion: '0%',
      status: 'Scheduled',
    };
    setMasterRoutes((prev) => [newRoute, ...prev]);
    addNotification({
      title: 'Master RJP Dibuat',
      message: `Master RJP baru "${newRoute.name}" ditambahkan oleh ${user.name}`,
      roleTarget: ['SUPERVISOR', 'OPERATIONAL_MANAGER'],
    });
  };

  const handleOpsManagerRerouteDecision = ({ incidentId, approved }) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    if (approved) {
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_REROUTE_APPROVED' } : i))
      );

      const newStop = {
        id: `stop-replaced-${Date.now()}`,
        sequence: salesStops.length + 1,
        outletCode: `OTL-REP-${Math.floor(100 + Math.random() * 900)}`,
        outletName: incident.newOutletName || 'Toko Pengganti Baru',
        owner: 'Bpk. Pengganti',
        phone: '0812-9999-0000',
        address: 'Jl. Raya Cimahi KBB',
        latitude: -6.872,
        longitude: 107.542,
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

  return {
    handleCreateRjpTeam,
    handleCreateMasterRoute,
    handleOpsManagerRerouteDecision,
  };
};
