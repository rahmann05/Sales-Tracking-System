import React, { useEffect, useState } from 'react';
import { clustersApi, usersApi } from '../../../services/api';
import { notifySuccess, notifyError } from '../../../services/notificationService';

const DAY_LABELS = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' };

const btnStyle = (color = '#2563eb') => ({
  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, background: color, color: '#fff',
});

const thStyle = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' };
const tdStyle = { padding: '8px 12px', fontSize: 13, color: '#111827' };

/**
 * ClusterGeneratePanel
 * Generate jadwal mingguan otomatis + preview per sales + daftar hasil.
 */
export const ClusterGeneratePanel = () => {
  const [salesList, setSalesList] = useState([]);
  const [selectedSales, setSelectedSales] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [generateResult, setGenerateResult] = useState(null);

  useEffect(() => {
    usersApi.getAll({ role: 'SALES' })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSalesList(list.map((u) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const payload = selectedSales ? { salesIds: [selectedSales] } : {};
      const res = await clustersApi.generate(payload);
      const data = res?.data || res;
      setGenerateResult(data);
      notifySuccess(`Jadwal berhasil di-generate untuk ${data.generated} sales.`);
    } catch (e) {
      notifyError(e.message || 'Gagal generate jadwal');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedSales) return notifyError('Pilih sales terlebih dahulu untuk preview');
    setPreviewing(true);
    setPreviewData(null);
    try {
      const res = await clustersApi.preview(selectedSales);
      setPreviewData(res?.data || res);
    } catch (e) {
      notifyError(e.message || 'Gagal memuat preview');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>Generate Jadwal Kunjungan Mingguan</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Senin–Sabtu, Sabtu 50% outlet, diurutkan berdasarkan kedekatan geografis</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 600 }}
            value={selectedSales}
            onChange={(e) => { setSelectedSales(e.target.value); setPreviewData(null); }}
          >
            <option value="">Semua Sales</option>
            {salesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSales && (
            <button style={btnStyle('#0891b2')} onClick={handlePreview} disabled={previewing}>
              {previewing ? 'Memuat...' : 'Preview'}
            </button>
          )}
          <button style={btnStyle()} onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Jadwal'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {previewData && (
        <div style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff', padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8', marginBottom: 10 }}>
            Preview: {previewData.salesName} — {previewData.totalOutlets} outlet
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {(previewData.plan || []).map((d) => (
              <div key={d.day} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#374151' }}>{DAY_LABELS[d.day] || d.day}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{d.clusterName}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>{d.outlets?.length ?? 0} outlet</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.totalDistanceKm} km</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Result */}
      {generateResult && (
        <div style={{ borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: '#15803d', borderBottom: '1px solid #bbf7d0' }}>
            Hasil Generate — Minggu {new Date(generateResult.weekStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}({generateResult.generated} sales berhasil)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>Sales</th>
                  {['senin','selasa','rabu','kamis','jumat','sabtu'].map((d) => (
                    <th key={d} style={{ ...thStyle, textAlign: 'center' }}>{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(generateResult.details || []).map((r) => (
                  <tr key={r.salesId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      {r.salesName}
                      {r.skipped && <span style={{ marginLeft: 6, fontSize: 11, color: '#dc2626' }}>({r.reason})</span>}
                    </td>
                    {(r.days || []).map((d) => (
                      <td key={d.day} style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                          {d.outletCount}
                        </span>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{d.totalDistanceKm}km</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterGeneratePanel;
