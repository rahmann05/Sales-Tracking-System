import { CONFIG_PARAMS, parseConfigValue } from '../../../../../shared/config.mjs';
import { AppError } from '../../../utils/errors.js';
import { CODE_ENTITIES, codePolicy, validateCodePolicy } from '../../../../../shared/coding.mjs';

export function validateConfigMap(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new AppError('Konfigurasi harus berupa objek', 400);
  return Object.fromEntries(Object.entries(values).map(([key, raw]) => {
    const param = CONFIG_PARAMS.find(p => p.key === key);
    try {
      if (param) return [key, parseConfigValue(param, raw)];
      if (key === 'LOGISTICS_METRICS' && raw && ['pricePerCarton', 'grossMarginPercent', 'baseDropCost'].every(k => typeof raw[k] === 'number' && Number.isFinite(raw[k]) && raw[k] >= 0) && raw.grossMarginPercent <= 100) {
        return [key, Object.fromEntries(['pricePerCarton', 'grossMarginPercent', 'baseDropCost'].map(k => [k, raw[k]]))];
      }
      throw new Error(`Parameter ${key} tidak valid atau belum terdaftar`);
    } catch (error) { throw new AppError(error.message, 400); }
  }));
}

export function validateConfigRelations(values) {
  for (const entity of CODE_ENTITIES) {
    try { validateCodePolicy(codePolicy(entity.key,values)); }
    catch(error) { throw new AppError(`${entity.label}: ${error.message}`,400); }
  }
  for (const [lower, upper] of [
    ['VALIDATION_DISTANCE_WARNING', 'VALIDATION_DISTANCE_SUSPECT'],
    ['VALIDATION_CONFIDENCE_THRESHOLD_WARNING', 'VALIDATION_CONFIDENCE_THRESHOLD_LIKELY'],
    ['VALIDATION_CONFIDENCE_THRESHOLD_LIKELY', 'VALIDATION_CONFIDENCE_THRESHOLD_VALID'],
    ['TRAVEL_GAP_SHORT_KM', 'TRAVEL_GAP_MED_KM'],
  ]) {
    if (Number(values[lower]) >= Number(values[upper])) throw new AppError(`${lower} harus lebih kecil dari ${upper}`, 400);
  }
}
