import { T } from "../i18n";
import "./DaySelector.css";

interface DaySelectorProps {
  selected: number;
  onSelect: (n: number) => void;
}

const OPTIONS = [3, 4, 5, 6, 7];

export function DaySelector({ selected, onSelect }: DaySelectorProps) {
  return (
    <div className="day-selector" role="group" aria-label="Vyberte počet dní">
      {OPTIONS.map((n) => (
        <button
          key={n}
          className={`day-selector__btn${selected === n ? " day-selector__btn--active" : ""}`}
          onClick={() => onSelect(n)}
          aria-pressed={selected === n}
        >
          {T.days(n)}
        </button>
      ))}
    </div>
  );
}
