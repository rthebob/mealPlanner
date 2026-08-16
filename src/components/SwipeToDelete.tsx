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
  const dragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    dragging.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx > 0) {
      setOffsetX(0);
      setSwiped(false);
      return;
    }
    dragging.current = true;
    setOffsetX(Math.max(dx, -DELETE_REVEAL));
  }

  function handleTouchEnd() {
    if (!dragging.current) return;
    if (offsetX <= -SWIPE_THRESHOLD) {
      setOffsetX(-DELETE_REVEAL);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
    dragging.current = false;
  }

  function close() {
    setOffsetX(0);
    setSwiped(false);
  }

  return (
    <div className="swipe-delete-wrapper">
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
      <div
        className="swipe-delete-content"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? "none" : "transform 0.25s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? close : undefined}
      >
        {children}
      </div>
    </div>
  );
}
