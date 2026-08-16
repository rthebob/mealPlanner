import { useRef, useState, useEffect } from "react";
import "./SwipeToDelete.css";

const SWIPE_THRESHOLD = 60;
const DELETE_REVEAL = 88; // 80px button + 8px gap
const DIRECTION_LOCK_THRESHOLD = 8;

interface SwipeToDeleteProps {
  onDelete: () => void;
  deleteLabel?: string;
  children: React.ReactNode;
}

export function SwipeToDelete({ onDelete, deleteLabel = "🗑", children }: SwipeToDeleteProps) {
  const [swiped, setSwiped] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const baseOffset = useRef(0);   // offset at the moment the finger touched down
  const currentOffset = useRef(0);
  const isDragging = useRef(false);
  const isLocked = useRef<"horizontal" | "vertical" | null>(null);

  function applyTransform(x: number, animated: boolean) {
    const el = rowRef.current;
    if (!el) return;
    el.style.transition = animated ? "transform 0.25s ease" : "none";
    el.style.transform = `translateX(${x}px)`;
    currentOffset.current = x;
  }

  function close() {
    applyTransform(0, true);
    setSwiped(false);
  }

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      baseOffset.current = currentOffset.current; // remember where we are
      isDragging.current = false;
      isLocked.current = null;
      if (rowRef.current) rowRef.current.style.transition = "none";
    }

    function onTouchMove(e: TouchEvent) {
      if (startX.current === null || startY.current === null) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (isLocked.current === null) {
        if (Math.abs(dx) < DIRECTION_LOCK_THRESHOLD && Math.abs(dy) < DIRECTION_LOCK_THRESHOLD) return;
        isLocked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      if (isLocked.current === "vertical") return;

      e.preventDefault();
      isDragging.current = true;

      // Offset is base position + finger delta, clamped between -DELETE_REVEAL and 0
      const next = Math.min(0, Math.max(baseOffset.current + dx, -DELETE_REVEAL));
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(${next}px)`;
        currentOffset.current = next;
      }
    }

    function onTouchEnd() {
      if (isLocked.current !== "horizontal" || !isDragging.current) return;
      isDragging.current = false;
      if (currentOffset.current <= -SWIPE_THRESHOLD) {
        applyTransform(-DELETE_REVEAL, true);
        setSwiped(true);
      } else {
        applyTransform(0, true);
        setSwiped(false);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="swipe-delete-wrapper">
      <div
        ref={rowRef}
        className="swipe-delete-row"
        style={{ transform: "translateX(0)", transition: "transform 0.25s ease" }}
      >
        <div
          className="swipe-delete-content"
          onClickCapture={swiped ? (e) => { e.stopPropagation(); e.preventDefault(); close(); } : undefined}
        >
          {children}
        </div>
        <div className="swipe-delete-action" aria-hidden="true">
          <button
            className="swipe-delete-action__btn"
            onClick={() => { close(); onDelete(); }}
            tabIndex={swiped ? 0 : -1}
            aria-label={deleteLabel}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
