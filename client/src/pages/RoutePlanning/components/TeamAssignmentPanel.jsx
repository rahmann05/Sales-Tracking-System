import { useDomainPermission } from '../../../shared/hooks/useDomainPermission';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { teamsApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DataTable } from '../../../shared/components/common/DataTable';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
export function TeamAssignmentPanel({ onChanged }) {
  const featurePolicy = useFeaturePolicy('TEAMS');
  const { user } = useApp();
  const canAssign = useDomainPermission('ASSIGN_TEAM');
  const [source, setSource] = useState({ sales: [], supervisors: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [supervisorId, setSupervisorId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('assigned');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortBy, setSortBy] = useState(user.role === 'ADMIN' ? 'team-asc' : 'name-asc');
  const revision = useRef(0);
  const load = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setError('');
    try {
      const res = await teamsApi.getAll();
      if (current === revision.current) setSource(res.data);
    } catch (e) {
      if (current === revision.current) setError(e.message);
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    return () => {
      revision.current++;
    };
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    if (!canAssign) return;
    setBusy(true);
    setError('');
    try {
      await teamsApi.assign(selected.id, {
        supervisorId: supervisorId || null,
        updatedAt: selected.updatedAt,
        reason,
      });
      await load();
      await onChanged?.();
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const assigned = source.sales.filter((s) => s.supervisorId);
  const unassigned = source.sales.filter((s) => !s.supervisorId);
  const baseList =
    scope === 'unassigned' ? unassigned : scope === 'all' ? source.sales : assigned;
  const compareText = (a, b) =>
    String(a || '').localeCompare(String(b || ''), 'id-ID', { sensitivity: 'base' });
  const visible = baseList
    .filter((s) => {
      if (user.role === 'ADMIN' && scope !== 'unassigned' && teamFilter && s.supervisorId !== teamFilter) {
        return false;
      }
      const clusters = (s.assignedClusters || []).map((c) => c.name).join(' ');
      const haystack = `${s.name} ${s.email} ${s.supervisor?.name || ''} ${clusters}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const teamA = a.supervisor?.name || '';
      const teamB = b.supervisor?.name || '';
      const areaA = (a.assignedClusters || []).map((c) => c.name).join(', ');
      const areaB = (b.assignedClusters || []).map((c) => c.name).join(', ');
      if (sortBy === 'team-asc' || sortBy === 'team-desc') {
        if (!teamA && teamB) return 1;
        if (teamA && !teamB) return -1;
        const byTeam = sortBy === 'team-desc' ? compareText(teamB, teamA) : compareText(teamA, teamB);
        if (byTeam !== 0) return byTeam;
        return compareText(a.name, b.name);
      }
      if (sortBy === 'area-asc') {
        if (!areaA && areaB) return 1;
        if (areaA && !areaB) return -1;
        const byArea = compareText(areaA, areaB);
        if (byArea !== 0) return byArea;
        return compareText(a.name, b.name);
      }
      if (sortBy === 'name-desc') return compareText(b.name, a.name);
      return compareText(a.name, b.name);
    });
  const open = (s) => {
    setSelected(s);
    setSupervisorId(user.role === 'SUPERVISOR' ? user.id : s.supervisorId || '');
    setReason('');
    setError('');
  };
  return (
    <section
      className="workspace-section space-y-4"
      aria-label={user.role === 'SUPERVISOR' ? 'Sales bawahan' : 'Penugasan supervisor'}
    >
      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}
      <div className="app-filter-grid">
        <label className="app-field">
          Cari sales
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama, email, atau wilayah"
          />
        </label>
        <label className="app-field">
          Keanggotaan
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="assigned">
              {user.role === 'SUPERVISOR' ? 'Tim saya' : 'Sudah ditugaskan'} ({assigned.length})
            </option>
            <option value="unassigned">Belum memiliki tim ({unassigned.length})</option>
            {user.role === 'ADMIN' && (
              <option value="all">Semua sales ({source.sales.length})</option>
            )}
          </select>
        </label>
        {user.role === 'ADMIN' && (
          <label className="app-field">
            Tim / Supervisor
            <select
              value={scope === 'unassigned' ? '' : teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              disabled={scope === 'unassigned'}
            >
              <option value="">Semua tim</option>
              {source.supervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="app-field">
          Urutkan
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {user.role === 'ADMIN' && (
              <>
                <option value="team-asc">Sesuai tim (A–Z)</option>
                <option value="team-desc">Sesuai tim (Z–A)</option>
              </>
            )}
            <option value="name-asc">Nama sales (A–Z)</option>
            <option value="name-desc">Nama sales (Z–A)</option>
            <option value="area-asc">Wilayah tugas (A–Z)</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" className="app-button" onClick={load} disabled={loading}>
            Muat ulang
          </button>
        </div>
      </div>
      {loading ? (
        <p role="status">Memuat tim…</p>
      ) : (
        <div className="overflow-x-auto mobile-card-table-wrapper">
          <DataTable className="mobile-card-table">
            <thead>
              <tr>
                <th>Sales</th>
                {user.role === 'ADMIN' && <th>Supervisor</th>}
                <th>Wilayah tugas</th>
                <th>Penugasan</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id}>
                  <td data-label="Sales">
                    <div>
                      <strong>{s.name}</strong>
                      <div>{s.email}</div>
                    </div>
                  </td>
                  {user.role === 'ADMIN' && (
                    <td data-label="Supervisor">{s.supervisor?.name || 'Belum ditugaskan'}</td>
                  )}
                  <td data-label="Wilayah tugas">
                    {s.assignedClusters.map((c) => c.name).join(', ') || 'Belum ada wilayah'}
                  </td>
                  <td data-label="Penugasan" className="mobile-full-width">
                    {canAssign &&
                    (user.role === 'ADMIN' || (!s.supervisorId && source.canClaim)) ? (
                      <button
                        className="app-button"
                        disabled={!featurePolicy.canStart}
                        title={featurePolicy.reason}
                        onClick={() => open(s)}
                      >
                        {s.supervisorId ? 'Ubah tim' : 'Tambahkan ke tim'}
                      </button>
                    ) : (
                      <span className="app-status">Anggota tim</span>
                    )}
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? 4 : 3}>
                    {search
                      ? 'Tidak ada sales yang cocok dengan pencarian.'
                      : scope === 'unassigned'
                        ? 'Semua sales dalam akses Anda sudah memiliki tim.'
                        : 'Belum ada anggota tim. Pilih sales yang belum ditugaskan atau hubungi admin.'}
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>
      )}
      <NativeDialog
        open={Boolean(selected)}
        title={`Penugasan ${selected?.name || ''}`}
        busy={busy}
        onClose={() => setSelected(null)}
      >
        <form onSubmit={save} className="app-form">
          <p>
            Transfer akan melepas wilayah di luar tim tujuan dan mengosongkan template mendatang.
            PJP dan absensi yang sudah terbentuk tetap disimpan.
          </p>
          {error && (
            <p role="alert" className="app-error">
              {error}
            </p>
          )}
          {user.role === 'ADMIN' ? (
            <label className="app-field">
              Supervisor
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                disabled={user.role !== 'ADMIN'}
              >
                <option value="">Tanpa tim</option>
                {source.supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>
              Supervisor: <strong>{user.name}</strong>
            </p>
          )}
          <label className="app-field">
            Alasan penugasan
            <textarea
              required
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="app-actions">
            <button
              type="button"
              className="app-button"
              onClick={() => setSelected(null)}
              disabled={busy}
            >
              Batal
            </button>
            <button
              className="app-button app-button-primary"
              disabled={busy || !featurePolicy.canStart || !canAssign}
              title={featurePolicy.reason}
            >
              {busy ? 'Menyimpan…' : 'Simpan penugasan'}
            </button>
          </div>
        </form>
      </NativeDialog>
    </section>
  );
}
