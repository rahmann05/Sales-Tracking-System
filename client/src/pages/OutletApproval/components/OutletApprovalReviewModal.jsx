import React, { useCallback, useEffect, useState } from 'react';
import { LuLoader, LuPrinter } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { customerRegistrationsApi } from '../../../services/api';
import { registrationActions } from '../../../../../shared/approval-workflow.mjs';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';
import { PaperDocumentDialog } from '../../../shared/components/document/PaperDocumentDialog';
import { usePdfPreview } from '../../../shared/hooks/usePdfPreview';
import { GooglePlaceDetailCard } from '../../OutletRegistration/components/GooglePlaceDetailCard';
import { RegistrationRevisionHistory } from '../../OutletRegistration/components/RegistrationRevisionHistory';
import { stamp } from '../../OutletManagement/outletPresentation';
import { NooDocumentFact as Fact } from './NooDocumentFact';
import {
  buildNooPdfPreview,
  exportNooCsv,
  exportNooDocx,
  exportNooExcel,
  exportNooPdf,
  exportNooTxt,
} from '../../../utils/export/documents/nooDocumentExport';

const statusLabels = {
  DRAFT: 'Draf',
  SUBMITTED: 'Menunggu persetujuan',
  SPV_APPROVED: 'Disetujui, menunggu aktivasi',
  REGISTERED_ACTIVE: 'Aktif',
  REJECTED: 'Dikembalikan',
};
const show = (value) =>
  value === null || value === undefined || value === '' ? 'Belum diisi' : String(value);
const hasCoordinates = (item) =>
  item.latitude != null &&
  item.longitude != null &&
  Number.isFinite(Number(item.latitude)) &&
  Number.isFinite(Number(item.longitude)) &&
  Math.abs(Number(item.latitude)) <= 90 &&
  Math.abs(Number(item.longitude)) <= 180;

/**
 * Tinjau pengajuan outlet baru. Dokumen yang ditinjau adalah PDF "Form Registrasi Outlet" yang
 * sama dengan hasil ekspor; foto, lokasi, dan riwayat revisi tampil di panel bukti di bawahnya.
 */
export function OutletApprovalReviewModal({
  item,
  userRole,
  isProcessing = false,
  onClose,
  onApprove,
  onOpenReject,
  onActivate,
  canApprove = true,
}) {
  const { settings } = useApp();
  const [detail, setDetail] = useState(null),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(''),
    [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    if (!item?.id) return undefined;
    let active = true;
    setDetail(null);
    setLoading(true);
    setLoadError('');
    setPhotoFailed(false);
    customerRegistrationsApi
      .getById(item.id)
      .then((result) => {
        if (active) setDetail(result?.data || result);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Detail pengajuan gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [item?.id]);
  const current = item && detail?.id === item.id ? detail : null;
  const loadPdf = useCallback(() => buildNooPdfPreview(current), [current]);
  const pdfState = usePdfPreview({ loadPdf, domain: 'OUTLET', enabled: Boolean(current) });
  if (!item) return null;
  const actions = current ? registrationActions(current, userRole, settings) : null;
  const ready = current && (current.registrationStatus === 'SPV_APPROVED' || actions.activate);
  const coords = current && hasCoordinates(current);
  const photoUrl = current?.photoUrl?.trim();
  return (
    <PaperDocumentDialog
      title={`Tinjau pengajuan ${item.registrationCode || item.name}`}
      info="Form Registrasi Outlet"
      bleed={false}
      busy={isProcessing}
      onClose={onClose}
      actions={
        current && (
          <>
            <ExportFormatMenu
              onExportDocx={() => exportNooDocx(current)}
              onExportExcel={() => exportNooExcel(current)}
              onExportCsv={() => exportNooCsv(current)}
              onExportTxt={() => exportNooTxt(current)}
              onExportPdf={() => exportNooPdf(current)}
            />
            <button type="button" className="paper-btn" onClick={pdfState.print} disabled={!pdfState.ready}>
              <LuPrinter aria-hidden="true" /> Cetak
            </button>
          </>
        )
      }
      footer={
        current && (
          <>
            <button type="button" className="paper-btn" disabled={isProcessing} onClick={onClose}>
              Tutup
            </button>
            {canApprove && actions.reject && (
              <button
                type="button"
                className="paper-btn paper-btn-danger"
                disabled={isProcessing}
                onClick={onOpenReject}
              >
                Tolak pengajuan
              </button>
            )}
            {canApprove && actions.review && (
              <button
                type="button"
                className="paper-btn paper-btn-primary"
                disabled={isProcessing || photoFailed}
                onClick={() => onApprove(current)}
              >
                {isProcessing ? 'Memproses…' : 'Setujui pengajuan'}
              </button>
            )}
            {canApprove && actions.activate && onActivate && (
              <button
                type="button"
                className="paper-btn paper-btn-primary"
                disabled={isProcessing || photoFailed}
                onClick={() => onActivate(current)}
              >
                Lanjutkan aktivasi
              </button>
            )}
          </>
        )
      }
    >
      {loading && (
        <p className="paper-support" role="status">
          Memuat dokumen dan foto pengajuan…
        </p>
      )}
      {loadError && (
        <div className="paper-support" role="alert">
          <p>{loadError}</p>
          <p>Keputusan ditahan sampai dokumen lengkap berhasil dimuat.</p>
        </div>
      )}
      {current && (
        <>
          {pdfState.loading ? (
            <div className="paper-support paper-loading" role="status">
              <LuLoader className="animate-spin" aria-hidden="true" />
              <span>Menyiapkan Form Registrasi Outlet...</span>
            </div>
          ) : pdfState.error ? (
            <div className="paper-support" role="alert">
              <p>
                <strong>Form Registrasi Outlet gagal dibuat.</strong>
              </p>
              <p>{pdfState.error}</p>
            </div>
          ) : (
            <iframe
              ref={pdfState.iframeRef}
              src={`${pdfState.pdf.url}#view=FitH&navpanes=0`}
              title={`Pratinjau ${pdfState.pdf.filename}`}
              className="paper-pdf-frame paper-pdf-inline"
            />
          )}
          <div className="paper-support no-print">
            <h3 className="paper-support-title">Bukti pendukung dan keputusan</h3>
            <p className="doc-note">
              Status pengajuan: <strong>{statusLabels[current.registrationStatus] || current.registrationStatus}</strong>
            </p>
            <div className="doc-evidence">
              <figure className="doc-photo">
                <figcaption>
                  Foto fisik outlet yang diajukan{' '}
                  {current.photoId && <small>· {current.photoId}</small>}
                </figcaption>
                {photoUrl && !photoFailed ? (
                  <img
                    src={photoUrl}
                    alt={`Foto fisik outlet ${current.name} dari pengajuan`}
                    onError={() => setPhotoFailed(true)}
                  />
                ) : (
                  <div className="doc-photo-empty" role="status">
                    {photoFailed
                      ? 'Foto tercatat tetapi gagal dimuat. Minta bukti foto yang dapat dibuka sebelum menyetujui.'
                      : 'Foto fisik outlet belum dilampirkan pada pengajuan ini.'}
                  </div>
                )}
              </figure>
              <div className="doc-location">
                <dl className="doc-fields">
                  <Fact label="Koordinat pengajuan">
                    {coords ? `${current.latitude}, ${current.longitude}` : 'Belum tersedia'}
                  </Fact>
                  <Fact label="Kelurahan / kecamatan">
                    {[current.kelurahan, current.subAreaKecamatan].filter(Boolean).join(' · ') ||
                      'Belum diisi'}
                  </Fact>
                  <Fact label="Kota / wilayah">
                    {[current.city, current.area].filter(Boolean).join(' · ') || 'Belum diisi'}
                  </Fact>
                </dl>
                {coords && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${current.latitude},${current.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-link"
                  >
                    Buka titik di Google Maps ↗
                  </a>
                )}
                {current.placeDetails ? (
                  <GooglePlaceDetailCard
                    place={current.placeDetails}
                    currentLat={current.latitude}
                    currentLng={current.longitude}
                  />
                ) : (
                  <p className="doc-note">
                    Profil Google tidak dilampirkan. GPS dan foto perlu ditinjau sebagai bukti
                    terpisah.
                  </p>
                )}
              </div>
            </div>
            {current.taxDocumentUrl ? (
              <a href={current.taxDocumentUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                Buka lampiran identitas ↗
              </a>
            ) : (
              <p className="doc-note">Lampiran identitas tidak tersedia pada pengajuan ini.</p>
            )}
            <dl className="doc-fields">
              <Fact label="Diajukan oleh">{show(current.salesmanName)}</Fact>
              <Fact label="Mengetahui">{show(current.outletKnownBy || current.spvName)}</Fact>
              <Fact label="Persetujuan SPV">
                {current.spvApprovedAt
                  ? `${show(current.spvName)} · ${stamp(current.spvApprovedAt)}`
                  : 'Belum diberikan'}
              </Fact>
              <Fact label="Aktivasi admin">
                {current.adminRegisteredAt
                  ? `${show(current.adminName)} · ${stamp(current.adminRegisteredAt)}`
                  : 'Belum dilakukan'}
              </Fact>
            </dl>
            {current.rejectionNote && (
              <p className="doc-callout">
                <strong>Alasan pengembalian:</strong> {current.rejectionNote}
              </p>
            )}
            <RegistrationRevisionHistory history={current.revisionHistory || []} />
            {ready && (
              <p className="outlet-notice">
                {actions.mode === 'NONE'
                  ? 'Pengajuan siap diaktifkan sesuai kebijakan.'
                  : 'Pengajuan telah disetujui dan siap diaktifkan.'}{' '}
                Setelah aktif, Supervisor perlu memasukkannya ke draft PJP lalu menerbitkan jadwal.
              </p>
            )}
            {current.registrationStatus === 'REGISTERED_ACTIVE' && (
              <p className="outlet-notice">
                Outlet aktif · {current.customerCode}. Status aktif belum berarti sudah terjadwal.
              </p>
            )}
          </div>
        </>
      )}
    </PaperDocumentDialog>
  );
}
