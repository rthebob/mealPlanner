import { useState } from "react";
import type { Meal } from "../types";
import { T } from "../i18n";
import "./SlotPicker.css";

interface SlotPickerProps {
  slotLabel: string;
  library: Meal[];
  existingMeals: Meal[]; // all meals already in this slot
  onClose: () => void;
  onAdd: (meal: Meal) => void; // add a meal to the slot
  onEdit: (mealIndex: number) => void; // edit a specific meal
  onRemove: (mealIndex: number) => void; // remove a specific meal
  onCreateNew: () => void;
}

export function SlotPicker({
  slotLabel,
  library,
  existingMeals,
  onClose,
  onAdd,
  onEdit,
  onRemove,
  onCreateNew,
}: SlotPickerProps) {
  const [search, setSearch] = useState("");
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(
    null,
  );

  const filtered = library.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={slotLabel}
    >
      <div
        className="modal-card slot-picker-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-actions">
          <span className="slot-picker__slot-label">{slotLabel}</span>
          <button className="modal-close" onClick={onClose} aria-label="Zavřít">
            ×
          </button>
        </div>

        {/* Existing meals */}
        {existingMeals.length > 0 && (
          <div className="slot-picker__current">
            <span className="slot-picker__current-label">{T.currentMeal}</span>
            {existingMeals.map((meal, i) => (
              <div
                key={`${meal.id}-${i}`}
                className="slot-picker__current-meal"
              >
                <div className="slot-picker__current-meal-row">
                  <div className="slot-picker__current-meal-info">
                    <div className="slot-picker__current-name">{meal.name}</div>
                    <div className="slot-picker__macros-row">
                      <span>🔥 {meal.macros.calories} kcal</span>
                      <span>💪 {meal.macros.protein}g</span>
                      <span>🌾 {meal.macros.carbohydrates}g</span>
                      <span>🥑 {meal.macros.fat}g</span>
                    </div>
                  </div>
                  <div className="slot-picker__current-actions">
                    <button
                      className="modal-btn modal-btn--edit"
                      onClick={() => onEdit(i)}
                    >
                      {T.editMeal}
                    </button>
                    <button
                      className="modal-btn modal-btn--cancel"
                      onClick={() => setConfirmRemoveIndex(i)}
                    >
                      {T.remove}
                    </button>
                  </div>
                </div>
                {confirmRemoveIndex === i && (
                  <div className="slot-picker__confirm">
                    <span className="slot-picker__confirm-label">
                      {T.confirmRemove}
                    </span>
                    <div className="slot-picker__confirm-actions">
                      <button
                        className="modal-btn modal-btn--save library-item__confirm-yes"
                        onClick={() => {
                          setConfirmRemoveIndex(null);
                          onRemove(i);
                        }}
                      >
                        {T.confirmYes}
                      </button>
                      <button
                        className="modal-btn modal-btn--cancel"
                        onClick={() => setConfirmRemoveIndex(null)}
                      >
                        {T.confirmNo}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Library section */}
        <div className="slot-picker__section-title">{T.chooseFromLibrary}</div>
        <input
          className="modal-input slot-picker__search"
          type="search"
          placeholder={T.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {library.length === 0 ? (
          <p className="slot-picker__empty-hint">{T.noMealsInLibrary}</p>
        ) : filtered.length === 0 ? (
          <p className="slot-picker__empty-hint">{T.noMealsMatch}</p>
        ) : (
          <ul className="slot-picker__list">
            {filtered.map((meal) => (
              <li key={meal.id}>
                <button
                  className="slot-picker__list-item"
                  onClick={() => onAdd(meal)}
                >
                  <span className="slot-picker__list-name">{meal.name}</span>
                  <span className="slot-picker__list-macros">
                    🔥 {meal.macros.calories} kcal · 💪 {meal.macros.protein}g ·
                    🌾 {meal.macros.carbohydrates}g · 🥑 {meal.macros.fat}g
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="slot-picker__footer">
          <button
            className="modal-btn modal-btn--save slot-picker__create-btn"
            onClick={onCreateNew}
          >
            {T.createFromScratch}
          </button>
        </div>
      </div>
    </div>
  );
}
