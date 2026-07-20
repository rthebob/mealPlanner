// All user-visible strings in one place
export const T = {
  appTitle: "🥗 Jídelníček",
  appSubtitle: "Naplánujte svůj týden, jezte zdravě každý den",
  library: "📚 Knihovna",
  export: "⬇ Export",
  import: "⬆ Import",
  show: "Zobrazit:",
  days: (n: number) => `${n} dní`,
  addMeal: "Přidat jídlo",

  // Meal rows
  breakfast: "Snídaně",
  morningSnack: "Svačina",
  lunch: "Oběd",
  afternoonSnack: "Svačina",
  dinner: "Večeře",

  // MealModal
  editMeal: "✏️ Upravit",
  save: "Uložit",
  cancel: "Zrušit",
  ingredients: "Ingredience",
  procedure: "Postup",
  mealNamePlaceholder: "Název jídla",
  descriptionPlaceholder: "Krátký popis",
  addIngredient: "+ Přidat ingredienci",
  addStep: "+ Přidat krok",
  ingredientPlaceholder: (i: number) => `Ingredience ${i + 1}`,
  stepPlaceholder: (i: number) => `Krok ${i + 1}`,
  calories: "Kalorie",
  protein: "Bílkoviny",
  carbs: "Sacharidy",
  fat: "Tuky",
  removeIngredient: "Odebrat ingredienci",
  removeStep: "Odebrat krok",

  // SlotPicker
  currentMeal: "Aktuální jídlo",
  chooseFromLibrary: "Vybrat z knihovny",
  searchPlaceholder: "Hledat jídla…",
  noMealsInLibrary: "Knihovna je prázdná. Přidejte jídla v Knihovně.",
  noMealsMatch: "Žádná jídla neodpovídají hledání.",
  createFromScratch: "+ Vytvořit od základu",
  remove: "🗑 Odebrat",

  // MealLibrary
  mealLibrary: "📚 Knihovna jídel",
  newMeal: "+ Nové jídlo",
  noMealsYet: "Zatím žádná jídla. Klikněte na '+ Nové jídlo'.",
  editMealBtn: "✏️",
  deleteMealBtn: "🗑",

  // Import error
  invalidFile:
    "Neplatný soubor. Vyberte prosím platný soubor meal-planner.json.",

  // Theme toggle
  lightMode: "☀️",
  darkMode: "🌙",

  // Settings menu
  settings: "⚙️",
  settingsTitle: "Nastavení",

  // Weekdays
  days_of_week: [
    "Pondělí",
    "Úterý",
    "Středa",
    "Čtvrtek",
    "Pátek",
    "Sobota",
    "Neděle",
  ] as const,
};
