import { useEffect, useState } from "react";
import type { Meal, Macros } from "../types";
import { T } from "../i18n";
import "./MealModal.css";

interface MealModalProps {
  meal: Meal;
  onClose: () => void;
  onSave: (updated: Meal) => void;
  initialEditMode?: boolean;
}

export function MealModal({
  meal,
  onClose,
  onSave,
  initialEditMode,
}: MealModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode ?? false);
  const [draft, setDraft] = useState<Meal>({
    ...meal,
    ingredients: [...meal.ingredients],
    procedure: [...meal.procedure],
  });

  useEffect(() => {
    setDraft({
      ...meal,
      ingredients: [...meal.ingredients],
      procedure: [...meal.procedure],
    });
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
    setDraft({
      ...meal,
      ingredients: [...meal.ingredients],
      procedure: [...meal.procedure],
    });
    setIsEditing(false);
  }

  function handleSave() {
    onSave(draft);
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

  function setListItem(
    list: "ingredients" | "procedure",
    index: number,
    value: string,
  ) {
    setDraft((prev) => {
      const copy = [...prev[list]];
      copy[index] = value;
      return { ...prev, [list]: copy };
    });
  }

  function addListItem(list: "ingredients" | "procedure") {
    setDraft((prev) => ({ ...prev, [list]: [...prev[list], ""] }));
  }

  function removeListItem(list: "ingredients" | "procedure", index: number) {
    setDraft((prev) => ({
      ...prev,
      [list]: prev[list].filter((_, i) => i !== index),
    }));
  }

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
        {/* Action bar */}
        <div className="modal-actions">
          {isEditing ? (
            <>
              <button
                className="modal-btn modal-btn--save"
                onClick={handleSave}
              >
                {T.save}
              </button>
              <button
                className="modal-btn modal-btn--cancel"
                onClick={discardEdits}
              >
                {T.cancel}
              </button>
            </>
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

        {/* Header */}
        <div className="modal-header">
          {isEditing ? (
            <>
              <input
                className="modal-input modal-input--title"
                value={draft.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder={T.mealNamePlaceholder}
              />
              <textarea
                className="modal-input modal-input--description"
                value={draft.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={T.descriptionPlaceholder}
                rows={2}
              />
            </>
          ) : (
            <>
              <h2 className="modal-title">{display.name}</h2>
              <p className="modal-description">{display.description}</p>
            </>
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

        {/* Ingredients */}
        <div className="modal-section">
          <h3 className="modal-section__title">{T.ingredients}</h3>
          {isEditing ? (
            <div className="modal-edit-list">
              {draft.ingredients.map((item, i) => (
                <div key={i} className="modal-edit-list__row">
                  <input
                    className="modal-input"
                    value={item}
                    onChange={(e) =>
                      setListItem("ingredients", i, e.target.value)
                    }
                    placeholder={T.ingredientPlaceholder(i)}
                  />
                  <button
                    className="modal-edit-list__remove"
                    onClick={() => removeListItem("ingredients", i)}
                    aria-label={T.removeIngredient}
                    title={T.removeIngredient}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="modal-add-btn"
                onClick={() => addListItem("ingredients")}
              >
                {T.addIngredient}
              </button>
            </div>
          ) : (
            <ul className="modal-ingredients">
              {display.ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
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
    </div>
  );
}
