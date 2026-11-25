import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatVisitDuration,
  reportVisitAttendance,
} from '../../shared/report-presentation.mjs';

test('formatVisitDuration renders unambiguous Indonesian hours and minutes cleanly', () => {
  assert.equal(formatVisitDuration(0), '0 menit');
  assert.equal(formatVisitDuration(18), '18 menit');
  assert.equal(formatVisitDuration(null, '18:00'), '18 menit');
  assert.equal(formatVisitDuration(60), '1 jam');
  assert.equal(formatVisitDuration(null, '60:00'), '1 jam');
  assert.equal(formatVisitDuration(74), '1 jam 14 menit');
  assert.equal(formatVisitDuration(null, '74:00'), '1 jam 14 menit');
  assert.equal(formatVisitDuration(120), '2 jam');
  assert.equal(formatVisitDuration(135), '2 jam 15 menit');
  assert.equal(formatVisitDuration(null, null), null);
  assert.equal(formatVisitDuration(null, '-'), null);
  assert.equal(formatVisitDuration(null, 'Tidak tersedia'), null);
});

test('attendance labels follow the row snapshot and do not flag an unstarted visit', () => {
  assert.equal(reportVisitAttendance({ timeIn: '-', timeOut: '-' }).exit, null);
  for (const attendanceMode of ['IN_ONLY', 'NONE', 'SINGLE_POINT']) {
    const result = reportVisitAttendance({
      attendanceMode,
      timeIn: '08:00',
      timeOut: '-',
      durationFormatted: 'Tidak tersedia',
    });
    assert.equal(result.exit, 'OUT tidak diwajibkan');
    assert.equal(result.duration, null);
  }
  assert.equal(
    reportVisitAttendance({ attendanceMode: 'NONE', visitSession: { state: 'FINISHED' } }).entry,
    'Kegiatan selesai'
  );
  assert.equal(
    reportVisitAttendance({
      attendanceMode: 'IN_OUT',
      timeIn: '08:00',
      visitSession: { state: 'INCOMPLETE' },
    }).exit,
    'OUT terlewat · perlu ditinjau SPV'
  );
  assert.equal(reportVisitAttendance({ timeIn: '08:00' }).exit, 'Keluar belum tercatat');
  assert.equal(
    reportVisitAttendance({ timeIn: '08:00', timeOut: '08:15', durationFormatted: '15:00' })
      .duration,
    '15 menit'
  );
  assert.equal(
    reportVisitAttendance({
      timeIn: '08:00',
      timeOut: '09:00',
      durationMinutes: 60,
      durationFormatted: '99:00',
    }).duration,
    '1 jam'
  );
  assert.equal(
    reportVisitAttendance({
      timeIn: '08:00',
      timeOut: '09:14',
      durationMinutes: 74,
    }).duration,
    '1 jam 14 menit'
  );
});

test('validation evidence remains distinct from attendance and existing OUT is preserved', () => {
  const result = reportVisitAttendance({
    validationOnly: true,
    validationResult: { submittedAt: '2026-10-11T01:00:00Z' },
  });
  assert.equal(result.entry, 'Bukti validasi dikirim');
  assert.equal(result.duration, null);
  assert.equal(
    reportVisitAttendance({ attendanceMode: 'IN_ONLY', timeIn: '08:00', timeOut: '08:15' }).exit,
    'Keluar 08:15'
  );
});
