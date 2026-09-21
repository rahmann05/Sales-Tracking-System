/** batchValidateOutlets - single-responsibility service (extracted from outlet-validation.service.js). */
import { prisma } from '../../../config/prisma.js';
import { validateOutlet } from './validate-outlet.service.js';
import { getValidationSummary } from './get-validation-summary.service.js';

// ─── Batch Validation Orchestrator ──────────────────────────────────────────

/**
 * Validate multiple outlets in batch with concurrency limit to respect API rate limits.
 * @param {Object} options - { outletIds?: string[], filter?: string, limit?: number }
 */
export const batchValidateOutlets = async (options = {}) => {
  const { outletIds, filter, limit = 50 } = options;

  const where = { deletedAt: null };

  if (Array.isArray(outletIds) && outletIds.length > 0) {
    where.id = { in: outletIds };
  } else if (filter) {
    if (filter === 'SUSPECT') where.validationStatus = 'SUSPECT';
    else if (filter === 'UNVALIDATED') where.validationStatus = 'UNVALIDATED';
    else if (filter === 'WARNING') where.validationStatus = 'WARNING';
    else if (filter === 'NEEDS_REVIEW') {
      where.validationStatus = { in: ['SUSPECT', 'WARNING', 'UNVALIDATED'] };
    }
  }

  const outletsToValidate = await prisma.outlet.findMany({
    where,
    select: { id: true, name: true },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  const results = {
    total: outletsToValidate.length,
    processed: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  const CONCURRENCY = 3;
  for (let i = 0; i < outletsToValidate.length; i += CONCURRENCY) {
    const chunk = outletsToValidate.slice(i, i + CONCURRENCY);
    const chunkPromises = chunk.map(async (o) => {
      try {
        await validateOutlet(o.id);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: o.id, name: o.name, error: err.message });
      } finally {
        results.processed++;
      }
    });

    await Promise.all(chunkPromises);
  }

  const summary = await getValidationSummary();

  return {
    ...results,
    summary,
  };
};
