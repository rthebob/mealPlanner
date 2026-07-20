export interface Macros {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
}

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
