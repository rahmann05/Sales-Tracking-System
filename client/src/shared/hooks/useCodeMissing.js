import { useApp } from '../../context/AppContext';
import { manualCodeRequired } from '../../../../shared/coding.mjs';

/** True when the entity's code is typed by hand (auto-coding off), required, and still empty. */
export function useCodeMissing(entity, value, { optional = false, existing = false } = {}) {
  const { settings } = useApp();
  return (
    manualCodeRequired(entity, settings) && !optional && !existing && !String(value || '').trim()
  );
}
