import { useCallback, useEffect, useRef, useState } from 'react';
import { clustersApi, outletsApi, collectPages } from '../../../services/api';
import { useFormDraft } from '../../../shared/hooks/useFormDraft';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { pickDefaultSupervisorId } from '../../../../../shared/pjp-planning.mjs';

const MAX_CLUSTER_OUTLETS = 100;

export function useClusterBuilder({ user, onSaved }) {
  const stored = useFormDraft('cluster-builder', () => ({
    step: 1,
    draft: {
      name: '',
      region: '',
      tradeType: 'GENERAL_TRADE',
      colorHex: '#1b66ca',
      supervisorId: user.role === 'SUPERVISOR' ? user.id : '',
      assignedSalesId: '',
    },
    selectedOutlets: [],
    centerPoint: null,
  }));
  const { step: rawStep, draft, selectedOutlets, centerPoint } = stored.value;
  const step = Math.min(3, Math.max(1, rawStep || 1));
  const [team, setTeam] = useState({ sales: [], supervisors: [] }),
    [teamLoading, setTeamLoading] = useState(true),
    [teamError, setTeamError] = useState(''),
    [outletCount, setOutletCount] = useState(10),
    [routes, setRoutes] = useState([]),
    [activeRouteIndex, setActiveRouteIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [review, setReview] = useState(null),
    [suggestions, setSuggestions] = useState([]),
    [done, setDone] = useState(false);
  const operation = useRef(0),
    alive = useRef(true),
    flight = useRef(false),
    savedOutcome = useRef(null);
  const [availableOutlets, setAvailableOutlets] = useState(null);
  useUnsavedNavigation(!done && stored.dirty && !saving, saving && !done);
  useEffect(
    () => () => {
      alive.current = false;
      operation.current++;
    },
    []
  );
  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const [r, o] = await Promise.all([
        clustersApi.teamOptions(),
        collectPages(outletsApi.getAll, { planningPool: true }),
      ]);
      if (alive.current) {
        setTeam(r.data);
        setAvailableOutlets(o.data);
        if (user.role === 'ADMIN' && !stored.restored) {
          const autoSpv = pickDefaultSupervisorId(
            user,
            r.data.supervisors || [],
            r.data.sales || []
          );
          if (autoSpv) {
            stored.setValue((v) =>
              v.draft.supervisorId || v.selectedOutlets.length
                ? v
                : { ...v, draft: { ...v.draft, supervisorId: autoSpv } }
            );
          }
        }
      }
    } catch (e) {
      if (alive.current) setTeamError(e.message);
    } finally {
      if (alive.current) setTeamLoading(false);
    }
  }, [stored.restored, stored.setValue, user]);
  useEffect(() => {
    alive.current = true;
    loadTeam();
  }, [loadTeam]);
  const field = (key, value) => {
    if ((key === 'tradeType' || key === 'supervisorId') && selectedOutlets.length) {
      setError('Lepaskan pilihan outlet sebelum mengganti tim atau jenis perdagangan.');
      return;
    }
    setReview(null);
    stored.setValue((v) => ({
      ...v,
      draft: {
        ...v.draft,
        [key]: value,
        ...(key === 'supervisorId' ? { assignedSalesId: '' } : {}),
      },
    }));
  };
  const replaceSelection = useCallback(
    (outlets) => {
      operation.current++;
      stored.setValue((v) => ({ ...v, selectedOutlets: outlets }));
      setRoutes([]);
      setReview(null);
      setActiveRouteIndex(0);
      setError('');
    },
    [stored.setValue]
  );
  const toggleOutlet = useCallback(
    (outlet) => {
      if (!outlet || outlet.type !== draft.tradeType) return;
      if (
        !selectedOutlets.some((o) => o.id === outlet.id) &&
        selectedOutlets.length >= MAX_CLUSTER_OUTLETS
      ) {
        setError('Maksimal 100 outlet.');
        return;
      }
      replaceSelection(
        selectedOutlets.some((o) => o.id === outlet.id)
          ? selectedOutlets.filter((o) => o.id !== outlet.id)
          : [...selectedOutlets, outlet]
      );
    },
    [draft.tradeType, selectedOutlets, replaceSelection]
  );
  const selectBulkOutlets = useCallback(
    (candidates = []) => {
      const eligible = candidates.filter((o) => o?.type === draft.tradeType);
      if (!eligible.length) return;
      const merged = [...new Map([...selectedOutlets, ...eligible].map((o) => [o.id, o])).values()];
      if (merged.length > MAX_CLUSTER_OUTLETS) {
        replaceSelection(merged.slice(0, MAX_CLUSTER_OUTLETS));
        setError(`Pilihan dibatasi maksimal ${MAX_CLUSTER_OUTLETS} outlet.`);
        return;
      }
      replaceSelection(merged);
    },
    [draft.tradeType, selectedOutlets, replaceSelection]
  );
  const clearSelectedOutlets = useCallback(() => {
    replaceSelection([]);
  }, [replaceSelection]);
  const selectCenter = useCallback(
    (coords) => {
      stored.setValue((v) => ({ ...v, centerPoint: coords }));
      setSuggestions([]);
    },
    [stored.setValue]
  );
  const suggest = async () => {
    if (flight.current) return;
    if (!Number.isInteger(outletCount) || outletCount < 1 || outletCount > MAX_CLUSTER_OUTLETS) {
      setError('Jumlah saran harus 1–100.');
      return;
    }
    let targetCenter = centerPoint;
    if (!targetCenter) {
      const coords = selectedOutlets.filter((o) => o.latitude != null && o.longitude != null);
      if (coords.length) {
        targetCenter = {
          lat: coords.reduce((sum, o) => sum + Number(o.latitude), 0) / coords.length,
          lng: coords.reduce((sum, o) => sum + Number(o.longitude), 0) / coords.length,
        };
        selectCenter(targetCenter);
      }
    }
    if (!targetCenter) {
      setError(
        'Klik titik pada peta atau pilih minimal satu outlet berkoordinat sebagai pusat saran.'
      );
      return;
    }
    flight.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await clustersApi.getNearestOutlets(
        targetCenter.lat,
        targetCenter.lng,
        outletCount,
        draft.tradeType,
        draft.supervisorId
      );
      setSuggestions(
        r.data.filter(
          (o) =>
            o.cluster?.supervisorId === draft.supervisorId || o.cluster?.name === 'Belum Ditugaskan'
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  const applySuggestions = () => {
    const merged = [
      ...new Map([...selectedOutlets, ...suggestions].map((o) => [o.id, o])).values(),
    ];
    if (merged.length > MAX_CLUSTER_OUTLETS) {
      setError('Gabungan pilihan melebihi 100 outlet. Kurangi jumlah saran.');
      return;
    }
    replaceSelection(merged);
    setSuggestions([]);
  };
  const generate = async () => {
    if (flight.current || !selectedOutlets.length) return;
    flight.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await clustersApi.generateRoutes(selectedOutlets.map((o) => o.id));
      setRoutes(r.data || []);
      setActiveRouteIndex(0);
    } catch (e) {
      setError(e.message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  const next = async () => {
    if (busy || saving) return;
    setError('');
    if (
      step === 1 &&
      (!draft.supervisorId || draft.region.trim().length < 2 || draft.name.trim().length < 2)
    ) {
      setError('Pilih tim, isi nama cluster dan region minimal dua karakter.');
      return;
    }
    if (step === 1) {
      stored.setValue((v) => ({ ...v, step: 2 }));
      return;
    }
    if (!selectedOutlets.length) {
      setError('Pilih minimal satu outlet.');
      return;
    }
    const outletIds = selectedOutlets.map((o) => o.id);
    const shouldGenerateRoutes =
      routes.length === 0 &&
      selectedOutlets.filter((o) => o.latitude != null && o.longitude != null).length >= 2;
    setBusy(true);
    try {
      const [impactRes, routesRes] = await Promise.all([
        clustersApi.impact({
          outletIds,
          supervisorId: draft.supervisorId,
          assignedSalesId: draft.assignedSalesId || null,
        }),
        shouldGenerateRoutes
          ? clustersApi.generateRoutes(outletIds).catch(() => ({ data: [] }))
          : Promise.resolve(null),
      ]);
      setReview(impactRes.data);
      if (routesRes) {
        setRoutes(routesRes.data || []);
        setActiveRouteIndex(0);
      }
      stored.setValue((v) => ({ ...v, step: 3 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async ({ openPlanner = false } = {}) => {
    if (flight.current || !review) return;
    flight.current = true;
    setSaving(true);
    setError('');
    try {
      const { tradeType, ...payload } = draft;
      if (selectedOutlets.some((o) => o.type !== tradeType))
        throw new Error('Jenis outlet harus sama.');
      const res = await clustersApi.createFull({
        ...payload,
        impactToken: review.token,
        centerLat: centerPoint?.lat ?? null,
        centerLng: centerPoint?.lng ?? null,
        outletIds: selectedOutlets.map((o) => o.id),
        routes: routes.map((r, i) => ({ ...r, routeIndex: i, isActive: i === activeRouteIndex })),
      });
      savedOutcome.current = {
        cluster: res.data,
        openPlanner,
        supervisorId: draft.supervisorId,
        assignedSalesId: draft.assignedSalesId || '',
      };
      stored.clear();
      setDone(true);
    } catch (e) {
      setReview(null);
      setError(e.message);
    } finally {
      flight.current = false;
      setSaving(false);
    }
  };
  useEffect(() => {
    if (done) onSaved(savedOutcome.current);
  }, [done, onSaved]);
  return {
    step,
    setStep: (fn) =>
      stored.setValue((v) => {
        const nextStep = typeof fn === 'function' ? fn(Math.min(3, Math.max(1, v.step || 1))) : fn;
        return { ...v, step: Math.min(3, Math.max(1, nextStep || 1)) };
      }),
    draft,
    field,
    team,
    teamLoading,
    teamError,
    loadTeam,
    availableOutlets,
    outletCount,
    setOutletCount,
    selectedOutlets,
    centerPoint,
    routes,
    activeRouteIndex,
    setActiveRouteIndex,
    busy,
    saving,
    error,
    review,
    suggestions,
    suggest,
    applySuggestions,
    toggleOutlet,
    selectBulkOutlets,
    clearSelectedOutlets,
    selectCenter,
    generate,
    next,
    save,
    restored: stored.restored,
    policyChanged: stored.policyChanged,
    restoreMessage: stored.restoreMessage,
    storageError: stored.storageError,
  };
}
