import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const INITIAL_METRICS = {
  hasOverflow: false,
  scrollWidth: 0,
  canLeft: false,
  canRight: false,
};

/**
 * Shared horizontally scrollable report table region with sticky viewport-relative scrollbar.
 */
export function ReportTableScroller({ ariaLabel, resetKey, className = '', children }) {
  const [scrollMetrics, setScrollMetrics] = useState(INITIAL_METRICS);
  const regionRef = useRef(null);
  const proxyRef = useRef(null);
  const syncingRef = useRef(false);

  const measureOverflow = useCallback(() => {
    const el = regionRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const next = {
      hasOverflow: scrollWidth - clientWidth > 2,
      scrollWidth,
      canLeft: scrollLeft > 2,
      canRight: scrollLeft + clientWidth < scrollWidth - 2,
    };
    setScrollMetrics((prev) =>
      prev.hasOverflow === next.hasOverflow &&
      Math.abs(prev.scrollWidth - next.scrollWidth) <= 1 &&
      prev.canLeft === next.canLeft &&
      prev.canRight === next.canRight
        ? prev
        : next
    );
  }, []);

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return undefined;
    measureOverflow();

    const handleScroll = () => {
      if (!syncingRef.current && proxyRef.current) {
        syncingRef.current = true;
        proxyRef.current.scrollLeft = el.scrollLeft;
        queueMicrotask(() => {
          syncingRef.current = false;
        });
      }
      measureOverflow();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measureOverflow);
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro?.disconnect();
    };
  }, [measureOverflow, resetKey]);

  useEffect(() => {
    if (scrollMetrics.hasOverflow && proxyRef.current && regionRef.current) {
      proxyRef.current.scrollLeft = regionRef.current.scrollLeft;
    }
  }, [scrollMetrics.hasOverflow]);

  const handleProxyScroll = () => {
    const el = regionRef.current;
    const proxy = proxyRef.current;
    if (!el || !proxy || syncingRef.current) return;
    syncingRef.current = true;
    el.scrollLeft = proxy.scrollLeft;
    queueMicrotask(() => {
      syncingRef.current = false;
    });
    measureOverflow();
  };

  const nudgeScroll = (delta) => {
    const el = regionRef.current;
    if (!el) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    el.scrollBy({ left: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <div
        ref={regionRef}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        className={`report-table-region mobile-card-table-wrapper ${className}`.trim()}
      >
        {children}
      </div>

      {scrollMetrics.hasOverflow ? (
        <div className="report-table-hscroll" aria-label="Kontrol geser horizontal tabel">
          <button
            type="button"
            className="report-table-hscroll-btn"
            aria-label="Geser tabel ke kiri"
            disabled={!scrollMetrics.canLeft}
            onClick={() => nudgeScroll(-320)}
          >
            <LuChevronLeft aria-hidden="true" />
          </button>
          <div
            ref={proxyRef}
            className="report-table-hscroll-track"
            aria-hidden="true"
            onScroll={handleProxyScroll}
          >
            <div style={{ width: `${scrollMetrics.scrollWidth}px`, height: '1px' }} />
          </div>
          <button
            type="button"
            className="report-table-hscroll-btn"
            aria-label="Geser tabel ke kanan"
            disabled={!scrollMetrics.canRight}
            onClick={() => nudgeScroll(320)}
          >
            <LuChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
