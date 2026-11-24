import { useFeaturePolicy } from '../../shared/hooks/useFeaturePolicy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { setWorkspaceValues } from '../../shared/utils/workspaceNavigation';
import { outletsApi } from '../../services/api';
import { TAB_IDS } from '../../constants/navigation';
import { useOutletDirectory } from './useOutletDirectory';
import { OutletDirectory } from './OutletDirectory';
import { OutletProfile } from './OutletProfile';
import { OutletFormModal } from './OutletFormModal';
import { OutletReviewRequest } from './OutletReviewRequest';
import { confirmWorkspaceNavigation } from '../../shared/utils/confirmWorkspaceNavigation';
import '../../styles/pages/OutletWorkspace.css';

export function OutletManagementPage() {
  const featurePolicy = useFeaturePolicy('OUTLET_MASTER');
  const reviewPolicy = useFeaturePolicy('OUTLET_REVIEW');
  const { user, setActiveTab } = useApp(),
    d = useOutletDirectory(),
    [selected, setSelected] = useWorkspaceState('outletId', ''),
    [profile, setProfile] = useState(null),
    [profileError, setProfileError] = useState(''),
    [profileLoading, setProfileLoading] = useState(false),
    [editing, setEditing] = useState(null),
    [batchOutlets, setBatchOutlets] = useState([]),
    [batchOpen, setBatchOpen] = useState(false),
    [feedback, setFeedback] = useState('');
  const version = useRef(0),
    canManage = ['ADMIN', 'SUPERVISOR'].includes(user.role)
      ? user.permissions?.can_manage_outlets !== false
      : Boolean(user.permissions?.can_manage_outlets),
    canValidate = Boolean(user.permissions?.can_validate_outlet) && reviewPolicy.canStart,
    canAccessRjp =
      ['ADMIN', 'SUPERVISOR'].includes(user.role) && user.permissions?.can_access_rjp !== false,
    batchLimit = Number(reviewPolicy.settings?.OUTLET_REVIEW_BATCH_LIMIT || 30);
  const reloadProfile = useCallback(async () => {
    if (!selected) {
      setProfile(null);
      return;
    }
    const current = ++version.current;
    setProfileLoading(true);
    setProfileError('');
    try {
      const r = await outletsApi.profile(selected);
      if (current === version.current) setProfile(r.data);
    } catch (e) {
      if (current === version.current) {
        setProfileError(e.message);
        setProfile(null);
      }
    } finally {
      if (current === version.current) setProfileLoading(false);
    }
  }, [selected]);
  useEffect(() => {
    reloadProfile();
    return () => {
      version.current++;
    };
  }, [reloadProfile]);
  const select = (value) => {
    if (confirmWorkspaceNavigation()) setSelected(value);
  };
  useEffect(() => {
    if (profile?.id === selected)
      document
        .getElementById('outlet-profile')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [selected, profile?.id]);
  const saved = async (outlet) => {
    setEditing(null);
    setFeedback(
      outlet?.queued
        ? 'Usulan perubahan diantrekan. Pantau hasilnya pada Riwayat outlet.'
        : 'Data outlet berhasil disimpan.'
    );
    window.dispatchEvent(new CustomEvent('operational-data-changed'));
    await d.load();
    if (outlet?.id) setSelected(outlet.id, { replace: true });
    await reloadProfile();
  };
  const toggleBatch = (outlet) => {
    setBatchOutlets((prev) =>
      prev.some((o) => o.id === outlet.id)
        ? prev.filter((o) => o.id !== outlet.id)
        : prev.length < batchLimit
          ? [...prev, outlet]
          : prev
    );
  };
  const selectPageBatch = (eligible = []) => {
    setBatchOutlets((prev) => {
      const merged = [...new Map([...prev, ...eligible].map((o) => [o.id, o])).values()];
      return merged.slice(0, batchLimit);
    });
  };
  const clearBatch = () => setBatchOutlets([]);
  return (
    <main className="workspace-page outlet-workspace">
      <header className="outlet-page-heading">
        <div>
          <p className="outlet-eyebrow">Pelanggan / Data operasional</p>
          <h1>Master outlet</h1>
          <p>
            Temukan outlet, periksa kualitas data &amp; titik GPS, dan hubungkan langsung ke wilayah
            cluster maupun Planner PJP.
          </p>
        </div>
        <div className="app-actions">
          <button
            type="button"
            className="app-button"
            onClick={() => setActiveTab(TAB_IDS.OUTLET_APPROVAL)}
          >
            Pengajuan outlet
          </button>
          {Boolean(user.permissions?.can_validate_outlet) && (
            <button
              type="button"
              className="app-button"
              onClick={() => setActiveTab(TAB_IDS.OUTLET_VALIDATION)}
            >
              Validasi outlet
            </button>
          )}
          {canAccessRjp && (
            <button
              type="button"
              className="app-button"
              onClick={() => setActiveTab(TAB_IDS.ROUTE_PLANNING)}
            >
              Wilayah &amp; PJP
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="app-button app-button-primary"
              disabled={!featurePolicy.canStart}
              title={featurePolicy.reason}
              onClick={() => setEditing({ create: true })}
            >
              Tambah outlet
            </button>
          )}
        </div>
      </header>
      {feedback && (
        <div className="outlet-notice" role="status">
          {feedback}
          <button type="button" onClick={() => setFeedback('')} aria-label="Tutup pemberitahuan">
            ×
          </button>
        </div>
      )}
      <div className={`outlet-master-layout ${selected ? 'has-detail' : ''}`}>
        <OutletDirectory
          directory={d}
          selected={selected}
          onSelect={select}
          user={user}
          canBatchValidate={canValidate}
          batchLimit={batchLimit}
          selectedBatchIds={batchOutlets.map((o) => o.id)}
          onToggleBatch={toggleBatch}
          onSelectPageBatch={selectPageBatch}
          onClearBatch={clearBatch}
          onOpenBatch={() => setBatchOpen(true)}
        />
        {selected && (
          <section
            id="outlet-profile"
            className="outlet-panel outlet-profile"
            aria-label="Profil outlet"
          >
            <div className="outlet-list-heading">
              <button type="button" className="app-button" onClick={() => select('')}>
                Kembali ke daftar
              </button>
              <button
                type="button"
                className="app-button"
                onClick={() => {
                  if (confirmWorkspaceNavigation()) reloadProfile();
                }}
                disabled={profileLoading}
              >
                Perbarui profil
              </button>
            </div>
            {profileLoading ? (
              <p className="app-empty" role="status">
                Memuat profil…
              </p>
            ) : profileError ? (
              <p className="app-error" role="alert">
                {profileError}
              </p>
            ) : (
              profile && (
                <OutletProfile
                  onRefresh={reloadProfile}
                  outlet={profile}
                  canManage={canManage}
                  canEdit={canManage && featurePolicy.canStart}
                  onEdit={() => setEditing(profile)}
                  onSaved={saved}
                />
              )
            )}
          </section>
        )}
      </div>
      {editing && (
        <OutletFormModal
          outlet={editing.create ? null : editing}
          clusters={d.clusters}
          clusterError={d.clusterError}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {batchOpen && batchOutlets.length > 0 && (
        <OutletReviewRequest
          outlets={batchOutlets}
          onClose={() => setBatchOpen(false)}
          onSaved={async (reviews) => {
            setBatchOpen(false);
            clearBatch();
            window.dispatchEvent(new CustomEvent('operational-data-changed'));
            await d.load();
            if (reviews?.length === 1 && reviews[0]?.id) {
              setWorkspaceValues(
                { outletReview: reviews[0].id, outletValidationTab: 'QUEUE' },
                { tab: TAB_IDS.OUTLET_VALIDATION }
              );
              setActiveTab(TAB_IDS.OUTLET_VALIDATION);
            } else if (!reviews?.length) {
              setWorkspaceValues(
                { outletValidationTab: 'JOBS', outletReview: '' },
                { tab: TAB_IDS.OUTLET_VALIDATION }
              );
              setActiveTab(TAB_IDS.OUTLET_VALIDATION);
            } else {
              setFeedback(
                `${reviews.length} kasus validasi dibuka. Tinjau antreannya di Validasi outlet.`
              );
            }
          }}
        />
      )}
    </main>
  );
}
