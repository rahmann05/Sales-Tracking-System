import { followUpReviewers } from '../../../../shared/follow-up-policy.mjs';
import { reviewPeople } from '../config/services/approval-readiness.service.js';
import { processValue } from '../config/services/process-policy.service.js';
import { getDynamicConfig } from '../config/config.service.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { randomUUID } from 'node:crypto';
import { assertSalesAccess } from '../../utils/team-scope.js';
import { assertEvidenceImages } from '../../utils/evidence-images.js';
import { maybePersistEvidenceImage } from '../../utils/evidence-storage.js';
import { gpsEvidence } from '../../utils/gps-evidence.js';
import { distanceToOutlet } from '../../utils/geolocation.js';
import { findAttendanceException } from '../absensi/services/attendance-policy.service.js';
import { notifyFollowUp } from './follow-up-notification.service.js';
import { followUpActor } from './follow-up-access.service.js';
import { resolveFollowUpOutlet, resolveFollowUpTargets } from './follow-up-target.service.js';
import { completedVisitStatuses } from '../../../../shared/sales-visit-actions.mjs';
export async function followUpScope(user, db = prisma) {
  if (user.role === 'ADMIN') return { followUp: { path: ['status'], string_contains: '' } };
  const team =
    user.role === 'SUPERVISOR'
      ? await db.user.findMany({
          where: { supervisorId: user.id, role: 'SALES', deletedAt: null },
          select: { id: true },
        })
      : [];
  return {
    OR: [
      { userId: user.id, followUp: { path: ['status'], string_contains: '' } },
      { followUp: { path: ['ownerId'], equals: user.id } },
      ...team.map((sales) => ({ followUp: { path: ['ownerId'], equals: sales.id } })),
      ...(user.role === 'SUPERVISOR'
        ? [{ user: { supervisorId: user.id }, followUp: { path: ['status'], string_contains: '' } }]
        : []),
    ],
  };
}

export const listFollowUps = async (user, { status = 'ALL', page = 1, limit = 50 } = {}) => {
  ({ actor: user } = await followUpActor(prisma, user, 'view'));
  if (!['ALL', 'OPEN', 'SUBMITTED', 'DONE'].includes(status))
    throw new AppError('Status tindak lanjut tidak valid', 400);
  const current = Math.max(1, Math.floor(Number(page) || 1)),
    size = Math.min(200, Math.max(1, Math.floor(Number(limit) || 50)));
  const rows = await prisma.staffActivity.findMany({
    where: {
      AND: [
        await followUpScope(user),
        ...(status === 'ALL' ? [] : [{ followUp: { path: ['status'], equals: status } }]),
      ],
    },
    select: {
      id: true,
      kind: true,
      activityKey: true,
      outletName: true,
      followUp: true,
      policySnapshot: true,
      user: { select: { name: true } },
    },
    orderBy: [{ checkInAt: 'asc' }, { id: 'asc' }],
    skip: (current - 1) * size,
    take: size,
  });
  if (!Array.isArray(rows)) return rows;
  const targets = await resolveFollowUpTargets(rows, prisma);
  return rows.map((row) => ({ ...row, targetOutlet: targets.get(row.id) || null }));
};

export const completeFollowUp = (id, user, payloadOrNote, legacyEvidence, legacyExtra = {}) =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    ({ actor: user } = await followUpActor(tx, user, 'complete'));
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
    const record = await tx.staffActivity.findFirst({
      where: { id, ...(await followUpScope(user, tx)) },
    });
    if (!record?.followUp) throw new AppError('Tindak lanjut tidak ditemukan', 404);
    if (record.followUp.status !== 'OPEN')
      throw new AppError('Tugas sudah dikirim atau selesai', 409);
    if (record.followUp.ownerId !== user.id)
      throw new AppError('Hanya penerima arahan yang dapat mengirim hasil', 403);
    const payload =
      payloadOrNote && typeof payloadOrNote === 'object'
        ? payloadOrNote
        : { note: payloadOrNote, evidence: legacyEvidence, ...legacyExtra };
    const {
      note,
      evidence,
      photoUrl = null,
      latitude = null,
      longitude = null,
      accuracy = null,
      observedAt = null,
    } = payload;
    let closedDecision = null;
    if (record.followUp.scheduledVisit) {
      const visit = await tx.pjpStop.findUnique({
        where: { id: record.followUp.scheduledVisit.stopId },
        include: { pjp: true },
      });
      closedDecision =
        visit?.status === 'SKIPPED' &&
        (await tx.routeChangeRequest.findFirst({
          where: {
            pjpStopId: visit.id,
            reportedBy: user.id,
            status: { in: ['ACKNOWLEDGED', 'APPROVED'] },
          },
        }));
      if (
        !visit ||
        visit.pjp.userId !== user.id ||
        (!completedVisitStatuses.includes(visit.status) && !closedDecision)
      )
        throw new AppError(
          'Selesaikan kunjungan di agenda terlebih dahulu. Jika toko tutup, laporkan dan tunggu keputusan Supervisor/Admin sebelum mengirim hasil arahan.',
          409
        );
    }
    if (typeof note !== 'string' || !note.trim() || note.trim().length > 4000)
      throw new AppError('Catatan penyelesaian wajib, maksimal 4000 karakter', 400);
    if (evidence !== undefined && evidence !== null && typeof evidence !== 'string')
      throw new AppError('Bukti atau referensi hasil tidak valid', 400);
    const evidenceText = typeof evidence === 'string' ? evidence.trim() : '';
    if (evidenceText.length > 2000)
      throw new AppError('Bukti atau referensi hasil maksimal 2000 karakter', 400);

    const [
      requireEvidence,
      requirePhoto,
      requireGps,
      enforceGeofence,
      requireReview,
      globalRadius,
      useOutletRadius,
      bypassEmailsRaw,
    ] = await Promise.all([
      processValue(record, 'FOLLOW_UP_REQUIRE_EVIDENCE', true),
      processValue(record, 'FOLLOW_UP_REQUIRE_PHOTO', true),
      processValue(record, 'FOLLOW_UP_REQUIRE_GPS', true),
      processValue(record, 'FOLLOW_UP_ENFORCE_GEOFENCE', true),
      processValue(record, 'FOLLOW_UP_REQUIRE_REVIEW', true),
      getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50),
      getDynamicConfig('ATTENDANCE_USE_OUTLET_RADIUS', true),
      getDynamicConfig('BYPASS_GEOFENCE_EMAILS', ''),
    ]);

    await assertEvidenceImages({ photoUrl });
    const hasPhoto = Boolean(typeof photoUrl === 'string' && photoUrl.trim());
    if (requirePhoto && !closedDecision && !hasPhoto)
      throw new AppError(
        'Foto kamera langsung wajib dilampirkan saat berada di lokasi outlet',
        422
      );

    const hasGps = Number.isFinite(latitude) && Number.isFinite(longitude);
    if ((requireGps || (enforceGeofence && !closedDecision)) && !closedDecision && !hasGps)
      throw new AppError('GPS lokasi wajib diaktifkan sebelum mengirim hasil tugas', 422);

    const gpsMeta = hasGps ? await gpsEvidence({ latitude, longitude, accuracy, observedAt }) : null;
    const target = await resolveFollowUpOutlet(record, tx);
    const maxRadius = useOutletRadius
      ? target?.radiusMeters || globalRadius
      : globalRadius;
    const distance =
      hasGps && target?.outlet ? distanceToOutlet(latitude, longitude, target.outlet) : null;
    const deviationMeters = distance == null ? null : Math.round(distance);
    const distanceWarning =
      distance == null ? 'UNAVAILABLE' : distance > maxRadius ? 'WARNING' : 'OK';

    const bypassEmails = String(bypassEmailsRaw || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const actorEmail =
      user.email ||
      (typeof tx.user?.findUnique === 'function'
        ? (await tx.user.findUnique({ where: { id: user.id }, select: { email: true } }))?.email
        : null);
    const isBypassUser = Boolean(actorEmail && bypassEmails.includes(actorEmail.toLowerCase()));
    const radiusException =
      target?.id && typeof tx.outletUnlockRequest?.findMany === 'function'
        ? await findAttendanceException(target.id, user.id, tx, 'GEOFENCE')
        : null;
    const hasException = Boolean(radiusException);

    if (enforceGeofence && !closedDecision && !isBypassUser && !hasException) {
      if (distance === null) {
        throw new AppError(
          'Koordinat master outlet belum tersedia. Minta koreksi lokasi atau pengecualian presensi resmi.',
          422
        );
      }
      if (distance > maxRadius) {
        throw new AppError(
          `Pengiriman ditolak. Posisi Anda (${deviationMeters}m) berada di luar radius outlet (${maxRadius}m). Harap dekati lokasi fisik outlet.`,
          422
        );
      }
    }

    const storedPhotoUrl = hasPhoto
      ? await maybePersistEvidenceImage(photoUrl, 'attendance')
      : null;

    if (requireEvidence && !evidenceText && !storedPhotoUrl)
      throw new AppError('Bukti atau referensi hasil wajib diisi, maksimal 2000 karakter', 400);

    const submission = {
      id: randomUUID(),
      at: new Date().toISOString(),
      actorId: user.id,
      note: note.trim(),
      evidence: evidenceText,
      ...(storedPhotoUrl ? { photoUrl: storedPhotoUrl } : {}),
      ...(hasGps ? { latitude, longitude } : {}),
      ...(gpsMeta ? { gpsEvidence: gpsMeta } : {}),
      ...(deviationMeters != null ? { deviationMeters, distanceWarning } : {}),
      ...(target?.id ? { targetOutletId: target.id } : {}),
    };
    const needsReview = requireReview;
    const followUp = {
      ...record.followUp,
      status: needsReview ? 'SUBMITTED' : 'DONE',
      ...(!needsReview
        ? {
            completedAt: submission.at,
            completedBy: user.id,
            completionNote: submission.note,
            completionSource: 'POLICY_NO_REVIEW',
          }
        : {}),
      submission,
      history: [...(record.followUp.history || []), { action: 'SUBMITTED', ...submission }],
    };
    const updated = await tx.staffActivity.update({ where: { id }, data: { followUp } });
    await notifyFollowUp(tx, updated, needsReview ? 'SUBMITTED' : 'COMPLETED_BY_POLICY', user.id);
    return updated;
  });

export const reviewFollowUp = (id, user, { decision, note, submissionId }) =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    ({ actor: user } = await followUpActor(tx, user, 'review'));
    if (!['ADMIN', 'SUPERVISOR'].includes(user.role))
      throw new AppError('Pemeriksaan hanya oleh Admin atau SPV', 403);
    if (
      !['ACCEPT', 'RETURN'].includes(decision) ||
      typeof note !== 'string' ||
      (decision === 'RETURN' && !note.trim()) ||
      note.trim().length > 2000
    )
      throw new AppError('Keputusan valid diperlukan; alasan wajib saat meminta perbaikan', 400);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
    const record = await tx.staffActivity.findFirst({
      where: { id, ...(await followUpScope(user, tx)) },
    });
    if (!record?.followUp) throw new AppError('Tindak lanjut tidak ditemukan', 404);
    const f = record.followUp;
    const people = await reviewPeople(tx);
    if (
      !followUpReviewers(
        people.find((p) => p.id === f.ownerId),
        people,
        f.reviewerMode || 'BOTH'
      ).some((p) => p.id === user.id)
    )
      throw new AppError('Anda bukan pemeriksa yang diizinkan untuk tugas ini.', 403);
    if (f.ownerId === user.id)
      throw new AppError('Hasil tugas sendiri harus diperiksa pengguna lain', 403);
    await assertSalesAccess(user, f.ownerId, tx);
    if (f.status !== 'SUBMITTED' || !submissionId || f.submission?.id !== submissionId)
      throw new AppError('Hasil sudah berubah atau sudah diperiksa. Muat ulang tugas.', 409);
    const review = {
      decision,
      note: note.trim(),
      submissionId,
      actorId: user.id,
      at: new Date().toISOString(),
    };
    const followUp = {
      ...f,
      status: decision === 'ACCEPT' ? 'DONE' : 'OPEN',
      review,
      ...(decision === 'ACCEPT'
        ? { completedAt: review.at, completedBy: user.id, completionNote: f.submission.note }
        : {}),
      history: [
        ...(f.history || []),
        { action: decision === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED', ...review },
      ],
    };
    const updated = await tx.staffActivity.update({ where: { id }, data: { followUp } });
    await notifyFollowUp(tx, updated, decision === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED', user.id);
    return updated;
  });
