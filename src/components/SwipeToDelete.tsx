import { useRef, useState } from "react";
import "./SwipeToDelete.css";

const SWIPE_THRESHOLD = 60;
const DELETE_REVEAL = 80;

interface SwipeToDeleteProps {
  onDelete: () => void;
  deleteLabel?: string;
  children: React.ReactNode;
}

export function SwipeToDelete({ onDelete, deleteLabel = "🗑", children }: SwipeToDeleteProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx > 0) {
      setOffsetX(0);
      setSwiped(false);
      return;
    }
    isDragging.current = true;
    setOffsetX(Math.max(dx, -DELETE_REVEAL));
  }

  function handleTouchEnd() {
    if (!isDragging.current) return;
    if (offsetX <= -SWIPE_THRESHOLD) {
      setOffsetX(-DELETE_REVEAL);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
    isDragging.current = false;
  }

  function close() {
    setOffsetX(0);
    setSwiped(false);
  }

  return (
    <div className="swipe-delete-wrapper">
      {/* Inner row: content + action sit side by side; row slides via translateX */}
      <div
        className="swipe-delete-row"
        style={{ transform: `translateX(${offsetX}px)`, transition: "transform 0.25s ease" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
