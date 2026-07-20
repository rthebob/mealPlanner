import { useState } from "react";
import type { WeekHistory } from "../types";
import { T } from "../i18n";
import "./HistoryPicker.css";

interface HistoryPickerProps {
  history: WeekHistory;
  onClose: () => void;
  onSelect: (weekKey: string) => void;
}

// Parse "YYYY-Www" → { year, week }
function parseKey(key: string): { year: number; week: number } {
  const [y, w] = key.split("-W");
  return { year: parseInt(y), week: parseInt(w) };
}

// Get Monday of ISO week
export function isoWeekToDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Mon=0
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  return monday;
}

// Format a date as "D. M." Czech style
function fmtDate(d: Date): string {
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

// Current ISO week key
export function currentWeekKey(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - dayOfWeek);
  const diff = now.getTime() - startOfYear.getTime();
  const week = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1;
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Offset a week key by +/- n weeks
export function offsetWeekKey(key: string, delta: number): string {
  const { year, week } = parseKey(key);
  const monday = isoWeekToDate(year, week);
  monday.setDate(monday.getDate() + delta * 7);
  // Re-derive ISO week from the new date
  const jan4 = new Date(monday.getFullYear(), 0, 4);
  const dow = (jan4.getDay() + 6) % 7;
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - dow);
  const diff = monday.getTime() - startOfYear.getTime();
  const newWeek = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1;
  return `${monday.getFullYear()}-W${String(newWeek).padStart(2, "0")}`;
}

// Human-readable label for a week key
export function weekLabel(key: string): string {
  const { year, week } = parseKey(key);
  const monday = isoWeekToDate(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `T${week}  ${fmtDate(monday)} – ${fmtDate(sunday)} ${year}`;
}

export function HistoryPicker({
  history,
  onClose,
  onSelect,
}: HistoryPickerProps) {
  const keys = Object.keys(history).sort().reverse();

  // Group by year
  const byYear: Record<number, string[]> = {};
  for (const key of keys) {
    const { year } = parseKey(key);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(key);
  }

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);
  const [openYear, setOpenYear] = useState<number | null>(years[0] ?? null);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={T.historyTitle}
    >
      <div
        className="modal-card history-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-actions">
          <h2 className="library-title">{T.historyTitle}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Zavřít">
            ×
          </button>
        </div>

        {keys.length === 0 ? (
          <p className="history-empty">{T.noSavedWeeks}</p>
        ) : (
          <div className="history-list">
            {years.map((year) => (
              <div key={year} className="history-year">
                <button
                  className="history-year__toggle"
                  onClick={() => setOpenYear(openYear === year ? null : year)}
                >
                  <span>{year}</span>
                  <span className="history-year__count">
                    {byYear[year].length} týdnů
                  </span>
                  <span className="history-year__chevron">
                    {openYear === year ? "▲" : "▼"}
                  </span>
                </button>

                {openYear === year && (
                  <div className="history-weeks">
                    {byYear[year].map((key) => {
                      const { year: y, week: w } = parseKey(key);
                      const monday = isoWeekToDate(y, w);
                      const sunday = new Date(monday);
                      sunday.setDate(monday.getDate() + 6);
                      const filled = Object.values(history[key]).filter(
                        Boolean,
                      ).length;

                      return (
                        <button
                          key={key}
                          className="history-week-item"
                          onClick={() => {
                            onSelect(key);
                            onClose();
                          }}
                        >
                          <div className="history-week-item__left">
                            <span className="history-week-item__num">T{w}</span>
                            <span className="history-week-item__range">
                              {fmtDate(monday)} – {fmtDate(sunday)} {y}
                            </span>
                          </div>
                          <div className="history-week-item__right">
                            <span className="history-week-item__days">
                              {filled} / 7 dní
                            </span>
                            <span className="history-week-item__arrow">›</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
