import { useCallback, useEffect, useState } from 'react';
import { setWorkspaceValues } from '../utils/workspaceNavigation';

// Keep working filters in the URL without introducing a second application router.
export function useWorkspaceState(key, initialValue) {
  const read = () =>
    typeof window === 'undefined'
      ? initialValue
      : (new URLSearchParams(window.location.search).get(key) ?? initialValue);
  const [value, setValue] = useState(read);
  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('workspace-state-changed', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('workspace-state-changed', sync);
    };
  }, [key, initialValue]);
  const update = useCallback(
    (next, { replace = false } = {}) => {
      setWorkspaceValues({ [key]: next }, { replace });
    },
    [key, initialValue]
  );
  return [value, update];
}
