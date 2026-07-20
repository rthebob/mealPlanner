import type { DayPlan, MacroGoals } from "../types";
import { MealCard } from "./MealCard";
import { T } from "../i18n";
import "./MealTable.css";

interface MealTableProps {
  days: DayPlan[];
  onCellClick: (dayIndex: number, mealKey: keyof Omit<DayPlan, "day">) => void;
  goals: MacroGoals;
  readOnly?: boolean;
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

interface MacroMeta {
  key: keyof MacroGoals;
  label: string;
  unit: string;
  color: string;
}
const MACRO_DEFS: MacroMeta[] = [
  { key: "calories", label: T.calories, unit: "kcal", color: "#e94560" },
  { key: "protein", label: T.protein, unit: "g", color: "#3b82f6" },
  { key: "carbohydrates", label: T.carbs, unit: "g", color: "#22c55e" },
  { key: "fat", label: T.fat, unit: "g", color: "#f59e0b" },
];

// ── Single mini donut ──────────────────────────────────────────────────────
function MiniDonut({
  current,
  goal,
  label,
  unit,
  color,
}: {
  current: number;
  goal: number;
  label: string;
  unit: string;
  color: string;
}) {
  const SIZE = 72;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 26;
  const STROKE = 7;
  const circ = 2 * Math.PI * R;
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const over = goal > 0 && current > goal;
  const fill = over ? "#e94560" : color;
  const dash = pct * circ;
  const gap = circ - dash;
  const pctLabel = goal > 0 ? Math.round(pct * 100) : 0;

  return (
    <div className="mini-donut">
      <span className="mini-donut__label">{label}</span>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`${label}: ${current} ${unit}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="var(--donut-track)"
          strokeWidth={STROKE}
        />
        {/* Fill */}
        {dash > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={fill}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        )}
        {/* Percentage label */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="700"
          fill={over ? "#e94560" : "var(--color-text)"}
        >
          {pctLabel}&nbsp;%
        </text>
      </svg>
      <span
        className={`mini-donut__value${over ? " mini-donut__value--over" : ""}`}
      >
        {current} {unit !== "kcal" ? unit : "kcal"}
      </span>
      <span className="mini-donut__goal">
        z {goal} {unit !== "kcal" ? unit : "kcal"}
      </span>
    </div>
  );
}

// ── DayTotals row ─────────────────────────────────────────────────────────
function DayTotals({ day, goals }: { day: DayPlan; goals: MacroGoals }) {
  const mealSlots: (keyof Omit<DayPlan, "day">)[] = [
    "breakfast",
    "morningSnack",
    "lunch",
    "afternoonSnack",
    "dinner",
  ];

  const totals = mealSlots.reduce(
    (acc, key) => {
      const meal = day[key];
      if (!meal) return acc;
      return {
        calories: acc.calories + meal.macros.calories,
        protein: acc.protein + meal.macros.protein,
        carbohydrates: acc.carbohydrates + meal.macros.carbohydrates,
        fat: acc.fat + meal.macros.fat,
      };
    },
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );

  return (
    <div className="day-totals">
      {MACRO_DEFS.map(({ key, label, unit, color }) => (
        <MiniDonut
          key={key}
          current={totals[key]}
          goal={goals[key]}
          label={label}
          unit={unit}
          color={color}
        />
      ))}
    </div>
  );
}

// ── MealTable ─────────────────────────────────────────────────────────────
export function MealTable({
  days,
  onCellClick,
  goals,
  readOnly,
}: MealTableProps) {
  return (
    <div className="meal-table-outer">
      {readOnly && (
        <div className="meal-table-readonly-banner">{T.readOnlyBanner}</div>
      )}
      <div className="meal-table-wrapper">
        <div
          className="meal-table"
          style={{ "--day-count": days.length } as React.CSSProperties}
        >
          {/* Header row */}
          <div className="meal-table__corner" />
          {days.map((d) => (
            <div key={d.day} className="meal-table__day-header">
              {d.day}
            </div>
          ))}

          {/* Meal rows */}
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
                    onClick={() => !readOnly && onCellClick(dayIndex, key)}
                    compact={isSnack}
                  />
                </div>
              ))}
            </>
          ))}

          {/* Totals row */}
          <div className="meal-table__row-label meal-table__row-label--total">
            {T.totalRow}
          </div>
          {days.map((d) => (
            <div
              key={`${d.day}-totals`}
              className="meal-table__cell meal-table__cell--totals"
            >
              <DayTotals day={d} goals={goals} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
