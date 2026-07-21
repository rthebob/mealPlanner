import type { DayPlan, Meal } from "./types";
import { T } from "./i18n";

const DAYS = T.days_of_week;

export const WEEK_PLAN: DayPlan[] = DAYS.map((day) => ({
  day,
  breakfast: [],
  morningSnack: [],
  lunch: [],
  afternoonSnack: [],
  dinner: [],
}));

export const DEFAULT_MEAL_LIBRARY: Meal[] = [];
