import { useCallback, useEffect, useRef, useState } from 'react';
import { ordersApi, collectPages } from '../../../services/api';

export function useSalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const flight = useRef(0);
  const hasLoaded = useRef(false);

  const reload = useCallback(async (forceSpinner = false) => {
    const seq = ++flight.current;
    if (!hasLoaded.current || forceSpinner) setLoading(true);
    try {
      const res = await collectPages(ordersApi.getAllOrders);
      if (seq === flight.current) {
        setOrders(res.data);
        setError('');
        hasLoaded.current = true;
      }
    } catch (e) {
      if (seq === flight.current) {
        setError(e.message);
      }
    } finally {
      if (seq === flight.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const tick = setInterval(reload, 60000);
    window.addEventListener('focus', reload);
    window.addEventListener('operational-data-changed', reload);
    return () => {
      flight.current++;
      clearInterval(tick);
      window.removeEventListener('focus', reload);
      window.removeEventListener('operational-data-changed', reload);
    };
  }, [reload]);

  return { orders, loading, error, reload };
}
