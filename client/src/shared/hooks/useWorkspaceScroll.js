import { useEffect } from 'react';
import { saveWorkspaceScroll } from '../utils/workspaceNavigation';

// The app scrolls its main pane, so the browser's document restoration is insufficient.
export function useWorkspaceScroll(mainRef, userId) {
  useEffect(() => {
    const main = mainRef.current;
    if (!main || !userId) return;
    let frame = 0,
      restoring = false;
    const cancel = () => {
      cancelAnimationFrame(frame);
      restoring = false;
    };
    const save = () => {
      if (!restoring) saveWorkspaceScroll();
    };
    const restore = () => {
      cancel();
      restoring = true;
      const point = window.history.state?.workspaceScroll || { top: 0, left: 0 },
        started = performance.now();
      const apply = () => {
        main.scrollTo({ top: point.top, left: point.left, behavior: 'instant' });
        // Wait for lazy modules and their fetched rows before restoring a long list.
        if (
          main.scrollHeight - main.clientHeight >= point.top ||
          performance.now() - started > 5000
        ) {
          restoring = false;
          return;
        }
        frame = requestAnimationFrame(apply);
      };
      frame = requestAnimationFrame(apply);
    };
    main.addEventListener('scroll', save, { passive: true });
    for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
      main.addEventListener(name, cancel, { passive: true });
    window.addEventListener('popstate', restore);
    window.addEventListener('workspace-state-changed', restore);
    restore();
    return () => {
      cancel();
      main.removeEventListener('scroll', save);
      for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
        main.removeEventListener(name, cancel);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('workspace-state-changed', restore);
    };
  }, [mainRef, userId]);
}
