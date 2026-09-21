import React, { useState, useEffect } from 'react';
import { LuNavigation } from 'react-icons/lu';
import { FiXCircle } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';

/**
 * CreateRjpTeamModal Component (Single Responsibility: Modal for creating RJP Teams)
 * 1 File per Component
 */
export const CreateRjpTeamModal = ({ user, isSupervisor, onClose, onSubmit }) => {
  const { clusters } = useApp();
  const [newRjpName, setNewRjpName] = useState('Tim RJP Padalarang & Ngamprah');
  const [newRjpSpv, setNewRjpSpv] = useState(user.role === 'SUPERVISOR' ? user.name : 'Ahmad Subagja');
  const [newRjpCluster, setNewRjpCluster] = useState('');
  const [newRjpMembers, setNewRjpMembers] = useState('Budi Santoso, Siti Rahma');
  const [newRjpRoutes, setNewRjpRoutes] = useState(8);

  useEffect(() => {
    if (clusters?.length > 0 && !newRjpCluster) {
      setNewRjpCluster(clusters[0].name);
    }
  }, [clusters]);

  const handleSubmit = () => {
    if (!newRjpName) {
      alert('Mohon isi nama Tim RJP.');
      return;
    }
    const memberArray = newRjpMembers.split(',').map((m) => m.trim());
    onSubmit({
      name: newRjpName,
      spvName: newRjpSpv,
      cluster: newRjpCluster,
      memberSalesNames: memberArray,
      routesCount: Number(newRjpRoutes) || 6,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg space-y-4">
        <div className="modal-header">
          <div>
            <h3 className="section-title">Buat Tim RJP / Kunjungan Baru</h3>
            <p className="card-subtitle">Wewenang: Supervisor & Admin</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="label-bold">Nama Tim RJP / Kunjungan:</label>
            <input
              type="text"
              value={newRjpName}
              onChange={(e) => setNewRjpName(e.target.value)}
              placeholder="Misal: Tim RJP Padalarang Utara Shift Pagi"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-bold">Supervisor Penanggung Jawab:</label>
              <input
                type="text"
                value={newRjpSpv}
                onChange={(e) => setNewRjpSpv(e.target.value)}
                className="form-input"
                disabled={isSupervisor}
              />
            </div>

            <div className="space-y-1">
              <label className="label-bold">Jumlah Rute PJP Outlet:</label>
              <input
                type="number"
                value={newRjpRoutes}
                onChange={(e) => setNewRjpRoutes(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-bold">Klaster Wilayah RJP (Definisi Supervisor):</label>
            <select
              value={newRjpCluster}
              onChange={(e) => setNewRjpCluster(e.target.value)}
              className="form-select text-xs"
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.region})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label-bold">Daftar Anggota Sales (Pisahkan Komma):</label>
            <input
              type="text"
              value={newRjpMembers}
              onChange={(e) => setNewRjpMembers(e.target.value)}
              placeholder="Budi Santoso, Siti Rahma"
              className="form-input"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary w-full py-3"
        >
          <LuNavigation className="text-base" />
          <span>Simpan & Terbitkan Tim RJP Baru</span>
        </button>
      </div>
    </div>
  );
};
