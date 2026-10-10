import {policyNotifications} from '../notifications/services/notification-policy.service.js';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {followUpReviewers} from '../../../../shared/follow-up-policy.mjs';
export async function notifyFollowUp(db, record, phase, actorId) {
  const owner = await db.user.findFirst({ where: { id: record.followUp.ownerId, deletedAt: null }, select: { id: true, supervisorId: true } });
  let recipients = owner ? [owner] : [];
  if (phase === 'SUBMITTED') {
    const eligible=followUpReviewers(owner,await reviewPeople(db));
    recipients=eligible.some(p=>p.role==='SUPERVISOR')?eligible.filter(p=>p.role==='SUPERVISOR'):eligible;
  }
  const titles = { REASSIGNED:'Tugas dialihkan ke PIC lain',ASSIGNED: 'Penugasan tindak lanjut', SUBMITTED: 'Hasil tindak lanjut menunggu pemeriksaan', RETURNED: 'Hasil tindak lanjut perlu dilengkapi', ACCEPTED: 'Hasil tindak lanjut diterima',COMPLETED_BY_POLICY:'Tugas selesai sesuai kebijakan' };
  if (recipients.length) await policyNotifications(db,{ data: recipients.filter(user => phase !== 'SUBMITTED' || user.id !== actorId).map(user => ({
    userId: user.id, type: `FOLLOW_UP_${phase}`, title: titles[phase],
    message: `${record.outletName || 'Kunjungan'} · ${phase === 'REASSIGNED'?'Tugas telah dialihkan. Anda tidak lagi menjadi PIC tugas ini.':phase === 'SUBMITTED' ? 'Periksa hasil terbaru pada tindak lanjut kunjungan.' : `Tenggat: ${record.followUp.dueDate}. Periksa tugas untuk status dan instruksi terbaru.`}`,
    payload: { staffActivityId: record.id, phase },
  })) });
}
