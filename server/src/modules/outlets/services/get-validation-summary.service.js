/** getValidationSummary - single-responsibility service (extracted from outlet-validation.service.js). */
import { prisma } from '../../../config/prisma.js';

// ─── Validation Summary ─────────────────────────────────────────────────────

/**
 * Get validation summary statistics for all outlets.
 */
export const getValidationSummary = async () => {
  const counts = await prisma.outlet.groupBy({
    by: ['validationStatus'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const total = await prisma.outlet.count({ where: { deletedAt: null } });

  const summary = {
    total,
    UNVALIDATED: 0,
    VALID: 0,
    LIKELY_VALID: 0,
    WARNING: 0,
    SUSPECT: 0,
    INCOMPLETE: 0,
  };

  counts.forEach((row) => {
    summary[row.validationStatus] = row._count.id;
  });

  return summary;
};
