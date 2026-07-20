import type { DayPlan, Meal } from "./types";
import { T } from "./i18n";

const DAYS = T.days_of_week;

export const WEEK_PLAN: DayPlan[] = DAYS.map((day) => ({
  day,
  breakfast: null,
  morningSnack: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
}));

export const DEFAULT_MEAL_LIBRARY: Meal[] = [];
