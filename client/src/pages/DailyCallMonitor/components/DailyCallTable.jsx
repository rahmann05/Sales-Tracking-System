import { DataTable } from '../../../shared/components/common/DataTable';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DailyCallTableRow } from './DailyCallTableRow';
import { LuChevronLeft, LuChevronRight, LuInbox } from 'react-icons/lu';

const INITIAL_METRICS = {
  hasOverflow: false,
  scrollWidth: 0,
  canLeft: false,
  canRight: false,
};

/**
 * DailyCallTable Component
 * Single Responsibility: Render table header, list of Daily Call rows, sticky viewport-relative horizontal scroll bar, and empty state.
 */
export const DailyCallTable = ({ rows = [], isLoading = false, onSelectRow }) => {
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollMetrics, setScrollMetrics] = useState(INITIAL_METRICS);

  const regionRef = useRef(null);
  const proxyRef = useRef(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const measureOverflow = useCallback(() => {
    const el = regionRef.current;
    if (!el) return;
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    const scrollLeft = el.scrollLeft;
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
  }, [measureOverflow, rows.length, pageSize, currentPage, isLoading]);

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

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-on-surface-variant font-semibold">
          Memuat data rekapitulasi Daily Call...
        </p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <LuInbox className="text-4xl text-on-surface-variant/40 mx-auto" aria-hidden="true" />
        <h4 className="text-sm font-bold text-on-surface">Tidak Ada Data Kunjungan</h4>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          Belum ada data rekaman kunjungan Daily Call untuk filter tanggal dan sales yang dipilih.
        </p>
      </div>
    );
  }

  const isAll = pageSize === 'ALL';
  const limit = isAll ? rows.length : Number(pageSize);
  const totalPages = isAll ? 1 : Math.ceil(rows.length / limit);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * limit;
  const paginatedRows = isAll ? rows : rows.slice(startIndex, startIndex + limit);

  return (
    <div className="overflow-clip">
      <div
        ref={regionRef}
        tabIndex={0}
        role="region"
        aria-label="Tabel rekapitulasi kunjungan harian"
        className="report-table-region mobile-card-table-wrapper"
      >
        <DataTable
          className="w-full text-left mobile-card-table"
          style={{ '--table-cell-padding': '10px 10px' }}
        >
          <thead>
            <tr className="bg-surface-container/70 border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
              <th className="text-center w-10 py-3.5 px-2 whitespace-nowrap">No</th>
              <th className="py-3.5 px-2.5 min-w-[115px] whitespace-nowrap">Salesman</th>
              <th className="py-3.5 px-2 min-w-[95px] whitespace-nowrap">Jam In / Out</th>
              <th className="text-center py-3.5 px-2 min-w-[70px] whitespace-nowrap">Durasi</th>
              <th className="py-3.5 px-2.5 min-w-[180px]">Customer ID & Nama Toko</th>
              <th className="py-3.5 px-2 min-w-[90px] whitespace-nowrap">Sub Channel</th>
              <th className="text-center py-3.5 px-2 min-w-[110px] whitespace-nowrap">
                Call Status
              </th>
              <th className="text-right py-3.5 px-2 min-w-[105px] whitespace-nowrap">
                Order (Rp) / SKU
              </th>
              <th className="py-3.5 px-2.5 min-w-[150px]">Alasan / Catatan</th>
              <th className="text-center py-3.5 px-2 min-w-[100px] whitespace-nowrap">
                Deviasi GPS
              </th>
              <th className="text-center py-3.5 px-2 w-24 min-w-[85px] whitespace-nowrap">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass/40">
            {paginatedRows.map((row) => (
              <DailyCallTableRow key={row.id} row={row} onSelectRow={onSelectRow} />
            ))}
          </tbody>
        </DataTable>
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

      <div className="p-3 bg-surface-container/60 border-t border-border-glass flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span>
            Menampilkan{' '}
            <strong>
              {isAll
                ? rows.length
                : `${startIndex + 1}–${Math.min(startIndex + limit, rows.length)}`}
            </strong>{' '}
            dari total <strong>{rows.length}</strong> kunjungan
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface border border-border-glass rounded-lg px-2 py-0.5 text-xs font-semibold text-on-surface"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="ALL">Semua</option>
            </select>
          </div>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-border-glass bg-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-on-surface"
            >
              Sebelumnya
            </button>
            <span className="text-[11px] font-mono font-bold">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-border-glass bg-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-on-surface"
            >
              Berikutnya
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
