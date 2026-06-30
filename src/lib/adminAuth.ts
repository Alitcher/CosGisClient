/**
 * Admin token storage for the dashboard.
 *
 * IMPORTANT: the token is entered at the /admin login screen and kept only in
 * sessionStorage (cleared when the tab closes). It is NEVER baked into the
 * JavaScript bundle, so a normal visitor downloading the site cannot read it.
 * Public pages never touch this - only admin actions send the token.
 */
const KEY = "cmm_admin_token";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(KEY) ?? "";
}
export function setAdminToken(token: string): void {
  if (typeof window !== "undefined") window.sessionStorage.setItem(KEY, token);
}
export function clearAdminToken(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
}
