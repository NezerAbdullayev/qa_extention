import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { t } from '../shared/i18n';

const DEFAULT_MAX = 300; // D1: the box follows its content up to 300px
const MIN_HEIGHT = 60;

/**
 * Inline detail box (all three tabs, not the split-pane view): height follows the content up
 * to 300px, scrolls inside. The handle on the bottom edge drags the height by hand — beyond
 * 300px too; double-click returns to the default.
 */
export function ResizableBox(props: {
  /** Outer wrapper (margins); the drag handle sits on its bottom edge. */
  outerClassName?: string;
  /** The scrolling box itself (border, background, padding). */
  className?: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  const startResize = (e: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    if (!box) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startHeight = box.getBoundingClientRect().height;

    const onMove = (ev: globalThis.PointerEvent) =>
      setHeight(Math.max(MIN_HEIGHT, Math.round(startHeight + ev.clientY - startY)));
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  return (
    <div className={`relative ${props.outerClassName ?? ''}`}>
      <div
        ref={boxRef}
        className={`overflow-auto ${props.className ?? ''}`}
        style={height === null ? { maxHeight: DEFAULT_MAX } : { height, maxHeight: 'none' }}
      >
        {props.children}
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        title={t('box_resize_hint')}
        onPointerDown={startResize}
        onDoubleClick={() => setHeight(null)}
        onClick={(e) => e.stopPropagation()}
        className="group absolute inset-x-0 -bottom-1 flex h-2 cursor-row-resize touch-none items-center justify-center"
      >
        <span className="h-0.5 w-8 rounded bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}
