import type { Meal } from "../types";
import { T } from "../i18n";
import { SwipeToDelete } from "./SwipeToDelete";
import "./MealCard.css";

// ── Single meal card ─────────────────────────────────────────────────────────
interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  onSwipeDelete?: () => void;
  compact?: boolean;
}

export function MealCard({ meal, onClick, onSwipeDelete, compact }: MealCardProps) {
  const card = (
    <button
      className={`meal-card${compact ? " meal-card--compact" : ""}`}
      onClick={onClick}
      aria-label={meal.name}
    >
      <h3 className="meal-card__name">{meal.name}</h3>
      <div className="meal-card__macros">
        <span className="meal-card__macro">🔥 {meal.macros.calories} kcal</span>
        <span className="meal-card__macro">💪 {meal.macros.protein}g</span>
        <span className="meal-card__macro">
          🌾 {meal.macros.carbohydrates}g
        </span>
        <span className="meal-card__macro">🥑 {meal.macros.fat}g</span>
      </div>
    </button>
  );

  if (onSwipeDelete) {
    return (
      <SwipeToDelete onDelete={onSwipeDelete}>
        {card}
      </SwipeToDelete>
    );
  }

  return card;
}

// ── Slot cell: list of meals + add button ────────────────────────────────────
interface SlotCellProps {
  meals: Meal[];
  onMealClick: (mealIndex: number) => void;
  onMealDelete?: (mealIndex: number) => void;
  onAdd: () => void;
  compact?: boolean;
  readOnly?: boolean;
}

export function SlotCell({
  meals: mealsProp,
  onMealClick,
  onMealDelete,
  onAdd,
  compact,
  readOnly,
}: SlotCellProps) {
  const meals: Meal[] = Array.isArray(mealsProp) ? mealsProp : [];
  return (
    <div className="slot-cell">
      {meals.map((meal, i) => (
        <MealCard
          key={meal.id}
          meal={meal}
          onClick={() => onMealClick(i)}
          onSwipeDelete={!readOnly && onMealDelete ? () => onMealDelete(i) : undefined}
          compact={compact}
        />
      ))}
      {!readOnly && (
        <button
          className={`meal-card meal-card--empty${compact ? " meal-card--compact" : ""}${meals.length > 0 ? " meal-card--add-more" : ""}`}
          onClick={onAdd}
          aria-label={meals.length === 0 ? T.addMeal : T.addAnotherMeal}
        >
          <span className="meal-card__add-icon">+</span>
          <span className="meal-card__add-label">
            {meals.length === 0 ? T.addMeal : T.addAnotherMeal}
          </span>
        </button>
      )}
      {readOnly && meals.length === 0 && (
        <div className="slot-cell__empty-readonly">—</div>
      )}
    </div>
  );
}
