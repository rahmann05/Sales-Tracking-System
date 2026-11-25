import { documentImages } from './documentImages';

let logoPromise = null;

/**
 * Logo kop surat untuk PDF / Word / Excel. Mengembalikan null bila logo tidak dapat dimuat,
 * sehingga ekspor tetap berjalan dengan kop berupa teks saja (tidak pernah menggagalkan ekspor).
 */
export function loadDocumentLogo() {
  if (!logoPromise) {
    logoPromise = documentImages({ images: [{ url: '/logo-mark.png', caption: 'Logo' }] })
      .then((images) => images[0] || null)
      .catch(() => null);
  }
  return logoPromise;
}

/** Ukuran logo kop (mm) dengan rasio asli. */
export function logoSize(logo, heightMm = 14) {
  if (!logo || !(logo.width > 0 && logo.height > 0)) return { width: heightMm, height: heightMm };
  return { width: (logo.width / logo.height) * heightMm, height: heightMm };
}
