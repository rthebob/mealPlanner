export interface Macros {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
}

export type MacroGoals = Macros;

export interface Ingredient {
  name: string;
  amount: string; // e.g. "200", "1.5" — kept as string for flexible input
  unit: string; // e.g. "g", "ml", "ks", "lžíce"
}

export type MealType = "breakfast" | "snack" | "lunch" | "dinner";

export interface Meal {
  id: string;
  name: string;
  imageUrl?: string;
  serves: number;
  favourite?: boolean;
  mealTypes?: MealType[];
  ingredients: Ingredient[];
  procedure: string[];
  macros: Macros;
}

export interface DayPlan {
  day: string;
  breakfast: Meal[];
  morningSnack: Meal[];
  lunch: Meal[];
  afternoonSnack: Meal[];
  dinner: Meal[];
}

// History: keyed by ISO week string e.g. "2025-W28"
export type WeekHistory = Record<string, DayPlan[]>;
