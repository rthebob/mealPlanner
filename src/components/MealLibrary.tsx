import { useState } from "react";
import type { Meal, Macros } from "../types";
import { T } from "../i18n";
import "./MealLibrary.css";

interface MealLibraryProps {
  library: Meal[];
  onClose: () => void;
  onChange: (library: Meal[]) => void;
}

function emptyMeal(): Meal {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    ingredients: [],
    procedure: [],
    macros: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  };
}

interface MealFormProps {
  initial: Meal;
  onSave: (meal: Meal) => void;
  onCancel: () => void;
}

function MealForm({ initial, onSave, onCancel }: MealFormProps) {
  const [draft, setDraft] = useState<Meal>({
    ...initial,
    ingredients: [...initial.ingredients],
    procedure: [...initial.procedure],
  });

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

  const MACRO_DEFS = [
    { key: "calories" as const, label: T.calories, unit: "kcal" },
    { key: "protein" as const, label: T.protein, unit: "g" },
    { key: "carbohydrates" as const, label: T.carbs, unit: "g" },
    { key: "fat" as const, label: T.fat, unit: "g" },
  ] as const;

  return (
    <div className="library-form">
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

      <div className="library-form__macros">
        {MACRO_DEFS.map(({ key, label, unit }) => (
          <div key={key} className="library-form__macro-field">
            <label className="library-form__macro-label">
              {label} ({unit})
            </label>
            <input
              className="modal-input"
              type="number"
              min={0}
              value={draft.macros[key]}
              onChange={(e) => setMacro(key, e.target.value)}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <div className="library-form__section-title">{T.ingredients}</div>
      <div className="modal-edit-list">
        {draft.ingredients.map((item, i) => (
          <div key={i} className="modal-edit-list__row">
            <input
              className="modal-input"
              value={item}
              onChange={(e) => setListItem("ingredients", i, e.target.value)}
              placeholder={T.ingredientPlaceholder(i)}
            />
            <button
              className="modal-edit-list__remove"
              onClick={() => removeListItem("ingredients", i)}
              aria-label={T.removeIngredient}
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

      <div className="library-form__section-title" style={{ marginTop: 16 }}>
        {T.procedure}
      </div>
      <div className="modal-edit-list">
        {draft.procedure.map((step, i) => (
          <div key={i} className="modal-edit-list__row">
            <span className="modal-edit-list__step-num">{i + 1}.</span>
            <textarea
              className="modal-input modal-input--step"
              value={step}
              onChange={(e) => setListItem("procedure", i, e.target.value)}
              placeholder={T.stepPlaceholder(i)}
              rows={2}
            />
            <button
              className="modal-edit-list__remove"
              onClick={() => removeListItem("procedure", i)}
              aria-label={T.removeStep}
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

      <div className="library-form__actions">
        <button
          className="modal-btn modal-btn--save"
          onClick={() => onSave(draft)}
        >
          {T.save}
        </button>
        <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
          {T.cancel}
        </button>
      </div>
    </div>
  );
}

export function MealLibrary({ library, onClose, onChange }: MealLibraryProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd(meal: Meal) {
    onChange([...library, meal]);
    setShowNewForm(false);
  }

  function handleUpdate(updated: Meal) {
    onChange(library.map((m) => (m.id === updated.id ? updated : m)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    onChange(library.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={T.mealLibrary}
    >
      <div
        className="modal-card library-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-actions">
          <h2 className="library-title">{T.mealLibrary}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Zavřít">
            ×
          </button>
        </div>

        {showNewForm ? (
          <MealForm
            initial={emptyMeal()}
            onSave={handleAdd}
            onCancel={() => setShowNewForm(false)}
          />
        ) : (
          <button
            className="modal-btn modal-btn--save library-new-btn"
            onClick={() => setShowNewForm(true)}
          >
            {T.newMeal}
          </button>
        )}

        {library.length === 0 && !showNewForm ? (
          <p className="library-empty">{T.noMealsYet}</p>
        ) : (
          <ul className="library-list">
            {library.map((meal) => (
              <li key={meal.id} className="library-item">
                {editingId === meal.id ? (
                  <MealForm
                    initial={meal}
                    onSave={handleUpdate}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="library-item__info">
                      <div className="library-item__name">{meal.name}</div>
                      <div className="library-item__macros">
                        🔥 {meal.macros.calories} kcal · 💪{" "}
                        {meal.macros.protein}g · 🌾 {meal.macros.carbohydrates}g
                        · 🥑 {meal.macros.fat}g
                      </div>
                    </div>
                    <div className="library-item__actions">
                      <button
                        className="modal-btn modal-btn--edit"
                        onClick={() => {
                          setEditingId(meal.id);
                          setConfirmDeleteId(null);
                        }}
                        aria-label={T.editMeal}
                      >
                        {T.editMealBtn}
                      </button>
                      {confirmDeleteId === meal.id ? (
                        <span className="library-item__confirm">
                          <span className="library-item__confirm-label">
                            {T.confirmDelete}
                          </span>
                          <button
                            className="modal-btn modal-btn--save library-item__confirm-yes"
                            onClick={() => {
                              handleDelete(meal.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            {T.confirmYes}
                          </button>
                          <button
                            className="modal-btn modal-btn--cancel"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            {T.confirmNo}
                          </button>
                        </span>
                      ) : (
                        <button
                          className="modal-btn modal-btn--cancel"
                          onClick={() => setConfirmDeleteId(meal.id)}
                          aria-label="Smazat"
                        >
                          {T.deleteMealBtn}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
