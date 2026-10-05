import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { AdminFeatureCard } from './AdminFeatureCard';

/**
 * SectionSlider Component
 * Carousel / Slider for each categorized section with 3D cards,
 * left/right navigation controls, smooth snap scrolling, mouse drag support,
 * and pagination indicators.
 */
export const SectionSlider = memo(({
  title,
  count,
  description,
  items = [],
  onCardClick,
  onCardHover,
}) => {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Drag-to-scroll interaction state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const checkScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);

    const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 16 : 340;
    const newSlide = Math.min(Math.round(scrollLeft / cardWidth), items.length - 1);
    setActiveSlide(newSlide);
  }, [items.length]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    checkScrollState();
    const timer1 = setTimeout(checkScrollState, 80);
    const timer2 = setTimeout(checkScrollState, 300);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScrollState();
      });
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }

    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (ro) ro.disconnect();
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  const scrollLeft = () => {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 20 : 340;
    el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 20 : 340;
    el.scrollBy({ left: cardWidth, behavior: 'smooth' });
  };

  const scrollToIndex = (idx) => {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 20 : 340;
    el.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
  };

  // Mouse Drag Handlers for tactile horizontal panning
  const handleMouseDown = (e) => {
    const el = sliderRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    startScrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = sliderRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const distance = (x - startXRef.current);
    if (Math.abs(distance) > 6) {
      hasMovedRef.current = true;
      el.scrollLeft = startScrollLeftRef.current - distance;
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleCardClickSafe = (id) => {
    if (hasMovedRef.current) {
      // Swallowed: user was dragging, not clicking
      return;
    }
    if (onCardClick) onCardClick(id);
  };

  return (
    <section className="space-y-3.5">
      {/* ── Section Header with Navigation Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-neutral-200/90 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-neutral-900 rounded-full shrink-0" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900 m-0">
            {title}
          </h2>
          {count && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 shrink-0">
              {count}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {description && (
            <p className="text-xs text-neutral-500 hidden md:block m-0 max-w-md truncate text-right">
              {description}
            </p>
          )}

          {/* Slider Arrow Navigation Controls */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 shadow-2xs active:scale-95'
                  : 'bg-neutral-100 border-neutral-200/60 text-neutral-300 cursor-not-allowed opacity-40'
              }`}
              title="Geser ke kiri"
              aria-label="Previous slide"
            >
              <LuChevronLeft className="text-sm" />
            </button>

            {/* Slide Dots */}
            <div className="flex items-center gap-1 px-1">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx
                      ? 'w-4 bg-neutral-900'
                      : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 shadow-2xs active:scale-95'
                  : 'bg-neutral-100 border-neutral-200/60 text-neutral-300 cursor-not-allowed opacity-40'
              }`}
              title="Geser ke kanan"
              aria-label="Next slide"
            >
              <LuChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slider Horizontal Track with 3D Snap Cards ── */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 -mx-1 no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((feature) => (
          <div
            key={feature.id + feature.title}
            className="shrink-0 snap-start w-[285px] sm:w-[310px] md:w-[325px] lg:w-[340px] min-w-[275px]"
          >
            <AdminFeatureCard
              id={feature.id}
              title={feature.title}
              description={feature.description}
              category={feature.category}
              categoryLabel={feature.categoryLabel}
              icon={feature.icon}
              badge={feature.badge}
              badgeVariant={feature.badgeVariant}
              onClick={handleCardClickSafe}
              onMouseEnter={onCardHover}
            />
          </div>
        ))}
      </div>
    </section>
  );
});
