import { useRef, useState } from "react";
import { T } from "../i18n";
import type { Meal } from "../types";
import "./ShoppingList.css";

export interface ShoppingListEntry {
  meal: Meal;
  serves: number;
}

export interface AdHocItem {
  id: string;
  text: string;
}

interface ShoppingListProps {
  onShare: () => void;
  entries: ShoppingListEntry[];
  adHocItems: AdHocItem[];
  checkedKeys: Set<string>;
  expandedIds: Set<string>;
  onToggleChecked: (key: string) => void;
  onToggleExpanded: (mealId: string) => void;
  onClose: () => void;
  onRemoveMeal: (mealId: string) => void;
  onClear: () => void;
  onUpdateServes: (mealId: string, serves: number) => void;
  onAddAdHoc: (item: AdHocItem) => void;
  onRemoveAdHoc: (id: string) => void;
}

export default function ShoppingList({
  entries,
  adHocItems,
  checkedKeys,
  expandedIds,
  onToggleChecked,
  onToggleExpanded,
  onClose,
  onRemoveMeal,
  onClear,
  onUpdateServes,
  onAddAdHoc,
  onRemoveAdHoc,
  onShare,
}: ShoppingListProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [adHocInput, setAdHocInput] = useState("");
  const adHocRef = useRef<HTMLInputElement>(null);

  function scaleAmount(
    amount: string,
    serves: number,
    mealServes: number,
  ): string {
    const base = parseFloat(amount);
    if (isNaN(base)) return amount;
    return String(parseFloat((base * (serves / mealServes)).toFixed(2)));
  }

  function isMealDone(meal: Meal): boolean {
    if (meal.ingredients.length === 0) return false;
    return meal.ingredients.every((_, idx) =>
      checkedKeys.has(`${meal.id}::${idx}`),
    );
  }

  function submitAdHoc() {
    const text = adHocInput.trim();
    if (!text) return;
    onAddAdHoc({ id: crypto.randomUUID(), text });
    setAdHocInput("");
    adHocRef.current?.focus();
  }

  const hasContent = entries.length > 0 || adHocItems.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card shopping-list-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-actions">
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {T.shoppingList}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-card__body">
          {!hasContent ? (
            <p className="shopping-empty">{T.shoppingListEmpty}</p>
          ) : (
            <ul
              className="shopping-list__meals"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {entries.map(({ meal, serves }) => {
                const done = isMealDone(meal);
                const expanded = expandedIds.has(meal.id);

                if (done && !expanded) {
                  return (
                    <li
                      key={meal.id}
                      className="shopping-meal shopping-meal--done"
                    >
                      <div className="shopping-meal__header">
                        <span className="shopping-meal__name shopping-meal__name--done">
                          ✓ {meal.name}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="modal-btn modal-btn--edit shopping-meal__expand-btn"
                            onClick={() => onToggleExpanded(meal.id)}
                          >
                            {T.expandMeal}
                          </button>
                          <button
                            className="shopping-meal__remove"
                            onClick={() => onRemoveMeal(meal.id)}
                            aria-label={T.removeFromList}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li
                    key={meal.id}
                    className={`shopping-meal${done ? " shopping-meal--done" : ""}`}
                  >
                    <div className="shopping-meal__header">
                      <span
                        className={`shopping-meal__name${done ? " shopping-meal__name--done" : ""}`}
                      >
                        {done && "✓ "}
                        {meal.name}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {done && (
                          <button
                            className="modal-btn modal-btn--edit shopping-meal__expand-btn"
                            onClick={() => onToggleExpanded(meal.id)}
                          >
                            {T.collapseMeal}
                          </button>
                        )}
                        <button
                          className="shopping-meal__remove"
                          onClick={() => onRemoveMeal(meal.id)}
                          aria-label={T.removeFromList}
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    <div className="serves-row">
                      <label className="modal-serves-label">{T.serves}</label>
                      <button
                        className="serves-row__step-btn"
                        onClick={() =>
                          onUpdateServes(meal.id, Math.max(1, serves - 1))
                        }
                        aria-label="Decrease serves"
                      >
                        −
                      </button>
                      <input
                        className="modal-input serves-row__input"
                        type="number"
                        min={1}
                        value={serves}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0)
                            onUpdateServes(meal.id, val);
                        }}
                      />
                      <button
                        className="serves-row__step-btn"
                        onClick={() => onUpdateServes(meal.id, serves + 1)}
                        aria-label="Increase serves"
                      >
                        +
                      </button>
                    </div>

                    <ul className="shopping-ingredients">
                      {meal.ingredients.map((ingredient, idx) => {
                        const key = `${meal.id}::${idx}`;
                        const isBought = checkedKeys.has(key);
                        const scaled = scaleAmount(
                          ingredient.amount,
                          serves,
                          meal.serves,
                        );
                        const label = [scaled, ingredient.unit, ingredient.name]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <li
                            key={key}
                            className={`shopping-ingredient${isBought ? " shopping-ingredient--bought" : ""}`}
                          >
                            <input
                              type="checkbox"
                              className="shopping-ingredient__check"
                              checked={isBought}
                              onChange={() => onToggleChecked(key)}
                              id={key}
                            />
                            <label
                              className="shopping-ingredient__text"
                              htmlFor={key}
                            >
                              {label}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Ad-hoc items */}
          {adHocItems.length > 0 && (
            <ul className="shopping-ingredients shopping-adhoc-list">
              {adHocItems.map((item) => {
                const key = `adhoc::${item.id}`;
                const isBought = checkedKeys.has(key);
                return (
                  <li
                    key={item.id}
                    className={`shopping-ingredient${isBought ? " shopping-ingredient--bought" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="shopping-ingredient__check"
                      checked={isBought}
                      onChange={() => onToggleChecked(key)}
                      id={key}
                    />
                    <label className="shopping-ingredient__text" htmlFor={key}>
                      {item.text}
                    </label>
                    <button
                      className="shopping-adhoc-remove"
                      onClick={() => onRemoveAdHoc(item.id)}
                      aria-label={T.removeIngredient}
                    >
                      🗑
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Add ad-hoc item */}
          <div className="shopping-adhoc-form">
            <input
              ref={adHocRef}
              className="modal-input shopping-adhoc-input"
              type="text"
              placeholder={T.adHocPlaceholder}
              value={adHocInput}
              onChange={(e) => setAdHocInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdHoc()}
            />
            <button
              className="modal-btn modal-btn--save shopping-adhoc-btn"
              onClick={submitAdHoc}
              disabled={!adHocInput.trim()}
            >
              {T.adHocAdd}
            </button>
          </div>
        </div>

        {hasContent && (
          <div className="modal-card__footer">
            {confirmClear ? (
              <>
                <span className="shopping-clear-confirm__label">
                  {T.confirmDelete}
                </span>
                <button
                  className="modal-btn shopping-clear-btn"
                  onClick={() => {
                    onClear();
                    setConfirmClear(false);
                  }}
                >
                  {T.confirmYes}
                </button>
                <button
                  className="modal-btn modal-btn--cancel"
                  onClick={() => setConfirmClear(false)}
                >
                  {T.confirmNo}
                </button>
              </>
            ) : (
              <>
                <button
                  className="modal-btn shopping-clear-btn"
                  onClick={() => setConfirmClear(true)}
                >
                  {T.clearList}
                </button>
                <button className="modal-btn modal-btn--edit" onClick={onShare}>
                  {T.shareBasket}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
