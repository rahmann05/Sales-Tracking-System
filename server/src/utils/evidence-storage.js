import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evidenceImageError,
  INTERNAL_EVIDENCE_URL_PATTERN,
} from '../../../shared/evidence-image-policy.mjs';

export const EVIDENCE_DOMAINS = new Set(['attendance', 'off-pjp', 'noo', 'delivery', 'vehicle']);
const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const EXT_TO_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export const defaultEvidenceRoot = () => path.resolve(process.cwd(), 'storage', 'evidence');

export const isInternalEvidenceUrl = (value) =>
  typeof value === 'string' && INTERNAL_EVIDENCE_URL_PATTERN.test(value);

/**
 * Persists a validated Base64 data URL image to internal application disk storage.
 */
export async function persistEvidenceImage(
  dataUrl,
  {
    domain = 'noo',
    rootDir = defaultEvidenceRoot(),
    now = new Date(),
    policyValues = {},
    skipPolicyCheck = false,
  } = {}
) {
  if (!EVIDENCE_DOMAINS.has(domain)) {
    throw new Error(`Unsupported evidence domain: ${domain}`);
  }
  if (!skipPolicyCheck) {
    const validationError = evidenceImageError(dataUrl, policyValues, 'Foto bukti');
    if (validationError) {
      throw new Error(validationError);
    }
  }
  const match = DATA_URL_RE.exec(dataUrl || '');
  if (!match) {
    throw new Error('Foto bukti harus berupa data URL gambar JPEG/PNG/WEBP');
  }
  const mimeType = match[1];
  const ext = MIME_TO_EXT[mimeType];
  const buffer = Buffer.from(match[2], 'base64');
  const ym = now.toISOString().slice(0, 7);
  const filename = `${randomUUID()}.${ext}`;
  const resolvedRoot = path.resolve(rootDir);
  const targetDir = path.join(resolvedRoot, domain, ym);
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, filename);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/api/v1/evidence/${domain}/${ym}/${filename}`,
    filePath,
    bytes: buffer.length,
    mimeType,
  };
}

/**
 * Persists a validated data URL image to disk when EVIDENCE_STORAGE_MODE=DISK;
 * otherwise returns the input value unchanged.
 */
export async function maybePersistEvidenceImage(
  value,
  domain,
  { rootDir = defaultEvidenceRoot(), now = new Date(), policyValues, skipPolicyCheck = true } = {}
) {
  if (process.env.EVIDENCE_STORAGE_MODE !== 'DISK') {
    return value;
  }
  if (typeof value !== 'string' || !value.startsWith('data:') || isInternalEvidenceUrl(value)) {
    return value;
  }
  const stored = await persistEvidenceImage(value, {
    domain,
    rootDir,
    now,
    policyValues: policyValues || {},
    skipPolicyCheck: policyValues ? false : skipPolicyCheck,
  });
  return stored.url;
}

/**
 * Safely resolves an internal evidence URL segment triple into an absolute disk path.
 */
export function resolveStoredEvidenceFile(domain, ym, filename, rootDir = defaultEvidenceRoot()) {
  if (!EVIDENCE_DOMAINS.has(domain) || !/^\d{4}-\d{2}$/.test(String(ym || ''))) {
    return null;
  }
  const match = /^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.exec(String(filename || ''));
  if (!match) {
    return null;
  }
  const resolvedRoot = path.resolve(rootDir);
  const filePath = path.resolve(resolvedRoot, domain, ym, filename);
  if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null;
  }
  return {
    filePath,
    contentType: EXT_TO_MIME[match[1].toLowerCase()],
  };
}
