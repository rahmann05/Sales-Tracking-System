import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { pjpApi } from '../../../services/api';
import { useFormDraft } from '../../../shared/hooks/useFormDraft';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { setWorkspaceValues } from '../../../shared/utils/workspaceNavigation';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import {
  allowedVisitIntervals,
  buildClusterDraftRules,
  pickDefaultSupervisorId,
} from '../../../../../shared/pjp-planning.mjs';
const initial = (user, maxDays = 62, supervisorId = '') => ({
  requestId: crypto.randomUUID(),
  name: 'Rencana kunjungan',
  supervisorId: user.role === 'SUPERVISOR' ? user.id : supervisorId,
  startsOn: wibDateKey(),
  endsOn: new Date(Date.parse(wibDateKey()) + (Math.min(28, maxDays) - 1) * 86400000)
    .toISOString()
    .slice(0, 10),
  rules: [],
  id: '',
  revision: undefined,
  status: 'DRAFT',
});
export function useVisitPlanner() {
  const featurePolicy = useFeaturePolicy('PJP');
  const { user, settings } = useApp(),
    draft = useFormDraft('visit-planner', () => initial(user));
  const [source, setSource] = useState({ sales: [], outlets: [], workingDays: [] }),
    [team, setTeam] = useState({ supervisors: [] }),
    [plans, setPlans] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [review, setReview] = useState(null),
    [focusSalesId, setFocusSalesId] = useState(''),
    [focusClusterId, setFocusClusterId] = useState('');
  const planPolicy = source.planningPolicies?.[draft.value.supervisorId]?.values || settings,
    maxPlanDays = Number(planPolicy.PJP_MAX_PLAN_DAYS) || 62;
  const baseline = useRef(draft.restored ? '' : JSON.stringify(draft.value)),
    flight = useRef(false);
  const dirty = draft.value.status === 'DRAFT' && JSON.stringify(draft.value) !== baseline.current;
  useUnsavedNavigation(dirty, busy);
  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, p] = await Promise.all([pjpApi.getTemplates(), pjpApi.listPlans()]);
      const saved = p.data.find((v) => v.id === draft.value.id);
      if (saved) baseline.current = JSON.stringify(saved);
      setSource(s.data);
      setTeam({ supervisors: s.data.supervisors || [] });
      setPlans(p.data);
      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const handoffSpv = params?.get('plannerSpv') || '';
      const handoffSales = params?.get('plannerSales') || '';
      const handoffCluster = params?.get('plannerCluster') || '';
      if (handoffSpv || handoffSales || handoffCluster) {
        setWorkspaceValues(
          { plannerSpv: null, plannerSales: null, plannerCluster: null },
          { replace: true }
        );
        const supervisors = s.data.supervisors || [];
        const salesList = s.data.sales || [];
        const targetSpv =
          user.role === 'SUPERVISOR'
            ? user.id
            : supervisors.some((v) => v.id === handoffSpv)
              ? handoffSpv
              : salesList.find((v) => v.id === handoffSales)?.supervisorId ||
                pickDefaultSupervisorId(user, supervisors, salesList);
        const targetPolicy = s.data.planningPolicies?.[targetSpv]?.values || settings;
        const targetMaxDays = Number(targetPolicy.PJP_MAX_PLAN_DAYS) || maxPlanDays;
        let nextDraft =
          draft.value.status === 'DRAFT' && draft.value.supervisorId === targetSpv
            ? { ...draft.value }
            : initial(user, targetMaxDays, targetSpv);
        const targetSales =
          salesList.find((v) => v.id === handoffSales && v.supervisorId === targetSpv) || null;
        if (targetSales) setFocusSalesId(targetSales.id);
        setFocusClusterId(handoffCluster || '');
        if (targetSales) {
          const allShops = (s.data.outlets || []).filter(
            (o) => o.cluster?.supervisorId === targetSpv
          );
          const clusterOutlets = handoffCluster
            ? allShops.filter((o) => o.clusterId === handoffCluster)
            : allShops;
          const addedRules = buildClusterDraftRules({
            person: targetSales,
            shops: clusterOutlets.length ? clusterOutlets : allShops,
            existingOutletIds: nextDraft.rules
              .filter((r) => r.userId === targetSales.id)
              .map((r) => r.outletId),
            startsOn: nextDraft.startsOn,
            workingDays: s.data.workingDays,
            allowedIntervals: allowedVisitIntervals(targetPolicy),
            defaultInterval: Number(targetPolicy.PJP_DEFAULT_INTERVAL || 1),
          });
          if (addedRules.length) {
            nextDraft = { ...nextDraft, rules: [...nextDraft.rules, ...addedRules] };
            setMessage(
              `${addedRules.length} outlet dari cluster ditambahkan ke draf jadwal ${targetSales.name}. Periksa tanggal acuan, simpan draf, lalu terbitkan.`
            );
          } else {
            setMessage(`Planner siap untuk ${targetSales.name}.`);
          }
        } else if (targetSpv) {
          setMessage(
            'Tim cluster dibuka di Planner. Pilih Sales atau tambahkan outlet ke aturan kunjungan.'
          );
        }
        draft.setValue(nextDraft);
        setReview(null);
      } else if (
        !draft.restored &&
        !draft.value.id &&
        !draft.value.supervisorId &&
        !draft.value.rules.length
      ) {
        const autoSpv = pickDefaultSupervisorId(user, s.data.supervisors || [], s.data.sales || []);
        if (autoSpv) {
          const max = Number(s.data.planningPolicies?.[autoSpv]?.values?.PJP_MAX_PLAN_DAYS) || 62;
          const end = new Date(Date.parse(draft.value.startsOn) + (max - 1) * 86400000)
            .toISOString()
            .slice(0, 10);
          const next = {
            ...draft.value,
            supervisorId: autoSpv,
            endsOn: draft.value.endsOn > end ? end : draft.value.endsOn,
          };
          baseline.current = JSON.stringify(next);
          draft.setValue(next);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    const value = draft.value;
    if (loading || draft.restored || value.id || JSON.stringify(value) !== baseline.current) return;
    const end = new Date(Date.parse(value.startsOn) + (maxPlanDays - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    if (value.endsOn > end) {
      const next = { ...value, endsOn: end };
      baseline.current = JSON.stringify(next);
      draft.setValue(next);
    }
  }, [loading, maxPlanDays]);
  const change = (update) => {
    draft.setValue(update);
    setReview(null);
    setMessage('');
  };
  const changeTeam = (supervisorId) =>
    change((v) => {
      const max = Number(source.planningPolicies?.[supervisorId]?.values.PJP_MAX_PLAN_DAYS) || 62,
        end = new Date(Date.parse(v.startsOn) + (max - 1) * 86400000).toISOString().slice(0, 10);
      return { ...v, supervisorId, rules: [], endsOn: v.endsOn > end ? end : v.endsOn };
    });
  const field = (key, value) => change((v) => ({ ...v, [key]: value }));
  const choose = async (id) => {
    if (!window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))) return;
    setBusy(true);
    setError('');
    try {
      const autoSpv = pickDefaultSupervisorId(user, team.supervisors, source.sales);
      const next = id
        ? (await pjpApi.getPlan(id)).data
        : initial(
            user,
            Number(source.planningPolicies?.[autoSpv]?.values.PJP_MAX_PLAN_DAYS) || maxPlanDays,
            autoSpv
          );
      draft.setValue(next);
      baseline.current = JSON.stringify(next);
      setReview(null);
      setMessage('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copyNext = () => {
    if (
      busy ||
      loading ||
      !window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))
    )
      return;
    const previous = draft.value,
      length = Math.max(
        1,
        Math.min(
          maxPlanDays,
          Math.round((Date.parse(previous.endsOn) - Date.parse(previous.startsOn)) / 86400000) + 1
        )
      );
    if (!Number.isFinite(length)) {
      setError('Periksa tanggal periode sebelum menyalin rencana.');
      return;
    }
    const nextDay = new Date(Date.parse(previous.endsOn) + 86400000).toISOString().slice(0, 10),
      startsOn = nextDay > wibDateKey() ? nextDay : wibDateKey(),
      next = {
        ...initial(user),
        name: previous.name,
        supervisorId: previous.supervisorId,
        startsOn,
        endsOn: new Date(Date.parse(startsOn) + (length - 1) * 86400000).toISOString().slice(0, 10),
        rules: previous.rules.map((rule) => ({ ...rule })),
      };
    draft.setValue(next);
    baseline.current = '';
    setReview(null);
    setError('');
    setMessage(
      'Draft periode berikutnya dibuat. Tanggal acuan dipertahankan agar interval F2/F4 tidak mulai ulang. Periksa penugasan dan kalender, lalu simpan.'
    );
  };
  const run = async (action) => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  const preview = () =>
    run(async () => {
      setReview((await pjpApi.previewPlan(draft.value)).data);
    });
  const save = () =>
    run(async () => {
      const saved = (await pjpApi.savePlan(draft.value.id, draft.value)).data;
      draft.setValue(saved);
      baseline.current = JSON.stringify(saved);
      setPlans((previous) => [saved, ...previous.filter((p) => p.id !== saved.id)]);
      setMessage('Draft tersimpan. Tinjau kalender sebelum menerbitkan.');
      setReview(null);
    });
  const publish = (body) =>
    run(async () => {
      if (dirty || !draft.value.id) throw new Error('Simpan draft terbaru sebelum menerbitkan.');
      const result = (
        await pjpApi.publishPlan(draft.value.id, { ...body, revision: draft.value.revision })
      ).data;
      draft.setValue(result.plan);
      baseline.current = JSON.stringify(result.plan);
      setPlans((previous) => [result.plan, ...previous.filter((p) => p.id !== result.plan.id)]);
      setMessage(`${result.count} PJP diterbitkan. Sales dapat melihatnya pada tanggal penugasan.`);
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
    });
  const scheduledAction = (body, cancel = false) =>
    run(async () => {
      if (dirty || !draft.value.id) throw new Error('Simpan draft terbaru sebelum menjadwalkan.');
      const saved = (
        await (cancel ? pjpApi.cancelPlanSchedule : pjpApi.schedulePlan)(draft.value.id, {
          ...body,
          revision: draft.value.revision,
        })
      ).data;
      draft.setValue(saved);
      baseline.current = JSON.stringify(saved);
      setPlans((previous) => [saved, ...previous.filter((p) => p.id !== saved.id)]);
      setReview(null);
      setMessage(
        cancel
          ? 'Jadwal dibatalkan. Draft dapat diperbaiki dan ditinjau ulang.'
          : 'Penerbitan dijadwalkan. Sistem akan memeriksa ulang rencana saat waktunya tiba.'
      );
    });
  const cancelPublished = (body) =>
    run(async () => {
      const saved = (
        await pjpApi.cancelPublishedPlan(draft.value.id, {
          ...body,
          revision: draft.value.revision,
        })
      ).data;
      draft.setValue(saved);
      baseline.current = JSON.stringify(saved);
      setPlans((previous) => [saved, ...previous.filter((v) => v.id !== saved.id)]);
      setReview(null);
      const event = saved.history.at(-1);
      setMessage(
        `${event.cancelled.length} agenda dibatalkan; ${event.retained.length} agenda lampau/beraktivitas dipertahankan. Lihat riwayat pembatalan.`
      );
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
    });
  return {
    canStart: featurePolicy.canStart,
    featureReason: featurePolicy.reason,
    value: draft.value,
    restored: draft.restored,
    policyChanged: draft.policyChanged,
    restoreMessage: draft.restoreMessage,
    storageError: draft.storageError,
    source,
    team,
    planPolicy,
    cancelPublished,
    maxPlanDays,
    plans,
    loading,
    busy,
    error,
    message,
    review,
    dirty,
    focusSalesId,
    focusClusterId,
    field,
    change,
    changeTeam,
    choose,
    copyNext,
    preview,
    save,
    publish,
    reload,
    schedule: (body) => scheduledAction(body),
    cancelSchedule: (body) => scheduledAction(body, true),
  };
}
