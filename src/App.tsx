import { useState, useRef, useEffect } from "react";
import type { Meal, DayPlan, MacroGoals, WeekHistory } from "./types";
import { WEEK_PLAN, DEFAULT_MEAL_LIBRARY } from "./data";
import { DaySelector } from "./components/DaySelector";
import { MealTable } from "./components/MealTable";
import { MealModal } from "./components/MealModal";
import { SlotPicker } from "./components/SlotPicker";
import { DayPicker } from "./components/DayPicker";
import ShoppingList, {
  type ShoppingListEntry,
  type AdHocItem,
} from "./components/ShoppingList";
import {
  HistoryPicker,
  currentWeekKey,
  offsetWeekKey,
  weekLabel,
  isoWeekToDate,
} from "./components/HistoryPicker";
import { MealLibrary } from "./components/MealLibrary";
import BasketQRModal from "./components/BasketQRModal";
import { T } from "./i18n";
import "./App.css";

type MealKey = keyof Omit<DayPlan, "day">;

const SLOT_KEYS: MealKey[] = [
  "breakfast",
  "morningSnack",
  "lunch",
  "afternoonSnack",
  "dinner",
];

// Migrate old format (null or single Meal object) → Meal[]
function migrateSlot(value: unknown): Meal[] {
  if (!value) return [];
  const arr: unknown[] = Array.isArray(value) ? value : [value];
  return arr.map(migrateMeal);
}

function migratePlan(plan: DayPlan[]): DayPlan[] {
  return plan.map((day) => {
    const migrated = { ...day };
    for (const key of SLOT_KEYS) {
      (migrated as unknown as Record<string, unknown>)[key] = migrateSlot(
        (day as unknown as Record<string, unknown>)[key],
      );
    }
    return migrated;
  });
}

// Migrate meal from old format (string[] ingredients) to Ingredient[]
function migrateMeal(raw: unknown): Meal {
  const m = raw as Record<string, unknown>;
  const rawIngredients = m.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients.map((ing: unknown) => {
        if (typeof ing === "string") {
          return { name: ing, amount: "", unit: "" };
        }
        return ing as import("./types").Ingredient;
      })
    : [];
  const rawMealTypes = Array.isArray(m.mealTypes)
    ? (m.mealTypes as string[])
    : [];
  const mealTypes = [
    ...new Set(
      rawMealTypes.map((t) =>
        t === "morningSnack" || t === "afternoonSnack" ? "snack" : t,
      ),
    ),
  ] as import("./types").MealType[];
  return {
    ...(m as unknown as Meal),
    serves: typeof m.serves === "number" ? m.serves : 1,
    ingredients,
    mealTypes: mealTypes.length > 0 ? mealTypes : undefined,
  };
}

const MEAL_KEY_LABELS: Record<MealKey, string> = {
  breakfast: T.breakfast,
  morningSnack: T.morningSnack,
  lunch: T.lunch,
  afternoonSnack: T.afternoonSnack,
  dinner: T.dinner,
};

const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbohydrates: 250,
  fat: 65,
};
const THIS_WEEK = currentWeekKey();

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return (
        (localStorage.getItem("mealplanner-theme") as "dark" | "light") ??
        "dark"
      );
    } catch {
      return "dark";
    }
  });
  const [numDays, setNumDays] = useState(() => {
    try {
      const v = localStorage.getItem("mealplanner-numdays");
      return v ? Number(v) : 3;
    } catch {
      return 3;
    }
  });
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(() => {
    try {
      const v = localStorage.getItem("mealplanner-weekplan");
      return v ? migratePlan(JSON.parse(v)) : WEEK_PLAN;
    } catch {
      return WEEK_PLAN;
    }
  });
  const [library, setLibrary] = useState<Meal[]>(() => {
    try {
      const v = localStorage.getItem("mealplanner-library");
      const raw: unknown[] = v ? JSON.parse(v) : DEFAULT_MEAL_LIBRARY;
      // Deduplicate by id and migrate legacy format
      const seen = new Set<string>();
      return raw.map(migrateMeal).filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    } catch {
      return DEFAULT_MEAL_LIBRARY;
    }
  });
  const [goals, setGoals] = useState<MacroGoals>(() => {
    try {
      const v = localStorage.getItem("mealplanner-goals");
      return v ? JSON.parse(v) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });
  const [history, setHistory] = useState<WeekHistory>(() => {
    try {
      const v = localStorage.getItem("mealplanner-history");
      if (!v) return {};
      const raw = JSON.parse(v) as Record<string, DayPlan[]>;
      return Object.fromEntries(
        Object.entries(raw).map(([k, plan]) => [k, migratePlan(plan)]),
      );
    } catch {
      return {};
    }
  });

  const [draftGoals, setDraftGoals] = useState<MacroGoals>(goals);

  // null = current week, string key = viewing a (possibly past) historical week
  const [viewingWeekKey, setViewingWeekKey] = useState<string | null>(null);

  const isCurrentWeek = viewingWeekKey === null;

  // Auto-save current weekPlan to history under this week's key on every change
  useEffect(() => {
    const next = { ...history, [THIS_WEEK]: weekPlan };
    try {
      localStorage.setItem("mealplanner-history", JSON.stringify(next));
    } catch {}
    // Update in-memory history without triggering further effects
    setHistory(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekPlan]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("mealplanner-theme", next);
    } catch {}
  }

  function saveGoals() {
    setGoals(draftGoals);
    try {
      localStorage.setItem("mealplanner-goals", JSON.stringify(draftGoals));
    } catch {}
  }

  function setDraftGoal(key: keyof MacroGoals, value: string) {
    const num = parseInt(value, 10);
    setDraftGoals((prev) => ({
      ...prev,
      [key]: isNaN(num) || num < 0 ? 0 : num,
    }));
  }

  function updateHistory(next: WeekHistory) {
    setHistory(next);
    try {
      localStorage.setItem("mealplanner-history", JSON.stringify(next));
    } catch {}
  }

  const [showSettings, setShowSettings] = useState(false);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      )
        setShowSettings(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  const [activeSlot, setActiveSlot] = useState<{
    dayIndex: number;
    mealKey: MealKey;
    mealIndex: number | null; // null = adding new, number = editing existing
  } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListEntry[]>(() => {
    try {
      const v = localStorage.getItem("mealplanner-shopping");
      return v
        ? (JSON.parse(v) as ShoppingListEntry[]).map((e) => ({
            ...e,
            meal: migrateMeal(e.meal),
          }))
        : [];
    } catch {
      return [];
    }
  });
  const [shoppingChecked, setShoppingChecked] = useState<Set<string>>(() => {
    try {
      const v = localStorage.getItem("mealplanner-shopping-checked");
      return v ? new Set(JSON.parse(v) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [shoppingExpanded, setShoppingExpanded] = useState<Set<string>>(() => {
    try {
      const v = localStorage.getItem("mealplanner-shopping-expanded");
      return v ? new Set(JSON.parse(v) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [shoppingAdHoc, setShoppingAdHoc] = useState<AdHocItem[]>(() => {
    try {
      const v = localStorage.getItem("mealplanner-shopping-adhoc");
      return v ? (JSON.parse(v) as AdHocItem[]) : [];
    } catch {
      return [];
    }
  });
  const [showBasketQR, setShowBasketQR] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "day">(() => {
    try {
      return (
        (localStorage.getItem("mealplanner-viewmode") as "week" | "day") ??
        "week"
      );
    } catch {
      return "week";
    }
  });
  const [focusedDayIndex, setFocusedDayIndex] = useState(() => {
    try {
      const vm = localStorage.getItem("mealplanner-viewmode");
      if (vm === "day") {
        const nd = Number(localStorage.getItem("mealplanner-numdays") ?? 3);
        const jsDow = new Date().getDay();
        const todayDow = jsDow === 0 ? 6 : jsDow - 1;
        return todayDow < nd ? todayDow : 0;
      }
    } catch {}
    return 0;
  });

  function updateNumDays(n: number) {
    setNumDays(n);
    try {
      localStorage.setItem("mealplanner-numdays", String(n));
    } catch {}
  }

  function updateWeekPlan(fn: (prev: DayPlan[]) => DayPlan[]) {
    setWeekPlan((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem("mealplanner-weekplan", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function updateLibrary(next: Meal[]) {
    // Deduplicate by id to prevent key collisions
    const seen = new Set<string>();
    const deduped = next.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    setLibrary(deduped);
    try {
      localStorage.setItem("mealplanner-library", JSON.stringify(next));
    } catch {}
  }

  // Navigate weeks — negative delta = past, positive = future (capped at current)
  function navigateWeek(delta: number) {
    const base = viewingWeekKey ?? THIS_WEEK;
    const target = offsetWeekKey(base, delta);
    if (target >= THIS_WEEK) {
      setViewingWeekKey(null); // back to live current week
    } else {
      setViewingWeekKey(target);
    }
    setFocusedDayIndex(delta < 0 ? 6 : 0); // go to last day when going back, first when going forward
  }

  const importRef = useRef<HTMLInputElement>(null);

  // Which plan to display
  const displayPlan: DayPlan[] = isCurrentWeek
    ? weekPlan
    : (history[viewingWeekKey!] ?? WEEK_PLAN);

  const allVisibleDays = displayPlan.slice(0, isCurrentWeek ? numDays : 7);
  const clampedFocused = Math.min(focusedDayIndex, allVisibleDays.length - 1);
  const visibleDays =
    viewMode === "day" ? [allVisibleDays[clampedFocused]] : allVisibleDays;

  const jsDow = new Date().getDay();
  const todayDowIndex = jsDow === 0 ? 6 : jsDow - 1;
  const todayIndex =
    isCurrentWeek && todayDowIndex < allVisibleDays.length ? todayDowIndex : -1;

  // Can we go forward? Only if we're not already at the current week
  const canGoForward = !isCurrentWeek;
  // Can we go back? Always (even if there's no saved data, the UI just shows an empty week)
  const canGoBack = true;

  function handleExport() {
    const data = JSON.stringify({ weekPlan, library, goals, history }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meal-planner.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportLibrary() {
    const data = JSON.stringify({ library }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meal-library.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.weekPlan) updateWeekPlan(() => parsed.weekPlan);
        if (parsed.library) updateLibrary(parsed.library);
        if (parsed.goals) {
          setGoals(parsed.goals);
          setDraftGoals(parsed.goals);
          try {
            localStorage.setItem(
              "mealplanner-goals",
              JSON.stringify(parsed.goals),
            );
          } catch {}
        }
        if (parsed.history) updateHistory(parsed.history);
      } catch {
        alert(T.invalidFile);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleCellClick(
    dayIndex: number,
    mealKey: MealKey,
    mealIndex: number | null,
  ) {
    if (!isCurrentWeek) return;
    const realIndex = viewMode === "day" ? clampedFocused : dayIndex;
    setActiveSlot({ dayIndex: realIndex, mealKey, mealIndex });
    if (mealIndex === null) {
      setShowSlotPicker(true);
    } else {
      // Clicking an existing meal opens the slot picker with that meal pre-focused
      setShowSlotPicker(true);
    }
  }

  function addMealToSlot(meal: Meal) {
    if (!activeSlot) return;
    updateWeekPlan((prev) => {
      const copy = prev.map((d) => ({ ...d }));
      copy[activeSlot.dayIndex] = {
        ...copy[activeSlot.dayIndex],
        [activeSlot.mealKey]: [
          ...copy[activeSlot.dayIndex][activeSlot.mealKey],
          meal,
        ],
      };
      return copy;
    });
  }

  function updateMealInSlot(meal: Meal) {
    if (!activeSlot || activeSlot.mealIndex === null) return;
    updateWeekPlan((prev) => {
      const copy = prev.map((d) => ({ ...d }));
      const meals = [...copy[activeSlot.dayIndex][activeSlot.mealKey]];
      meals[activeSlot.mealIndex!] = meal;
      copy[activeSlot.dayIndex] = {
        ...copy[activeSlot.dayIndex],
        [activeSlot.mealKey]: meals,
      };
      return copy;
    });
  }

  function removeMealFromSlot(mealIndex: number) {
    if (!activeSlot) return;
    updateWeekPlan((prev) => {
      const copy = prev.map((d) => ({ ...d }));
      const meals = copy[activeSlot.dayIndex][activeSlot.mealKey].filter(
        (_, i) => i !== mealIndex,
      );
      copy[activeSlot.dayIndex] = {
        ...copy[activeSlot.dayIndex],
        [activeSlot.mealKey]: meals,
      };
      return copy;
    });
  }

  function handleSlotAdd(meal: Meal) {
    addMealToSlot(meal);
    setShowSlotPicker(false);
    setActiveSlot(null);
  }

  function handleSlotEdit(mealIndex: number) {
    if (!activeSlot) return;
    const meal = weekPlan[activeSlot.dayIndex][activeSlot.mealKey][mealIndex];
    setActiveSlot({ ...activeSlot, mealIndex });
    setShowSlotPicker(false);
    setEditingMeal(meal);
    setCreatingNew(false);
  }

  function handleSlotRemove(mealIndex: number) {
    removeMealFromSlot(mealIndex);
    // Close picker if no meals remain after removal
    const remaining =
      weekPlan[activeSlot!.dayIndex][activeSlot!.mealKey].length - 1;
    if (remaining === 0) {
      setShowSlotPicker(false);
      setActiveSlot(null);
    }
  }

  function handleSlotCreateNew() {
    setShowSlotPicker(false);
    setCreatingNew(true);
    setEditingMeal({
      id: crypto.randomUUID(),
      name: "",
      serves: 1,
      ingredients: [],
      procedure: [],
      macros: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
    });
  }

  function handleModalSave(updated: Meal) {
    if (creatingNew || activeSlot?.mealIndex === null) {
      addMealToSlot(updated);
    } else {
      updateMealInSlot(updated);
    }
    setEditingMeal(null);
    setCreatingNew(false);
    setActiveSlot(null);
  }
  function handleModalClose() {
    setEditingMeal(null);
    setCreatingNew(false);
    setActiveSlot(null);
  }

  function updateShoppingList(next: ShoppingListEntry[]) {
    setShoppingList(next);
    try {
      localStorage.setItem("mealplanner-shopping", JSON.stringify(next));
    } catch {}
    // When clearing (empty list) also wipe checked and expanded state
    if (next.length === 0) {
      setShoppingChecked(new Set());
      setShoppingExpanded(new Set());
      setShoppingAdHoc([]);
      try {
        localStorage.removeItem("mealplanner-shopping-checked");
        localStorage.removeItem("mealplanner-shopping-expanded");
        localStorage.removeItem("mealplanner-shopping-adhoc");
      } catch {}
    }
  }

  function toggleShoppingChecked(key: string) {
    setShoppingChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(
          "mealplanner-shopping-checked",
          JSON.stringify([...next]),
        );
      } catch {}
      return next;
    });
  }

  function toggleShoppingExpanded(mealId: string) {
    setShoppingExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) next.delete(mealId);
      else next.add(mealId);
      try {
        localStorage.setItem(
          "mealplanner-shopping-expanded",
          JSON.stringify([...next]),
        );
      } catch {}
      return next;
    });
  }

  function addAdHocItem(item: AdHocItem) {
    setShoppingAdHoc((prev) => {
      const next = [...prev, item];
      try {
        localStorage.setItem(
          "mealplanner-shopping-adhoc",
          JSON.stringify(next),
        );
      } catch {}
      return next;
    });
  }

  function removeAdHocItem(id: string) {
    setShoppingAdHoc((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(
          "mealplanner-shopping-adhoc",
          JSON.stringify(next),
        );
      } catch {}
      return next;
    });
  }

  function addToShoppingList(meal: Meal) {
    setShoppingList((prev) => {
      if (prev.some((e) => e.meal.id === meal.id)) return prev;
      const next = [...prev, { meal, serves: meal.serves }];
      try {
        localStorage.setItem("mealplanner-shopping", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const activeExistingMeals = activeSlot
    ? weekPlan[activeSlot.dayIndex][activeSlot.mealKey]
    : [];
  const slotLabel = activeSlot
    ? `${weekPlan[activeSlot.dayIndex].day} — ${MEAL_KEY_LABELS[activeSlot.mealKey]}`
    : "";

  const GOAL_FIELDS: { key: keyof MacroGoals; label: string }[] = [
    { key: "calories", label: T.goalCalories },
    { key: "protein", label: T.goalProtein },
    { key: "carbohydrates", label: T.goalCarbs },
    { key: "fat", label: T.goalFat },
  ];

  // Compute the calendar date for a day index within the currently viewed week
  function dayDate(index: number): string {
    const key = viewingWeekKey ?? THIS_WEEK;
    const { year, week } = (() => {
      const [y, w] = key.split("-W");
      return { year: parseInt(y), week: parseInt(w) };
    })();
    const monday = isoWeekToDate(year, week);
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    return `${d.getDate()}. ${d.getMonth() + 1}.`;
  }

  const activeWeekLabel = isCurrentWeek
    ? T.currentWeekLabel
    : weekLabel(viewingWeekKey!);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <h1 className="app-title">{T.appTitle}</h1>
            <p className="app-subtitle">{T.appSubtitle}</p>
          </div>
          <div className="app-header-actions">
            <button
              className="app-library-btn"
              onClick={() => setShowLibrary(true)}
            >
              {T.library}
            </button>
            <button
              className="app-theme-btn"
              onClick={() => setShowShoppingList(true)}
              aria-label={T.shoppingList}
              title={T.shoppingList}
            >
              🛒
            </button>
            <div className="app-settings-wrap" ref={settingsRef}>
              <button
                className="app-theme-btn"
                onClick={() => setShowSettings((v) => !v)}
                aria-label={T.settingsTitle}
                title={T.settingsTitle}
              >
                {T.settings}
              </button>
              {showSettings && (
                <div className="app-settings-dropdown">
                  <div className="app-settings-dropdown__title">
                    {T.settingsTitle}
                  </div>
                  <button
                    className="app-settings-item"
                    onClick={() => {
                      setShowHistoryPicker(true);
                      setShowSettings(false);
                    }}
                  >
                    {T.historyBtn}
                  </button>
                  <button className="app-settings-item" onClick={toggleTheme}>
                    {theme === "dark" ? "☀️ Světlý motiv" : "🌙 Tmavý motiv"}
                  </button>
                  <button
                    className="app-settings-item"
                    onClick={() => {
                      handleExport();
                      setShowSettings(false);
                    }}
                  >
                    {T.export}
                  </button>
                  <button
                    className="app-settings-item"
                    onClick={() => {
                      handleExportLibrary();
                      setShowSettings(false);
                    }}
                  >
                    {T.exportLibrary}
                  </button>
                  <button
                    className="app-settings-item"
                    onClick={() => {
                      importRef.current?.click();
                      setShowSettings(false);
                    }}
                  >
                    {T.import}
                  </button>
                  <div
                    className="app-settings-dropdown__title"
                    style={{ marginTop: 8 }}
                  >
                    {T.goalsTitle}
                  </div>
                  <div className="app-settings-goals">
                    {GOAL_FIELDS.map(({ key, label }) => (
                      <div key={key} className="app-settings-goals__row">
                        <label className="app-settings-goals__label">
                          {label}
                        </label>
                        <input
                          className="app-settings-goals__input"
                          type="number"
                          min={0}
                          value={draftGoals[key]}
                          onChange={(e) => setDraftGoal(key, e.target.value)}
                        />
                      </div>
                    ))}
                    <button
                      className="app-settings-goals__save modal-btn modal-btn--save"
                      onClick={() => {
                        saveGoals();
                        setShowSettings(false);
                      }}
                    >
                      {T.save}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="app-controls">
          {/* View mode toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle__btn${viewMode === "week" ? " view-toggle__btn--active" : ""}`}
              onClick={() => {
                setViewMode("week");
                try {
                  localStorage.setItem("mealplanner-viewmode", "week");
                } catch {}
              }}
            >
              {T.viewWeek}
            </button>
            <button
              className={`view-toggle__btn${viewMode === "day" ? " view-toggle__btn--active" : ""}`}
              onClick={() => {
                setViewMode("day");
                try {
                  localStorage.setItem("mealplanner-viewmode", "day");
                } catch {}
                // Jump to today when switching to day view
                setViewingWeekKey(null);
                setFocusedDayIndex(todayDowIndex < numDays ? todayDowIndex : 0);
              }}
            >
              {T.viewDay}
            </button>
          </div>

          {/* Prev week arrow */}
          <button
            className="week-nav__arrow"
            onClick={() => navigateWeek(-1)}
            disabled={!canGoBack}
            aria-label={T.prevWeekLabel}
            title={T.prevWeekLabel}
          >
            {T.prevWeek}
          </button>

          {/* Week mode: current week pill + day count selector */}
          {viewMode === "week" && (
            <>
              <span
                className={`week-nav__label-text${isCurrentWeek ? " week-nav__label-text--current" : ""}`}
                onClick={
                  isCurrentWeek ? undefined : () => setViewingWeekKey(null)
                }
                style={isCurrentWeek ? undefined : { cursor: "pointer" }}
              >
                {activeWeekLabel}
              </span>
              <span className="app-controls__label">{T.show}</span>
              <DaySelector selected={numDays} onSelect={updateNumDays} />
            </>
          )}

          {/* Day mode: day picker with cross-week navigation */}
          {viewMode === "day" && (
            <>
              {!isCurrentWeek && (
                <span
                  className="week-nav__label-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setViewingWeekKey(null)}
                >
                  {activeWeekLabel}
                </span>
              )}
              {isCurrentWeek && (
                <span className="week-nav__label-text week-nav__label-text--current">
                  {activeWeekLabel}
                </span>
              )}
              <DayPicker
                days={allVisibleDays.map((d) => d.day)}
                selectedIndex={clampedFocused}
                todayIndex={todayIndex}
                date={dayDate(clampedFocused)}
                canPrev={true}
                canNext={
                  canGoForward || clampedFocused < allVisibleDays.length - 1
                }
                onPrev={() => {
                  if (clampedFocused > 0)
                    setFocusedDayIndex(clampedFocused - 1);
                  else navigateWeek(-1);
                }}
                onNext={() => {
                  if (clampedFocused < allVisibleDays.length - 1)
                    setFocusedDayIndex(clampedFocused + 1);
                  else navigateWeek(1);
                }}
                onChange={setFocusedDayIndex}
              />
            </>
          )}

          {/* Next week arrow */}
          <button
            className="week-nav__arrow"
            onClick={() => navigateWeek(1)}
            disabled={!canGoForward}
            aria-label={T.nextWeekLabel}
            title={T.nextWeekLabel}
          >
            {T.nextWeek}
          </button>
        </section>

        {!isCurrentWeek && (
          <div className="history-nav-banner">
            <span>📅 {activeWeekLabel}</span>
            <button
              className="modal-btn modal-btn--save"
              onClick={() => setViewingWeekKey(null)}
            >
              {T.backToCurrent}
            </button>
          </div>
        )}

        <MealTable
          days={visibleDays}
          onCellClick={handleCellClick}
          goals={goals}
          readOnly={!isCurrentWeek}
        />
      </main>

      {showHistoryPicker && (
        <HistoryPicker
          history={history}
          onClose={() => setShowHistoryPicker(false)}
          onSelect={(key) => {
            setViewingWeekKey(key);
            setShowHistoryPicker(false);
          }}
        />
      )}

      {showSlotPicker && activeSlot && (
        <SlotPicker
          slotLabel={slotLabel}
          library={library}
          existingMeals={activeExistingMeals}
          onClose={() => {
            setShowSlotPicker(false);
            setActiveSlot(null);
          }}
          onAdd={handleSlotAdd}
          onEdit={handleSlotEdit}
          onRemove={handleSlotRemove}
          onCreateNew={handleSlotCreateNew}
        />
      )}

      {editingMeal && (
        <MealModal
          meal={editingMeal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialEditMode={creatingNew}
        />
      )}

      {showLibrary && (
        <MealLibrary
          library={library}
          onClose={() => setShowLibrary(false)}
          onChange={updateLibrary}
          onAddToShoppingList={addToShoppingList}
          onRemoveFromShoppingList={(id) =>
            updateShoppingList(shoppingList.filter((e) => e.meal.id !== id))
          }
          shoppingListIds={new Set(shoppingList.map((e) => e.meal.id))}
        />
      )}

      {showShoppingList && (
        <ShoppingList
          entries={shoppingList}
          adHocItems={shoppingAdHoc}
          checkedKeys={shoppingChecked}
          expandedIds={shoppingExpanded}
          onToggleChecked={toggleShoppingChecked}
          onToggleExpanded={toggleShoppingExpanded}
          onClose={() => setShowShoppingList(false)}
          onRemoveMeal={(id) =>
            updateShoppingList(shoppingList.filter((e) => e.meal.id !== id))
          }
          onClear={() => updateShoppingList([])}
          onUpdateServes={(id, serves) =>
            updateShoppingList(
              shoppingList.map((e) =>
                e.meal.id === id ? { ...e, serves } : e,
              ),
            )
          }
          onAddAdHoc={addAdHocItem}
          onRemoveAdHoc={removeAdHocItem}
          onShare={() => setShowBasketQR(true)}
        />
      )}

      {showBasketQR && (
        <BasketQRModal
          entries={shoppingList}
          adHocItems={shoppingAdHoc}
          onClose={() => setShowBasketQR(false)}
          onLoad={(loadedEntries, loadedAdHoc) => {
            // Merge loaded entries: for known meals, prefer full data from library
            const merged = loadedEntries.map((le) => {
              const found = library.find((m) => m.id === le.meal.id);
              return found ? { meal: found, serves: le.serves } : le;
            });
            updateShoppingList([
              ...shoppingList.filter(
                (e) => !merged.some((m) => m.meal.id === e.meal.id),
              ),
              ...merged,
            ]);
            // Merge ad-hoc items
            setShoppingAdHoc((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = loadedAdHoc.filter(
                (i) => !existingIds.has(i.id),
              );
              const next = [...prev, ...newItems];
              try {
                localStorage.setItem(
                  "mealplanner-shopping-adhoc",
                  JSON.stringify(next),
                );
              } catch {}
              return next;
            });
            setShowBasketQR(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
