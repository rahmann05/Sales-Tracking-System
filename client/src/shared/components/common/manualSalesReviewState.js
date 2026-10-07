export const REVIEW_PAGE_SIZE = 15;

export function applyManualSalesDecision(result, id, decision, activeStatus) {
  const updated = result.data.map(item => item.id === id ? {
    ...item,
    manualSalesStatus: decision,
    isManualSalesApproved: decision === 'APPROVED',
    manualSalesReviewedAt: new Date().toISOString(),
  } : item);
  const visible = activeStatus === 'PENDING'
    ? updated.filter(item => item.id !== id)
    : updated;
  return { ...result, data: visible, total: Math.max(0, result.total - (activeStatus === 'PENDING' ? 1 : 0)) };
}
