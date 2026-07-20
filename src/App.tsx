import { useState, useRef, useEffect } from "react";
import type { Meal, DayPlan } from "./types";
import { WEEK_PLAN, DEFAULT_MEAL_LIBRARY } from "./data";
import { DaySelector } from "./components/DaySelector";
import { MealTable } from "./components/MealTable";
import { MealModal } from "./components/MealModal";
import { SlotPicker } from "./components/SlotPicker";
import { MealLibrary } from "./components/MealLibrary";
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

  // Apply theme to <html>
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

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  // Which slot is being targeted
  const [activeSlot, setActiveSlot] = useState<{
    dayIndex: number;
    mealKey: MealKey;
  } | null>(null);

  // Modals open state
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

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

  const importRef = useRef<HTMLInputElement>(null);
  const visibleDays = weekPlan.slice(0, numDays);

  function handleExport() {
    const data = JSON.stringify({ weekPlan, library }, null, 2);
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
      } catch {
        alert(T.invalidFile);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleCellClick(dayIndex: number, mealKey: MealKey) {
    setActiveSlot({ dayIndex, mealKey });
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
    const meal = weekPlan[activeSlot.dayIndex][activeSlot.mealKey];
    setShowSlotPicker(false);
    setEditingMeal(meal);
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
                    {theme === "dark" ? T.lightMode : T.darkMode}
                    &nbsp;{theme === "dark" ? "Světlý motiv" : "Tmavý motiv"}
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
          <span className="app-controls__label">{T.show}</span>
          <DaySelector selected={numDays} onSelect={updateNumDays} />
        </section>

        <MealTable days={visibleDays} onCellClick={handleCellClick} />
      </main>

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
