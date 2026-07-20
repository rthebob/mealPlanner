import { useState } from "react";
import type { Meal } from "../types";
import { T } from "../i18n";
import "./SlotPicker.css";

interface SlotPickerProps {
  slotLabel: string;
  library: Meal[];
  existingMeal: Meal | null;
  onClose: () => void;
  onSelect: (meal: Meal) => void;
  onEditExisting: () => void;
  onClear: () => void;
  onCreateNew: () => void;
}

export function SlotPicker({
  slotLabel,
  library,
  existingMeal,
  onClose,
  onSelect,
  onEditExisting,
  onClear,
  onCreateNew,
}: SlotPickerProps) {
  const [search, setSearch] = useState("");

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

        {/* Existing meal */}
        {existingMeal && (
          <div className="slot-picker__current">
            <div className="slot-picker__current-header">
              <span className="slot-picker__current-label">
                {T.currentMeal}
              </span>
            </div>
            <div className="slot-picker__current-meal">
              <div className="slot-picker__current-name">
                {existingMeal.name}
              </div>
              <div className="slot-picker__macros-row">
                <span>🔥 {existingMeal.macros.calories} kcal</span>
                <span>💪 {existingMeal.macros.protein}g</span>
                <span>🌾 {existingMeal.macros.carbohydrates}g</span>
                <span>🥑 {existingMeal.macros.fat}g</span>
              </div>
              <div className="slot-picker__current-actions">
                <button
                  className="modal-btn modal-btn--edit"
                  onClick={onEditExisting}
                >
                  {T.editMeal}
                </button>
                <button
                  className="modal-btn modal-btn--cancel"
                  onClick={onClear}
                >
                  {T.remove}
                </button>
              </div>
            </div>
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
                  onClick={() => onSelect(meal)}
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

        {/* Create from scratch */}
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
