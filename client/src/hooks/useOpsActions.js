import { routeChangesApi } from '../services/api';

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

  const handleCreateRjpTeam = async (payload) => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Tim RJP saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['MANAJER_OPERASIONAL', 'ADMIN'],
    });
  };

  const handleCreateMasterRoute = async (payload) => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Master Route saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['MANAJER_OPERASIONAL', 'ADMIN'],
    });
  };

  const handleOpsManagerRerouteDecision = async ({ incidentId, approved }) => {
    try {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return;

      if (approved) {
        const res = await routeChangesApi.approveReroute(incidentId);
        const newStop = res.data?.createdPjpStop; // Server returns the newly created PjpStop

        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_REROUTE_APPROVED' } : i))
        );

        if (newStop && setSalesStops) {
          setSalesStops((prev) => [...prev, newStop]);
        }

        addNotification({
          title: 'Perubahan Rute Disetujui!',
          message: `Manajer Operasional menyetujui penggantian rute. Rute sales telah diperbarui.`,
          roleTarget: ['SALES', 'SUPERVISOR'],
        });
      } else {
        // Technically, Ops Manager rejects it, so it should call routeChangesApi.rejectReroute()
        // But for now, we map it to RESOLVED_SKIP if not approved, or simply call an API for reject
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_SKIP' } : i))
        );
      }
    } catch (err) {
      console.warn('[API] Ops Reroute Decision error:', err.message);
      addNotification({
        title: 'Gagal Memproses Reroute',
        message: err.message,
        roleTarget: ['MANAJER_OPERASIONAL', 'ADMIN'],
      });
    }
  };

  return {
    handleCreateRjpTeam,
    handleCreateMasterRoute,
    handleOpsManagerRerouteDecision,
  };
};
