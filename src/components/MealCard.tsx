import type { Meal } from "../types";
import { T } from "../i18n";
import "./MealCard.css";

interface MealCardProps {
  meal?: Meal | null;
  onClick: () => void;
  compact?: boolean;
}

export function MealCard({ meal, onClick, compact }: MealCardProps) {
  if (!meal) {
    return (
      <button
        className={`meal-card meal-card--empty${compact ? " meal-card--compact" : ""}`}
        onClick={onClick}
        aria-label={T.addMeal}
      >
        <span className="meal-card__add-icon">+</span>
        <span className="meal-card__add-label">{T.addMeal}</span>
      </button>
    );
  }

  return (
    <button
      className={`meal-card${compact ? " meal-card--compact" : ""}`}
      onClick={onClick}
      aria-label={meal.name}
    >
      <h3 className="meal-card__name">{meal.name}</h3>
      {!compact && <p className="meal-card__description">{meal.description}</p>}
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
}
