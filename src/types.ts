export interface Macros {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
}

export type MacroGoals = Macros;

export interface Meal {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ingredients: string[];
  procedure: string[];
  macros: Macros;
}

export interface DayPlan {
  day: string;
  breakfast: Meal | null;
  morningSnack: Meal | null;
  lunch: Meal | null;
  afternoonSnack: Meal | null;
  dinner: Meal | null;
}

// History: keyed by ISO week string e.g. "2025-W28"
export type WeekHistory = Record<string, DayPlan[]>;
