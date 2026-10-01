import { ThemeName } from './tokens';

const THEME_ORDER: ThemeName[] = ['red', 'green', 'white', 'purple'];

/**
 * Calculates the current auto theme based on the device's local calendar date.
 * It rotates daily: Red -> Green -> White -> Purple.
 * 
 * @param date - The date to calculate the theme for (defaults to now)
 * @returns The active theme name for that day
 */
export function getAutoThemeForDate(date: Date = new Date()): ThemeName {
  // Get time in milliseconds, then subtract the timezone offset (in ms) to align to local midnight.
  // This ensures the theme switches exactly at 00:00 local time, not UTC.
  const localTimeMs = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  const daysSinceEpoch = Math.floor(localTimeMs / 86400000);
  
  // Use modulo to cycle through the 4 themes.
  // Adding THEME_ORDER.length handles any potential negative numbers for dates before 1970.
  const index = ((daysSinceEpoch % THEME_ORDER.length) + THEME_ORDER.length) % THEME_ORDER.length;
  
  return THEME_ORDER[index];
}
