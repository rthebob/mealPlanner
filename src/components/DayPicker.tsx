import { T } from "../i18n";
import "./DayPicker.css";

interface DayPickerProps {
  days: string[];
  selectedIndex: number;
  todayIndex: number;
  date?: string; // e.g. "20. 7."
  onPrev: () => void; // called when left arrow clicked (may cross week boundary)
  onNext: () => void; // called when right arrow clicked (may cross week boundary)
  canPrev: boolean;
  canNext: boolean;
  onChange: (index: number) => void;
}

export function DayPicker({
  days,
  selectedIndex,
  todayIndex,
  date,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onChange,
}: DayPickerProps) {
  const isToday = selectedIndex === todayIndex;
  const todayValid = todayIndex >= 0 && todayIndex < days.length;

  return (
    <div className="day-picker">
      <button
        className="day-picker__arrow"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={T.prevDay}
      >
        ‹
      </button>

      <div className="day-picker__label">
        <svg
          className="day-picker__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <text
            x="12"
            y="19"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            stroke="none"
            fill="currentColor"
          >
            {selectedIndex + 1}
          </text>
        </svg>
        <span className="day-picker__day-name">{days[selectedIndex]}</span>
        {date && <span className="day-picker__date">{date}</span>}
      </div>

      <button
        className="day-picker__arrow"
        onClick={onNext}
        disabled={!canNext}
        aria-label={T.nextDay}
      >
        ›
      </button>

      {todayValid && (
        <button
          className={`day-picker__today${isToday ? " day-picker__today--active" : ""}`}
          onClick={() => onChange(todayIndex)}
          disabled={isToday}
          aria-label={T.todayBtn}
          title={T.todayBtn}
        >
          {T.todayBtn}
        </button>
      )}
    </div>
  );
}
