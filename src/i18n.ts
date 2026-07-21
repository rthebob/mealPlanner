// All user-visible strings in one place
export const T = {
  appTitle: "🥗 Jídelníček",
  appSubtitle: "Naplánujte svůj týden, jezte zdravě každý den",
  library: "🥘 Knihovna",
  export: "⬇ Export",
  exportLibrary: "⬇ Export knihovny",
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
  ingredientAmountPlaceholder: "Množství",
  ingredientUnitPlaceholder: "Jedn.",
  ingredientNamePlaceholder: (i: number) => `Ingredience ${i + 1}`,

  // Serves / scaling
  serves: "Porce",
  scaleBtn: "Přepočítat",
  scaleTo: "Přepočítat na",
  servesBase: (n: number) =>
    `Základní recept: ${n} ${n === 1 ? "porce" : n < 5 ? "porce" : "porcí"}`,
  removeStep: "Odebrat krok",

  // SlotPicker
  currentMeal: "Aktuální jídla",
  addAnotherMeal: "+ Přidat další jídlo",
  chooseFromLibrary: "Vybrat z knihovny",
  searchPlaceholder: "Hledat jídla…",
  noMealsInLibrary: "Knihovna je prázdná. Přidejte jídla v Knihovně.",
  noMealsMatch: "Žádná jídla neodpovídají hledání.",
  createFromScratch: "+ Vytvořit od základu",
  remove: "🗑 Odebrat",

  // MealLibrary
  mealLibrary: "🥘 Knihovna jídel",
  newMeal: "+ Nové jídlo",
  noMealsYet: "Zatím žádná jídla. Klikněte na '+ Nové jídlo'.",
  editMealBtn: "✏️",
  deleteMealBtn: "🗑",
  filterAll: "Vše",
  filterFavourites: "⭐ Oblíbené",
  filterLabel: "Filtr",
  mealTypeLabel: "Typ jídla",
  mealTypeBreakfast: "Snídaně",
  mealTypeSnack: "Svačina",
  mealTypeLunch: "Oběd",
  mealTypeDinner: "Večeře",

  // Import error
  invalidFile:
    "Neplatný soubor. Vyberte prosím platný soubor meal-planner.json.",

  // Confirm delete
  confirmDelete: "Opravdu smazat?",
  confirmYes: "✓",
  confirmNo: "✗",
  confirmRemove: "Opravdu odebrat?",

  // Macro goals (settings)
  goalsTitle: "Denní cíle maker",
  goalCalories: "Kalorie (kcal)",
  goalProtein: "Bílkoviny (g)",
  goalCarbs: "Sacharidy (g)",
  goalFat: "Tuky (g)",
  goalsSaved: "Cíle uloženy",
  totalRow: "Celkem",

  // Day picker
  viewWeek: "Týden",
  viewDay: "Den",
  todayBtn: "Dnes",
  prevDay: "Předchozí den",
  nextDay: "Následující den",

  prevWeek: "«",
  nextWeek: "»",
  prevWeekLabel: "Předchozí týden",
  nextWeekLabel: "Následující týden",
  currentWeekLabel: "Aktuální týden",

  // History / calendar
  saveWeek: "Uložit týden",
  historyBtn: "📅 Historie",
  historyTitle: "Historie týdnů",
  readOnlyBanner: "Zobrazujete uloženou historii — pouze pro čtení",
  backToCurrent: "← Aktuální týden",
  noSavedWeeks: "Zatím nejsou žádné uložené týdny.",
  weekLabel: (key: string) => `Týden ${key}`,

  addToShoppingList: "Přidat do nákupního seznamu",
  favourite: "Přidat mezi oblíbené",
  unfavourite: "Odebrat z oblíbených",

  // Shopping list
  shoppingList: "🛒 Nákupní seznam",
  shoppingListEmpty: "Nákupní seznam je prázdný. Přidejte jídla z plánu.",
  clearList: "Vyprázdnit",
  removeFromList: "Odebrat jídlo ze seznamu",
  expandMeal: "Rozbalit",
  collapseMeal: "Sbalit",
  adHocPlaceholder: "Přidat položku…",
  adHocAdd: "+ Přidat",

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
