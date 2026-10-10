const SCRIPT_TIMEOUT_MS = 6000;

/**
 * Load the Google Maps JS API exactly once with resilient timeout and error handling.
 */
export const loadGoogleMapsScript = (apiKey) =>
  new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) return resolve(window.google.maps);

    let isSettled = false;
    const timeoutId = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      console.warn(`[PersistentMapShell] Google Maps script load timed out after ${SCRIPT_TIMEOUT_MS}ms. Triggering fallback.`);
      reject(new Error('Google Maps script load timed out'));
    }, SCRIPT_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete window.__initGoogleMapsCallback;
    };

    window.__initGoogleMapsCallback = () => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(window.google.maps);
    };

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      if (existing.src.includes(`key=${apiKey}`)) {
        if (window.google?.maps?.Map) {
          cleanup();
          return resolve(window.google.maps);
        }
        const prevCallback = window.__initGoogleMapsCallback;
        window.__initGoogleMapsCallback = () => {
          if (prevCallback) prevCallback();
          if (isSettled) return;
          isSettled = true;
          cleanup();
          resolve(window.google.maps);
        };
        existing.addEventListener('error', (e) => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          reject(e);
        });
        return;
      } else {
        // Stale or invalid key on existing script tag — remove and reload
        existing.remove();
        delete window.google;
      }
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=__initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(e);
    };
    document.head.appendChild(script);
  });

