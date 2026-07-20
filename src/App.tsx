import { useState, useRef, useEffect } from "react";
import type { Meal, DayPlan, MacroGoals, WeekHistory } from "./types";
import { WEEK_PLAN, DEFAULT_MEAL_LIBRARY } from "./data";
import { DaySelector } from "./components/DaySelector";
import { MealTable } from "./components/MealTable";
import { MealModal } from "./components/MealModal";
import { SlotPicker } from "./components/SlotPicker";
import { DayPicker } from "./components/DayPicker";
import { MealLibrary } from "./components/MealLibrary";
import {
  HistoryPicker,
  currentWeekKey,
  offsetWeekKey,
  weekLabel,
  isoWeekToDate,
} from "./components/HistoryPicker";
import { T } from "./i18n";
import "./App.css";

type MealKey = keyof Omit<DayPlan, "day">;

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
      return v ? JSON.parse(v) : WEEK_PLAN;
    } catch {
      return WEEK_PLAN;
    }
  });
  const [library, setLibrary] = useState<Meal[]>(() => {
    try {
      const v = localStorage.getItem("mealplanner-library");
      return v ? JSON.parse(v) : DEFAULT_MEAL_LIBRARY;
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
      return v ? JSON.parse(v) : {};
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
  } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [focusedDayIndex, setFocusedDayIndex] = useState(0);

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
    setLibrary(next);
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

  function handleCellClick(dayIndex: number, mealKey: MealKey) {
    if (!isCurrentWeek) return;
    const realIndex = viewMode === "day" ? clampedFocused : dayIndex;
    setActiveSlot({ dayIndex: realIndex, mealKey });
    setShowSlotPicker(true);
  }

  function assignMealToSlot(meal: Meal) {
    if (!activeSlot) return;
    updateWeekPlan((prev) => {
      const copy = prev.map((d) => ({ ...d }));
      copy[activeSlot.dayIndex] = {
        ...copy[activeSlot.dayIndex],
        [activeSlot.mealKey]: meal,
      };
      return copy;
    });
  }

  function handleSlotSelect(meal: Meal) {
    assignMealToSlot(meal);
    setShowSlotPicker(false);
    setActiveSlot(null);
  }

  function handleSlotEditExisting() {
    if (!activeSlot) return;
    setShowSlotPicker(false);
    setEditingMeal(weekPlan[activeSlot.dayIndex][activeSlot.mealKey]);
    setCreatingNew(false);
  }

  function handleSlotClear() {
    if (!activeSlot) return;
    updateWeekPlan((prev) => {
      const copy = prev.map((d) => ({ ...d }));
      copy[activeSlot.dayIndex] = {
        ...copy[activeSlot.dayIndex],
        [activeSlot.mealKey]: null,
      };
      return copy;
    });
    setShowSlotPicker(false);
    setActiveSlot(null);
  }

  function handleSlotCreateNew() {
    setShowSlotPicker(false);
    setCreatingNew(true);
    setEditingMeal({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      ingredients: [],
      procedure: [],
      macros: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
    });
  }

  function handleModalSave(updated: Meal) {
    assignMealToSlot(updated);
    setEditingMeal(null);
    setCreatingNew(false);
    setActiveSlot(null);
  }
  function handleModalClose() {
    setEditingMeal(null);
    setCreatingNew(false);
    setActiveSlot(null);
  }

  const activeExistingMeal = activeSlot
    ? weekPlan[activeSlot.dayIndex][activeSlot.mealKey]
    : null;
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
              className="app-library-btn"
              onClick={() => setShowHistoryPicker(true)}
            >
              {T.historyBtn}
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
                  <button className="app-settings-item" onClick={toggleTheme}>
                    {theme === "dark" ? T.lightMode : T.darkMode}&nbsp;
                    {theme === "dark" ? "Světlý motiv" : "Tmavý motiv"}
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
              onClick={() => setViewMode("week")}
            >
              {T.viewWeek}
            </button>
            <button
              className={`view-toggle__btn${viewMode === "day" ? " view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("day")}
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
          existingMeal={activeExistingMeal}
          onClose={() => {
            setShowSlotPicker(false);
            setActiveSlot(null);
          }}
          onSelect={handleSlotSelect}
          onEditExisting={handleSlotEditExisting}
          onClear={handleSlotClear}
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
        />
      )}
    </div>
  );
}

export default App;
