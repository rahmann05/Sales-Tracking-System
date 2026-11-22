/**
 * Checks whether a value resembles a Prisma/decimal.js Decimal instance.
 */
export function isDecimalLike(value) {
  if (!value || typeof value !== 'object' || typeof value.toNumber !== 'function') {
    return false;
  }
  return (
    value.constructor?.name === 'Decimal' ||
    (Array.isArray(value.d) && typeof value.e === 'number' && typeof value.s === 'number')
  );
}

/**
 * Converts numbers, numeric strings, and Prisma Decimal objects into finite JS numbers.
 */
export function toMoneyNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (isDecimalLike(value)) {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Recursively normalizes any Decimal instances in API response payloads to numbers
 * so Decimal(18,2) schema columns remain wire-compatible with numeric JSON contracts.
 */
export function normalizeDecimalValues(payload, seen = new WeakSet()) {
  if (payload === null || payload === undefined || typeof payload !== 'object') {
    return payload;
  }
  if (isDecimalLike(payload)) {
    return payload.toNumber();
  }
  if (payload instanceof Date || Buffer.isBuffer(payload) || ArrayBuffer.isView(payload)) {
    return payload;
  }
  if (seen.has(payload)) {
    return payload;
  }
  seen.add(payload);

  if (Array.isArray(payload)) {
    let changed = false;
    const next = payload.map((item) => {
      const normalized = normalizeDecimalValues(item, seen);
      if (normalized !== item) changed = true;
      return normalized;
    });
    return changed ? next : payload;
  }

  let changed = false;
  const result = {};
  for (const [key, val] of Object.entries(payload)) {
    const normalized = normalizeDecimalValues(val, seen);
    if (normalized !== val) changed = true;
    result[key] = normalized;
  }
  return changed ? result : payload;
}
