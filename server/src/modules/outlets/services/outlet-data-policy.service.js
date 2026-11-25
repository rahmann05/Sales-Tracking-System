import { AppError } from '../../../utils/errors.js';
import { matchesOutletChannel } from '../../../../../shared/outlet-trade.mjs';
import {
  validateIndonesianPhone,
  validateIndonesianTaxNumber,
} from '../../../../../shared/indonesia-identity.mjs';
export function assertOutletTrade(input, previous = {}) {
  if (input.channel === undefined && input.subChannel === undefined) return;
  if (
    !matchesOutletChannel(
      input.channel || previous.channel || 'GENERAL_TRADE',
      input.subChannel || previous.subChannel
    )
  )
    throw new AppError(
      'Jenis outlet tidak sesuai channel. Pilih jenis General Trade atau Modern Trade yang sesuai.',
      400
    );
}
export function assertOutletLegal(input, previous = {}) {
  if (input.taxNumber !== undefined || input.taxType !== undefined) {
    const type = input.taxType || previous.taxType || 'NON_PKP';
    const number = input.taxNumber === undefined ? previous.taxNumber : input.taxNumber;
    const taxError = validateIndonesianTaxNumber(type, number);
    if (taxError) throw new AppError(taxError, 400);
  }
  if (input.phone !== undefined) {
    const phoneError = validateIndonesianPhone(input.phone);
    if (phoneError) throw new AppError(phoneError, 400);
  }
}
export function assertRequestReplay(existing, input, actor, creatorId) {
  if (
    creatorId !== actor?.id ||
    [
      'name',
      'address',
      'latitude',
      'longitude',
      'clusterId',
      'ownerName',
      'phone',
      'taxType',
      'taxNumber',
      'taxName',
      'taxAddress',
      'channel',
      'subChannel',
      'radiusMeters',
      'visitIntervalWeeks',
    ].some((k) => input[k] !== undefined && (existing[k] ?? '') !== (input[k] ?? ''))
  )
    throw new AppError('Identitas pengiriman sudah digunakan untuk data berbeda.', 409);
  return existing;
}
