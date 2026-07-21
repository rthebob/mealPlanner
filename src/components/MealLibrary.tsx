import { useRef, useState } from "react";
import type { Meal, Macros, Ingredient, MealType } from "../types";
import { T } from "../i18n";
import { MealModal } from "./MealModal";
import "./MealLibrary.css";

interface MealLibraryProps {
  library: Meal[];
  onClose: () => void;
  onChange: (library: Meal[]) => void;
  onAddToShoppingList: (meal: Meal) => void;
  onRemoveFromShoppingList: (mealId: string) => void;
  shoppingListIds: Set<string>;
}

function emptyMeal(): Meal {
  return {
    id: crypto.randomUUID(),
    name: "",
    serves: 1,
    ingredients: [],
    procedure: [],
    macros: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  };
}

function emptyIngredient(): Ingredient {
  return { name: "", amount: "", unit: "" };
}

const MEAL_TYPE_DEFS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: T.mealTypeBreakfast, emoji: '☀️' },
  { type: 'snack',     label: T.mealTypeSnack,     emoji: '🍎' },
  { type: 'lunch',     label: T.mealTypeLunch,     emoji: '🍝' },
  { type: 'dinner',    label: T.mealTypeDinner,    emoji: '🌝' },
];

interface MealFormProps {
  initial: Meal;
  onSave: (meal: Meal) => void;
  onCancel: () => void;
}

function MealForm({ initial, onSave, onCancel }: MealFormProps) {
  const [draft, setDraft] = useState<Meal>({
    ...initial,
    serves: initial.serves ?? 1,
    ingredients: initial.ingredients.map((ing) => ({ ...ing })),
    procedure: [...initial.procedure],
  });

  // Keep base ingredient amounts so we can scale from them, not compound
  const baseIngredientsRef = useRef(
    initial.ingredients.map((ing) => ({ ...ing })),
  );
  const baseServesRef = useRef(initial.serves ?? 1);

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
      // Re-snapshot base so serves scaling starts from the current amounts
      baseIngredientsRef.current = copy;
      baseServesRef.current = prev.serves;
      return { ...prev, ingredients: copy };
    });
  }

  function addIngredient() {
    setDraft((prev) => {
      const updated = [...prev.ingredients, emptyIngredient()];
      baseIngredientsRef.current = updated;
      baseServesRef.current = prev.serves;
      return { ...prev, ingredients: updated };
    });
  }

  function removeIngredient(index: number) {
    setDraft((prev) => {
      const updated = prev.ingredients.filter((_, i) => i !== index);
      baseIngredientsRef.current = updated;
      baseServesRef.current = prev.serves;
      return { ...prev, ingredients: updated };
    });
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
    const ratio = newServes / baseServesRef.current;
    const scaled = baseIngredientsRef.current.map((ing) => {
      const num = parseFloat(ing.amount);
      if (!isNaN(num)) {
        return {
          ...ing,
          amount: parseFloat((num * ratio).toFixed(2)).toString(),
        };
      }
      return ing;
    });
    setDraft((prev) => ({ ...prev, serves: newServes, ingredients: scaled }));
  }

  const MACRO_DEFS = [
    { key: "calories" as const, label: T.calories, unit: "kcal" },
    { key: "protein" as const, label: T.protein, unit: "g" },
    { key: "carbohydrates" as const, label: T.carbs, unit: "g" },
    { key: "fat" as const, label: T.fat, unit: "g" },
  ] as const;

  return (
    <>
      <div className="modal-card__body library-form">
        <input
          className="modal-input modal-input--title"
          value={draft.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder={T.mealNamePlaceholder}
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

        {/* Serves */}
        <div className="serves-row">
          <label className="library-form__macro-label">{T.serves}</label>
          <button
            className="serves-row__step-btn"
            onClick={() => setServes(String(Math.max(1, draft.serves - 1)))}
            aria-label="-1 porce"
          >
            &minus;
          </button>
          <input
            className="modal-input serves-row__input"
            type="number"
            min={1}
            value={draft.serves}
            onChange={(e) => setServes(e.target.value)}
          />
          <button
            className="serves-row__step-btn"
            onClick={() => setServes(String(draft.serves + 1))}
            aria-label="+1 porce"
          >
            +
          </button>
        </div>

        {/* Meal type badges */}
        <div className="library-form__section-title">{T.mealTypeLabel}</div>
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

        <div className="library-form__section-title">{T.ingredients}</div>
        <div className="modal-edit-list">
          {draft.ingredients.map((ing, i) => (
            <div key={i} className="ingredient-row">
              <input
                className="modal-input ingredient-row__amount"
                type="text"
                inputMode="decimal"
                value={ing.amount}
                onChange={(e) => setIngredient(i, "amount", e.target.value)}
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
              >
                ×
              </button>
            </div>
          ))}
          <button className="modal-add-btn" onClick={addIngredient}>
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
      </div>

      <div className="modal-card__footer">
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
    </>
  );
}

export function MealLibrary({
  library,
  onClose,
  onChange,
  onAddToShoppingList,
  onRemoveFromShoppingList,
  shoppingListIds,
}: MealLibraryProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favourites" | MealType>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewingMeal, setViewingMeal] = useState<{
    meal: Meal;
    editMode: boolean;
  } | null>(null);

  function handleAdd(meal: Meal) {
    onChange([...library, meal]);
    setShowNewForm(false);
  }

  function handleDelete(id: string) {
    onChange(library.filter((m) => m.id !== id));
    setViewingMeal((prev) => (prev?.meal.id === id ? null : prev));
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
          !showNewForm && (
            <>
              <div className="library-filter-row">
                <input
                  className="modal-input library-search"
                  type="search"
                  placeholder={T.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="modal-input library-filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  aria-label={T.filterLabel}
                >
                  <option value="all">{T.filterAll}</option>
                  <option value="favourites">{T.filterFavourites}</option>
                  {MEAL_TYPE_DEFS.map(({ type, label, emoji }) => (
                    <option key={type} value={type}>
                      {emoji} {label}
                    </option>
                  ))}
                </select>
              </div>
              {library.filter(
                (m) =>
                  m.name.toLowerCase().includes(search.toLowerCase()) &&
                  (filter === "all" ||
                    (filter === "favourites"
                      ? m.favourite
                      : (m.mealTypes ?? []).includes(filter as MealType))),
              ).length === 0 ? (
                <p className="library-empty">{T.noMealsMatch}</p>
              ) : (
                <ul className="library-list">
                  {library
                    .filter(
                      (m) =>
                        m.name.toLowerCase().includes(search.toLowerCase()) &&
                        (filter === "all" ||
                          (filter === "favourites"
                            ? m.favourite
                            : (m.mealTypes ?? []).includes(
                                filter as MealType,
                              ))),
                    )
                    .map((meal) => (
                      <li key={meal.id} className="library-item">
                        <div className="library-item__row">
                          {/* Row 1: star + name */}
                          <div className="library-item__header">
                            <button
                              className={`library-item__fav${meal.favourite ? " library-item__fav--active" : ""}`}
                              onClick={() =>
                                onChange(
                                  library.map((m) =>
                                    m.id === meal.id
                                      ? { ...m, favourite: !m.favourite }
                                      : m,
                                  ),
                                )
                              }
                              aria-label={
                                meal.favourite ? T.unfavourite : T.favourite
                              }
                              title={
                                meal.favourite ? T.unfavourite : T.favourite
                              }
                            >
                              {meal.favourite ? "★" : "☆"}
                            </button>
                            <div
                              className="library-item__name library-item__name--clickable"
                              onClick={() =>
                                setViewingMeal({ meal, editMode: false })
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                setViewingMeal({ meal, editMode: false })
                              }
                            >
                              {meal.name}
                            </div>
                          </div>

                          {/* Row 2: type badges + macros */}
                          <div
                            className="library-item__meta"
                            onClick={() =>
                              setViewingMeal({ meal, editMode: false })
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {(meal.mealTypes ?? []).length > 0 && (
                              <div className="library-item__type-badges">
                                {(meal.mealTypes ?? []).map((type) => {
                                  const def = MEAL_TYPE_DEFS.find(
                                    (d) => d.type === type,
                                  );
                                  return def ? (
                                    <span
                                      key={type}
                                      className="library-item__type-badge"
                                    >
                                      {def.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                            <div className="library-item__macros">
                              🔥 {meal.macros.calories} kcal · 💪{" "}
                              {meal.macros.protein}g · 🌾{" "}
                              {meal.macros.carbohydrates}g · 🥑{" "}
                              {meal.macros.fat}g
                            </div>
                          </div>

                          {/* Row 3: action buttons */}
                          <div className="library-item__actions">
                            <button
                              className={`modal-btn modal-btn--edit${shoppingListIds.has(meal.id) ? " library-item__basket--added" : ""}`}
                              onClick={() =>
                                shoppingListIds.has(meal.id)
                                  ? onRemoveFromShoppingList(meal.id)
                                  : onAddToShoppingList(meal)
                              }
                              aria-label={T.addToShoppingList}
                              title={T.addToShoppingList}
                            >
                              🛒
                            </button>
                            <button
                              className="modal-btn modal-btn--edit"
                              onClick={() =>
                                setViewingMeal({ meal, editMode: true })
                              }
                              aria-label={T.editMeal}
                            >
                              {T.editMealBtn}
                            </button>
                            <button
                              className="modal-btn modal-btn--cancel"
                              onClick={() => setConfirmDeleteId(meal.id)}
                              aria-label="Smazat"
                            >
                              {T.deleteMealBtn}
                            </button>
                          </div>
                        </div>
                        {confirmDeleteId === meal.id && (
                          <div className="library-item__confirm">
                            <span className="library-item__confirm-label">
                              {T.confirmDelete}
                            </span>
                            <div className="library-item__confirm-actions">
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
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </>
          )
        )}
      </div>

      {viewingMeal && (
        <MealModal
          meal={viewingMeal.meal}
          initialEditMode={viewingMeal.editMode}
          onClose={() => setViewingMeal(null)}
          onSave={(updated) => {
            onChange(library.map((m) => (m.id === updated.id ? updated : m)));
            setViewingMeal((prev) =>
              prev ? { ...prev, meal: updated, editMode: false } : null,
            );
          }}
        />
      )}
    </div>
  );
}
