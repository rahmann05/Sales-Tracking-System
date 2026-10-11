import {policyNotifications} from '../notifications/services/notification-policy.service.js';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {followUpReviewers} from '../../../../shared/follow-up-policy.mjs';
export async function notifyFollowUp(db, record, phase, actorId) {
  const owner = await db.user.findFirst({ where: { id: record.followUp.ownerId, deletedAt: null }, select: { id: true, supervisorId: true } });
  let recipients = owner ? [owner] : [];
  if (phase === 'SUBMITTED') {
    const eligible=followUpReviewers(owner,await reviewPeople(db),record.followUp.reviewerMode||'BOTH');
    recipients=eligible.some(p=>p.role==='SUPERVISOR')?eligible.filter(p=>p.role==='SUPERVISOR'):eligible;
  }
  const titles = { REASSIGNED:'Arahan dialihkan ke petugas lain',ASSIGNED: 'Arahan pekerjaan', SUBMITTED: 'Hasil arahan menunggu pemeriksaan', RETURNED: 'Hasil arahan perlu dilengkapi', ACCEPTED: 'Hasil arahan diterima',COMPLETED_BY_POLICY:'Tugas selesai sesuai kebijakan' };
  if (recipients.length) await policyNotifications(db,{ data: recipients.filter(user => phase !== 'SUBMITTED' || user.id !== actorId).map(user => ({
    userId: user.id, type: `FOLLOW_UP_${phase}`, title: titles[phase],
    message: `${record.outletName || 'Kunjungan'} · ${phase === 'REASSIGNED'?'Tugas telah dialihkan. Arahan ini kini ditangani petugas lain.':phase === 'SUBMITTED' ? 'Periksa hasil terbaru pada arahan kunjungan.' : `${record.followUp.dueDate?`Tenggat: ${record.followUp.dueDate}. `:''}Buka arahan untuk melihat tindakan dan instruksi terbaru.`}`,
    payload: { staffActivityId: record.id, phase },
  })) });
}
