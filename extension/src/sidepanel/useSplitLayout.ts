import { useCallback, useEffect, useState } from 'react';
import { isWindowMode } from './useWindowMode';

/** From this window width the separate window switches to the DevTools-like split layout (D6). */
const SPLIT_MIN_WIDTH = 900;
const LEFT_WIDTH_KEY = 'splitLeftWidth';
const LEFT_MIN = 260;
const RIGHT_MIN = 360;

const query = `(min-width: ${SPLIT_MIN_WIDTH}px)`;

/**
 * Split layout (list left, details right — like DevTools Network) is used when the panel is
 * in its separate window AND the window is wide (e.g. full screen on a second monitor).
 * The side panel and narrow windows keep the inline 300px boxes.
 */
export function useSplitLayout() {
  const [wide, setWide] = useState(() => matchMedia(query).matches);
  const [leftWidth, setLeftWidth] = useState(() => Math.round(window.innerWidth * 0.4));

  useEffect(() => {
    const mq = matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(LEFT_WIDTH_KEY).then((v) => {
      const saved = v[LEFT_WIDTH_KEY];
      if (typeof saved === 'number') setLeftWidth(saved);
    });
  }, []);

  const clamp = (w: number) => Math.max(LEFT_MIN, Math.min(w, window.innerWidth - RIGHT_MIN));

  /** Drag the divider (pointer events); the chosen width is remembered. */
  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => setLeftWidth(clamp(ev.clientX));
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      chrome.storage.local.set({ [LEFT_WIDTH_KEY]: clamp(ev.clientX) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  return { split: isWindowMode && wide, leftWidth: clamp(leftWidth), startResize };
}
