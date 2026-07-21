import { useEffect, useState } from "react";
import type { Meal, Macros, Ingredient, MealType } from "../types";
import { T } from "../i18n";
import "./MealModal.css";

interface MealModalProps {
  meal: Meal;
  onClose: () => void;
  onSave: (updated: Meal) => void;
  initialEditMode?: boolean;
}

function emptyIngredient(): Ingredient {
  return { name: "", amount: "", unit: "" };
}

const MEAL_TYPE_DEFS: { type: MealType; label: string; emoji: string }[] = [
  { type: "breakfast", label: T.mealTypeBreakfast, emoji: "☀️" },
  { type: "snack", label: T.mealTypeSnack, emoji: "🍎" },
  { type: "lunch", label: T.mealTypeLunch, emoji: "🍝" },
  { type: "dinner", label: T.mealTypeDinner, emoji: "🌝" },
];

export function MealModal({
  meal,
  onClose,
  onSave,
  initialEditMode,
}: MealModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode ?? false);
  const [draft, setDraft] = useState<Meal>({
    ...meal,
    serves: meal.serves ?? 1,
    ingredients: meal.ingredients.map((ing) => ({ ...ing })),
    procedure: [...meal.procedure],
  });

  // Keep base ingredient amounts to scale from, not compound on each change
  const [baseIngredients, setBaseIngredients] = useState(() =>
    meal.ingredients.map((ing) => ({ ...ing })),
  );
  const [baseServes, setBaseServes] = useState(() => meal.serves ?? 1);

  useEffect(() => {
    const newDraft = {
      ...meal,
      serves: meal.serves ?? 1,
      ingredients: meal.ingredients.map((ing) => ({ ...ing })),
      procedure: [...meal.procedure],
    };
    setDraft(newDraft);
    setBaseIngredients(meal.ingredients.map((ing) => ({ ...ing })));
    setBaseServes(meal.serves ?? 1);
    setViewServes(meal.serves ?? 1);
    setIsEditing(initialEditMode ?? false);
  }, [meal, initialEditMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) discardEdits();
        else onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, isEditing]);

  function discardEdits() {
    const reset = {
      ...meal,
      serves: meal.serves ?? 1,
      ingredients: meal.ingredients.map((ing) => ({ ...ing })),
      procedure: [...meal.procedure],
    };
    setDraft(reset);
    setBaseIngredients(meal.ingredients.map((ing) => ({ ...ing })));
    setBaseServes(meal.serves ?? 1);
    setViewServes(meal.serves ?? 1);
    setIsEditing(false);
  }

  function handleSave() {
    onSave(draft);
    // Update base so further serves changes scale from the saved state
    setBaseIngredients(draft.ingredients.map((ing) => ({ ...ing })));
    setBaseServes(draft.serves);
    setIsEditing(false);
  }

  function setField<K extends keyof Meal>(key: K, value: Meal[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setMacro(key: keyof Macros, value: string) {
    const num = parseInt(value, 10);
    setDraft((prev) => ({
      ...prev,
      macros: { ...prev.macros, [key]: isNaN(num) ? 0 : num },
    }));
  }

  function setIngredient(
    index: number,
    field: keyof Ingredient,
    value: string,
  ) {
    setDraft((prev) => {
      const copy = prev.ingredients.map((ing) => ({ ...ing }));
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, ingredients: copy };
    });
  }

  function addIngredient() {
    setDraft((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, emptyIngredient()],
    }));
  }

  function removeIngredient(index: number) {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  function setListItem(list: "procedure", index: number, value: string) {
    setDraft((prev) => {
      const copy = [...prev[list]];
      copy[index] = value;
      return { ...prev, [list]: copy };
    });
  }

  function addListItem(list: "procedure") {
    setDraft((prev) => ({ ...prev, [list]: [...prev[list], ""] }));
  }

  function removeListItem(list: "procedure", index: number) {
    setDraft((prev) => ({
      ...prev,
      [list]: prev[list].filter((_, i) => i !== index),
    }));
  }

  function setServes(value: string) {
    const n = parseInt(value, 10);
    const newServes = isNaN(n) || n < 1 ? 1 : n;
    const ratio = newServes / baseServes;
    setDraft((prev) => ({
      ...prev,
      serves: newServes,
      ingredients: baseIngredients.map((ing) => {
        const num = parseFloat(ing.amount);
        if (!isNaN(num)) {
          return {
            ...ing,
            amount: parseFloat((num * ratio).toFixed(2)).toString(),
          };
        }
        return ing;
      }),
    }));
  }

  // View-mode serving scaler — doesn't affect saved data
  const [viewServes, setViewServes] = useState<number>(meal.serves ?? 1);

  const display = isEditing ? draft : meal;

  const MACRO_DEFS = [
    { key: "calories" as const, icon: "🔥", label: T.calories, unit: "kcal" },
    { key: "protein" as const, icon: "💪", label: T.protein, unit: "g" },
    { key: "carbohydrates" as const, icon: "🌾", label: T.carbs, unit: "g" },
    { key: "fat" as const, icon: "🥑", label: T.fat, unit: "g" },
  ] as const;

  return (
    <div
      className="modal-overlay"
      onClick={isEditing ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label={display.name}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Action bar — always visible at top */}
        <div className="modal-actions">
          {isEditing ? (
            <button
              className="modal-close"
              onClick={discardEdits}
              aria-label="Zavřít"
            >
              ×
            </button>
          ) : (
            <>
              <button
                className="modal-btn modal-btn--edit"
                onClick={() => setIsEditing(true)}
                aria-label={T.editMeal}
              >
                {T.editMeal}
              </button>
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Zavřít"
              >
                ×
              </button>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="modal-card__body">
          {/* Header */}
          <div className="modal-header">
            {isEditing ? (
              <input
                className="modal-input modal-input--title"
                value={draft.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder={T.mealNamePlaceholder}
              />
            ) : (
              <h2 className="modal-title">{display.name}</h2>
            )}
          </div>

          {/* Macros */}
          <div className="modal-macros">
            {MACRO_DEFS.map(({ key, icon, label, unit }) => (
              <div key={key} className="macro-badge">
                <span className="macro-badge__icon">{icon}</span>
                {isEditing ? (
                  <input
                    className="macro-badge__input"
                    type="number"
                    min={0}
                    value={draft.macros[key]}
                    onChange={(e) => setMacro(key, e.target.value)}
                    aria-label={label}
                  />
                ) : (
                  <span className="macro-badge__value">
                    {display.macros[key]}
                    {unit !== "kcal" ? unit : ""}
                  </span>
                )}
                <span className="macro-badge__label">{label}</span>
              </div>
            ))}
          </div>

          {/* Serves — always visible, scales ingredients in view mode */}
          <div className="serves-row">
            <label className="modal-serves-label">{T.serves}</label>
            <button
              className="serves-row__step-btn"
              onClick={() => {
                if (isEditing) setServes(String(Math.max(1, draft.serves - 1)));
                else setViewServes((v) => Math.max(1, v - 1));
              }}
              aria-label="-1 porce"
            >
              −
            </button>
            <input
              className="modal-input serves-row__input"
              type="number"
              min={1}
              value={isEditing ? draft.serves : viewServes}
              onChange={(e) => {
                if (isEditing) setServes(e.target.value);
                else {
                  const n = parseInt(e.target.value, 10);
                  setViewServes(isNaN(n) || n < 1 ? 1 : n);
                }
              }}
            />
            <button
              className="serves-row__step-btn"
              onClick={() => {
                if (isEditing) setServes(String(draft.serves + 1));
                else setViewServes((v) => v + 1);
              }}
              aria-label="+1 porce"
            >
              +
            </button>
          </div>

          {/* Meal type badges — edit mode only */}
          {isEditing && (
            <div className="modal-section">
              <h3 className="modal-section__title">{T.mealTypeLabel}</h3>
              <div className="meal-type-badges">
                {MEAL_TYPE_DEFS.map(({ type, label, emoji }) => {
                  const active = (draft.mealTypes ?? []).includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`meal-type-badge${active ? " meal-type-badge--active" : ""}`}
                      onClick={() =>
                        setField(
                          "mealTypes",
                          active
                            ? (draft.mealTypes ?? []).filter((t) => t !== type)
                            : [...(draft.mealTypes ?? []), type],
                        )
                      }
                    >
                      {emoji} {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div className="modal-section">
            <h3 className="modal-section__title">{T.ingredients}</h3>
            {isEditing ? (
              <div className="modal-edit-list">
                {draft.ingredients.map((ing, i) => (
                  <div key={i} className="ingredient-row">
                    <input
                      className="modal-input ingredient-row__amount"
                      type="text"
                      inputMode="decimal"
                      value={ing.amount}
                      onChange={(e) =>
                        setIngredient(i, "amount", e.target.value)
                      }
                      placeholder={T.ingredientAmountPlaceholder}
                    />
                    <input
                      className="modal-input ingredient-row__unit"
                      type="text"
                      value={ing.unit}
                      onChange={(e) => setIngredient(i, "unit", e.target.value)}
                      placeholder={T.ingredientUnitPlaceholder}
                    />
                    <input
                      className="modal-input ingredient-row__name"
                      type="text"
                      value={ing.name}
                      onChange={(e) => setIngredient(i, "name", e.target.value)}
                      placeholder={T.ingredientNamePlaceholder(i)}
                    />
                    <button
                      className="modal-edit-list__remove"
                      onClick={() => removeIngredient(i)}
                      aria-label={T.removeIngredient}
                      title={T.removeIngredient}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="modal-add-btn" onClick={addIngredient}>
                  {T.addIngredient}
                </button>
              </div>
            ) : (
              <ul className="modal-ingredients">
                {display.ingredients.map((ing, i) => {
                  const baseServeCount = display.serves ?? 1;
                  const ratio = viewServes / baseServeCount;
                  let scaledAmount = ing.amount;
                  const num = parseFloat(ing.amount);
                  if (!isNaN(num)) {
                    scaledAmount = parseFloat(
                      (num * ratio).toFixed(2),
                    ).toString();
                  }
                  return (
                    <li key={i}>
                      {[scaledAmount, ing.unit, ing.name]
                        .filter(Boolean)
                        .join(" ")}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Procedure */}
          <div className="modal-section">
            <h3 className="modal-section__title">{T.procedure}</h3>
            {isEditing ? (
              <div className="modal-edit-list">
                {draft.procedure.map((step, i) => (
                  <div key={i} className="modal-edit-list__row">
                    <span className="modal-edit-list__step-num">{i + 1}.</span>
                    <textarea
                      className="modal-input modal-input--step"
                      value={step}
                      onChange={(e) =>
                        setListItem("procedure", i, e.target.value)
                      }
                      placeholder={T.stepPlaceholder(i)}
                      rows={2}
                    />
                    <button
                      className="modal-edit-list__remove"
                      onClick={() => removeListItem("procedure", i)}
                      aria-label={T.removeStep}
                      title={T.removeStep}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="modal-add-btn"
                  onClick={() => addListItem("procedure")}
                >
                  {T.addStep}
                </button>
              </div>
            ) : (
              <ol className="modal-procedure">
                {display.procedure.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Footer — sticky save/cancel in edit mode */}
        {isEditing && (
          <div className="modal-card__footer">
            <button className="modal-btn modal-btn--save" onClick={handleSave}>
              {T.save}
            </button>
            <button
              className="modal-btn modal-btn--cancel"
              onClick={discardEdits}
            >
              {T.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
