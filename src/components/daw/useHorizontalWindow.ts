import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * A small horizontal-windowing hook for virtualized grids. It tracks the
 * scroll position and viewport width of a scroll container and returns the
 * visible index range `[start, end)` for a fixed-size item grid, plus the
 * total content width. Only the items in that range are rendered, so arbitrarily
 * long content stays fast.
 */
export function useHorizontalWindow(itemWidth: number, totalItems: number, overscan = 2) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportW, setViewportW] = useState(0);

  // Measure the viewport width on mount and on resize so the initial render shows
  // the full window, rather than only after the user scrolls (which fires onScroll).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportW(el.clientWidth);
    const onResize = () => setViewportW(el.clientWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollLeft(el.scrollLeft);
    setViewportW(el.clientWidth);
  }, []);

  const totalW = totalItems * itemWidth;
  const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan);
  const end = Math.min(totalItems, start + Math.ceil(viewportW / itemWidth) + overscan * 2 + 1);

  return { scrollRef, onScroll, totalW, start, end, scrollLeft };
}
