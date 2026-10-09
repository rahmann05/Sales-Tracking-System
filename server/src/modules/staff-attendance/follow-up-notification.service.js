import {policyNotifications} from '../notifications/services/notification-policy.service.js';
export async function notifyFollowUp(db, record, phase, actorId) {
  const owner = await db.user.findFirst({ where: { id: record.followUp.ownerId, deletedAt: null }, select: { id: true, supervisorId: true } });
  let recipients = owner ? [owner] : [];
  if (phase === 'SUBMITTED') {
    const supervisor = owner?.supervisorId ? await db.user.findFirst({ where: { id: owner.supervisorId, role: 'SUPERVISOR', deletedAt: null }, select: { id: true } }) : null;
    recipients = supervisor ? [supervisor] : await db.user.findMany({ where: { role: 'ADMIN', deletedAt: null, id: { not: actorId } }, select: { id: true } });
  }
  const titles = { ASSIGNED: 'Penugasan tindak lanjut', SUBMITTED: 'Hasil tindak lanjut menunggu pemeriksaan', RETURNED: 'Hasil tindak lanjut perlu dilengkapi', ACCEPTED: 'Hasil tindak lanjut diterima',COMPLETED_BY_POLICY:'Tugas selesai sesuai kebijakan' };
  if (recipients.length) await policyNotifications(db,{ data: recipients.filter(user => phase !== 'SUBMITTED' || user.id !== actorId).map(user => ({
    userId: user.id, type: `FOLLOW_UP_${phase}`, title: titles[phase],
    message: `${record.outletName || 'Kunjungan'} · ${phase === 'SUBMITTED' ? 'Periksa hasil terbaru pada tindak lanjut kunjungan.' : `Tenggat: ${record.followUp.dueDate}. Periksa tugas untuk status dan instruksi terbaru.`}`,
    payload: { staffActivityId: record.id, phase },
  })) });
}
