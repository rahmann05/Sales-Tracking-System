import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import { confirmWorkspaceNavigation } from '../../../shared/utils/confirmWorkspaceNavigation';
import { outletValidationApi } from '../../../services/api';
import { SalesOutletValidationForm } from '../../Sales/SalesOutletValidationForm';
import { OutletFieldTaskFilters } from './OutletFieldTaskFilters';
import { OutletFieldTaskTable } from './OutletFieldTaskTable';
import { FieldTaskReview } from './FieldTaskReview';
const initial = {
  status: 'ALL',
  search: '',
  ownerId: '',
  reviewerId: '',
  supervisorId: '',
  from: '',
  to: '',
  waitingHours: '0',
  overdue: 'ALL',
};
export function OutletFieldTaskMonitor({ onOpenReview }) {
  const { user } = useApp(),
    sales = user?.role === 'SALES',
    allowed = user?.permissions?.[sales ? 'can_submit_outlet_field' : 'can_review_outlet_field'];
  const [f, setFilters] = useState({ ...initial, status: sales ? 'OPEN' : 'ALL' }),
    [page, setPage] = useState(1),
    [detailVersion, setDetailVersion] = useState(0),
    [data, setData] = useState(null),
    [detail, setDetail] = useState(null),
    [error, setError] = useState(''),
    [detailError, setDetailError] = useState(''),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false);
  const [selected, setSelected] = useWorkspaceState('outletFieldTask', ''),
    debounced = useDebounce(f.search, 250),
    flight = useRef(0),
    hasLoaded = useRef(false);
  const filterKey = JSON.stringify({ ...f, search: debounced });
  const load = useCallback(
    async (forceSpinner = false) => {
      if (!allowed) return;
      const seq = ++flight.current;
      if (!hasLoaded.current || forceSpinner) setBusy(true);
      try {
        const query = { ...JSON.parse(filterKey), page, limit: 25 };
        if (!query.from) delete query.from;
        if (!query.to) delete query.to;
        const r = await outletValidationApi.fieldTasks(query);
        if (seq === flight.current) {
          setData(r.data);
          setError('');
          hasLoaded.current = true;
          if (r.data.pagination.page !== page) setPage(r.data.pagination.page);
        }
      } catch (e) {
        if (seq === flight.current) setError(e.message);
      } finally {
        if (seq === flight.current) setBusy(false);
      }
    },
    [allowed, filterKey, page]
  );
  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), 60000);
    const onChanged = () => load(false);
    window.addEventListener('operational-data-changed', onChanged);
    return () => {
      flight.current++;
      clearInterval(timer);
      window.removeEventListener('operational-data-changed', onChanged);
    };
  }, [load]);
  const loadDetail = useCallback(async () => {
    if (!selected || sales) {
      setDetail(null);
      return;
    }
    const r = await outletValidationApi.fieldTask(selected);
    setDetail(r.data);
    setDetailError('');
  }, [selected, sales]);
  useEffect(() => {
    let current = true;
    if (!selected || sales) {
      setDetail(null);
      return;
    }
    setDetail(null);
    setDetailError('');
    setActionError('');
    outletValidationApi
      .fieldTask(selected)
      .then((r) => {
        if (current) {
          setDetail(r.data);
          setDetailError('');
        }
      })
      .catch((e) => {
        if (current) setDetailError(e.message);
      });
    return () => {
      current = false;
    };
  }, [selected, sales]);
  const select = (id) => {
    if (confirmWorkspaceNavigation()) {
      setDetail(null);
      setSelected(id);
    }
  };
  const change = (key, value) => {
    if (!confirmWorkspaceNavigation()) return;
    setFilters((v) => ({
      ...v,
      [key]: value,
      ...(key === 'supervisorId' ? { ownerId: '' } : {}),
      ...(key === 'waitingHours' && value !== '0' ? { status: 'SUBMITTED', overdue: 'ALL' } : {}),
      ...(key === 'overdue' && value === 'WORK' ? { status: 'OPEN', waitingHours: '0' } : {}),
      ...(key === 'status' ? { waitingHours: '0', overdue: 'ALL' } : {}),
    }));
    setPage(1);
  };
  const act = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await loadDetail();
      await load(true);
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    if (selected && !confirmWorkspaceNavigation()) return;
    setActionError('');
    if (selected) {
      if (sales) setDetailVersion((v) => v + 1);
      else {
        try {
          await loadDetail();
        } catch (e) {
          setDetailError(e.message);
        }
      }
    }
    await load(true);
  };
  if (!allowed) return null;
  return (
    <section className="ov-section" aria-label="Pemantauan tugas validasi Sales">
      <div className="ov-section-heading">
        <div>
          <h2>{sales ? 'Tugas pemeriksaan outlet' : 'Pantau tugas validasi Sales'}</h2>
          <p className="ov-muted">
            {sales
              ? 'Tugas khusus dari SPV/Admin, terpisah dari presensi.'
              : 'Pantau penugasan, bukti menunggu pemeriksaan, dan hasil perbaikan lintas tanggal.'}
          </p>
        </div>
        <button type="button" className="app-button" disabled={busy} onClick={refresh}>
          {busy ? 'Memuat…' : selected ? 'Perbarui tugas' : 'Perbarui daftar'}
        </button>
      </div>
      {error && !selected && (
        <p role="alert" className="app-error">
          {error}
        </p>
      )}
      {actionError && (
        <p role="alert" className="app-error">
          {actionError}
        </p>
      )}
      {selected && detailError && (
        <p role="alert" className="app-error">
          {detailError}{' '}
          <button
            type="button"
            className="app-button"
            onClick={() => loadDetail().catch((e) => setDetailError(e.message))}
          >
            Coba lagi
          </button>
        </p>
      )}
      {selected ? (
        <div className="ov-task-detail">
          <div className="app-actions">
            <button type="button" className="app-button" disabled={busy} onClick={() => select('')}>
              ← Kembali ke daftar tugas
            </button>
            {detail && onOpenReview && (
              <button
                type="button"
                className="app-button"
                onClick={() => onOpenReview(detail.reviewId)}
              >
                Buka kasus outlet
              </button>
            )}
          </div>
          {sales ? (
            <SalesOutletValidationForm key={`${selected}:${detailVersion}`} taskId={selected} />
          ) : detail ? (
            <FieldTaskReview
              task={detail}
              actors={data?.people}
              disabled={busy}
              readOnly={['COMPLETED', 'CANCELLED'].includes(detail.review?.status)}
              act={act}
            />
          ) : (
            !detailError && <p role="status">Memuat bukti dan riwayat…</p>
          )}
        </div>
      ) : (
        <>
          <OutletFieldTaskFilters
            filters={f}
            onChange={change}
            people={data?.people}
            role={user.role}
          />
          <p className="ov-muted">
            Tanggal memakai waktu penugasan awal (WIB). Umur bukti dihitung sejak pengiriman
            terakhir yang masih menunggu pemeriksa; filter tenggat pengerjaan hanya untuk tugas
            Sales terbuka.
          </p>
          <OutletFieldTaskTable
            busy={busy}
            error={error}
            data={data}
            page={page}
            setPage={setPage}
            sales={sales}
            onSelect={select}
          />
        </>
      )}
    </section>
  );
}
