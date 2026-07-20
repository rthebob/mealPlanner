import type { DayPlan } from "../types";
import { MealCard } from "./MealCard";
import { T } from "../i18n";
import "./MealTable.css";

interface MealTableProps {
  days: DayPlan[];
  onCellClick: (dayIndex: number, mealKey: keyof Omit<DayPlan, "day">) => void;
}

const MEAL_ROWS: {
  key: keyof Omit<DayPlan, "day">;
  label: string;
  isSnack?: boolean;
}[] = [
  { key: "breakfast", label: T.breakfast },
  { key: "morningSnack", label: T.morningSnack, isSnack: true },
  { key: "lunch", label: T.lunch },
  { key: "afternoonSnack", label: T.afternoonSnack, isSnack: true },
  { key: "dinner", label: T.dinner },
];

export function MealTable({ days, onCellClick }: MealTableProps) {
  return (
    <div className="meal-table-wrapper">
      <div
        className="meal-table"
        style={{ "--day-count": days.length } as React.CSSProperties}
      >
        <div className="meal-table__corner" />
        {days.map((d) => (
          <div key={d.day} className="meal-table__day-header">
            {d.day}
          </div>
        ))}

        {MEAL_ROWS.map(({ key, label, isSnack }) => (
          <>
            <div
              key={`label-${key}`}
              className={`meal-table__row-label${isSnack ? " meal-table__row-label--snack" : ""}`}
            >
              {label}
            </div>
            {days.map((d, dayIndex) => (
              <div
                key={`${d.day}-${key}`}
                className={`meal-table__cell${isSnack ? " meal-table__cell--snack" : ""}`}
              >
                <MealCard
                  meal={d[key]}
                  onClick={() => onCellClick(dayIndex, key)}
                  compact={isSnack}
                />
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
