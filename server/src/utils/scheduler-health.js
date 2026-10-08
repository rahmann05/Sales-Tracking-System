export function nextDailyPjp(now = Date.now()) {
  const wib = new Date(now + 7 * 3600000);
  let next = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), 3) - 7 * 3600000;
  if (next <= now) next += 86400000;
  return next;
}
export function createSchedulerMonitor(clock = Date.now) {
  const jobs = new Map();
  const register = (id, label, nextDueAt, graceMs) => jobs.set(id, { id, label, nextDueAt, graceMs, running: false, lastStartedAt: null, lastSuccessAt: null, lastFailedAt: null });
  const run = async (id, task, nextDue) => {
    const job = jobs.get(id);
    if (!job || job.running) return;
    job.running = true; job.lastStartedAt = clock();
    try { const result = await task(); job.lastSuccessAt = clock(); job.lastFailedAt = null; job.lastOutcome = result?.disabled ? 'DISABLED' : 'COMPLETED'; return result; }
    catch (error) { job.lastFailedAt = clock(); throw error; }
    finally { job.running = false; job.nextDueAt = nextDue(clock()); }
  };
  const snapshot = () => [...jobs.values()].map(({ graceMs, ...job }) => ({ ...job,
    status: job.running ? (clock() - job.lastStartedAt > 20 * 60000 ? 'STALLED' : 'RUNNING') : job.lastFailedAt != null ? 'FAILED' : clock() > job.nextDueAt + graceMs ? 'OVERDUE' : job.lastSuccessAt == null ? 'WAITING' : 'OK',
  }));
  return { register, run, snapshot };
}
export const schedulerMonitor = createSchedulerMonitor();
