/**
 * i18n helper (ADR-002). All UI text goes through t() — no hardcoded strings.
 * Today it wraps chrome.i18n; a user-selectable language can be added here later
 * without touching UI code.
 */
export function t(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}
