import { createRequire } from 'node:module';
import { getActiveDatabaseState } from '../../../server/src/config/database.js';
import { successResponse } from '../../../server/src/utils/response.js';
import { DEMO_INVARIANT_GUARDRAILS, DEMO_RELAX_GROUPS } from '../../shared/demo-guardrails.mjs';
import { DEMO_SCENARIOS } from '../../shared/demo-scenarios.mjs';
import { issueDemoSwitchSession, listDemoAccounts } from '../services/demo-accounts.service.js';
import {
  applyDemoPolicyGroups,
  getDemoPolicyStatus,
  restoreDemoPolicyBaseline,
} from '../services/demo-policy.service.js';
import { syncDemoTodayPjp } from '../services/demo-flow-helpers.service.js';

const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const { Router } = require('express');

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    const policy = await getDemoPolicyStatus();
    return successResponse(res, 200, {
      demoMode: true,
      database: getActiveDatabaseState(),
      policy,
      groups: DEMO_RELAX_GROUPS,
      guardrails: DEMO_INVARIANT_GUARDRAILS,
      scenarios: DEMO_SCENARIOS,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/accounts', async (_req, res, next) => {
  try {
    const accounts = await listDemoAccounts();
    return successResponse(res, 200, accounts);
  } catch (error) {
    next(error);
  }
});

router.post('/switch-account', async (req, res, next) => {
  try {
    const session = await issueDemoSwitchSession(req.body?.userId);
    if (session?.refreshToken && typeof res.cookie === 'function') {
      res.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`[DEMO] Switch akun -> [${session.user.role}] ${session.user.email}`);
    return successResponse(res, 200, session, `Berpindah ke akun ${session.user.name}`);
  } catch (error) {
    next(error);
  }
});

router.post('/policy/apply', async (req, res, next) => {
  try {
    const groups = Array.isArray(req.body?.groups) ? req.body.groups : [];
    const policy = await applyDemoPolicyGroups(groups);
    return successResponse(res, 200, policy, 'Preset constraint demo berhasil diterapkan');
  } catch (error) {
    next(error);
  }
});

router.post('/policy/restore', async (_req, res, next) => {
  try {
    const result = await restoreDemoPolicyBaseline();
    const policy = await getDemoPolicyStatus();
    return successResponse(
      res,
      200,
      { ...result, policy },
      result.restored ? 'Policy normal berhasil dipulihkan' : result.message
    );
  } catch (error) {
    next(error);
  }
});

router.post('/sync-today-pjp', async (req, res, next) => {
  try {
    const result = await syncDemoTodayPjp({
      salesId: req.body?.salesId || null,
      rebuild: req.body?.rebuild === true,
    });
    return successResponse(res, 200, result, 'Sinkronisasi PJP demo selesai');
  } catch (error) {
    next(error);
  }
});

export default router;
