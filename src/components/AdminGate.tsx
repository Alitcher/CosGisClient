"use client";

import { useEffect, useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { getAdminToken, setAdminToken, clearAdminToken } from "@/lib/adminAuth";

/**
 * Gate in front of the admin dashboard. A visitor who navigates to /admin sees
 * only a login screen; the dashboard renders after a passkey (Windows Hello /
 * device PIN) login succeeds. The resulting session token lives in sessionStorage,
 * never in the bundle. A password fallback is kept so you cannot get locked out.
 *
 * For the strongest protection on a public domain, also put /admin behind
 * Cloudflare Access (SSO) at the edge.
 */
const EVENTS_API = process.env.NEXT_PUBLIC_EVENTS_API_URL || "http://localhost:8787";

type RegOptions = Parameters<typeof startRegistration>[0]["optionsJSON"];
type AuthOptions = Parameters<typeof startAuthentication>[0]["optionsJSON"];
type Phase = "loading" | "login" | "register" | "password";

async function verifyToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${EVENTS_API}/v1/submissions`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok;
  } catch {
    return false;
  }
}

function humanError(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  if (/not allowed|notallowed/i.test(msg)) return "Cancelled, or the Windows Hello prompt was dismissed.";
  return msg;
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState(""); // setup password (register) or password fallback

  useEffect(() => {
    (async () => {
      const existing = getAdminToken();
      if (existing && (await verifyToken(existing))) { setAuthed(true); return; }
      clearAdminToken();
      try {
        const res = await fetch(`${EVENTS_API}/v1/admin/status`);
        const { registered } = (await res.json()) as { registered: boolean };
        setPhase(registered ? "login" : "register");
      } catch {
        setPhase("login"); // server offline: still offer login / password
      }
    })();
  }, []);

  async function doLogin() {
    setBusy(true); setError("");
    try {
      const optRes = await fetch(`${EVENTS_API}/v1/admin/login/options`, { method: "POST" });
      if (!optRes.ok) throw new Error("Could not start login. Is the server running?");
      const optionsJSON = (await optRes.json()) as AuthOptions;
      const assertion = await startAuthentication({ optionsJSON });
      const verRes = await fetch(`${EVENTS_API}/v1/admin/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verRes.ok) throw new Error("That device is not registered.");
      const { token } = (await verRes.json()) as { token: string };
      setAdminToken(token);
      setAuthed(true);
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  async function doRegister() {
    setBusy(true); setError("");
    try {
      const auth = { Authorization: `Bearer ${secret.trim()}` };
      const optRes = await fetch(`${EVENTS_API}/v1/admin/register/options`, { method: "POST", headers: auth });
      if (optRes.status === 401) throw new Error("Wrong setup password.");
      if (!optRes.ok) throw new Error("Could not start setup. Is the server running?");
      const optionsJSON = (await optRes.json()) as RegOptions;
      const attestation = await startRegistration({ optionsJSON });
      const verRes = await fetch(`${EVENTS_API}/v1/admin/register/verify`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      if (!verRes.ok) throw new Error("Setup failed. Please try again.");
      await doLogin(); // enrolled: sign in with the new passkey right away
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  async function doPassword() {
    setBusy(true); setError("");
    const t = secret.trim();
    if (await verifyToken(t)) { setAdminToken(t); setAuthed(true); }
    else setError("Wrong password, or the events server is not running (port 8787).");
    setBusy(false);
  }

  if (authed) return <>{children}</>;
  if (phase === "loading") return null;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 380, padding: 28, display: "grid", gap: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>🔒 Admin access</h2>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            {phase === "register"
              ? "First time here. Enter the admin setup key (the ADMIN_TOKEN secret, NOT your Windows password). Windows Hello will then ask for your PC PIN to finish."
              : phase === "password"
                ? "Enter the admin key (ADMIN_TOKEN) to continue."
                : "Unlock with Windows Hello (your PC PIN or fingerprint)."}
          </p>
        </div>

        {(phase === "register" || phase === "password") && (
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={phase === "register" ? "Admin setup key (ADMIN_TOKEN)" : "Admin key (ADMIN_TOKEN)"}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") (phase === "register" ? doRegister() : doPassword()); }}
            style={{ padding: "10px 12px", borderRadius: 8 }}
          />
        )}

        {error && <p style={{ color: "#e5484d", fontSize: 13, margin: 0 }}>{error}</p>}

        {phase === "login" && (
          <button className="btn" type="button" disabled={busy} onClick={doLogin}>
            {busy ? "Waiting for Windows Hello..." : "Unlock with Windows Hello"}
          </button>
        )}
        {phase === "register" && (
          <button className="btn" type="button" disabled={busy} onClick={doRegister}>
            {busy ? "Setting up..." : "Register this device"}
          </button>
        )}
        {phase === "password" && (
          <button className="btn" type="button" disabled={busy} onClick={doPassword}>
            {busy ? "Checking..." : "Unlock"}
          </button>
        )}

        <button
          type="button"
          className="link-btn"
          style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          onClick={() => { setError(""); setSecret(""); setPhase(phase === "password" ? "login" : "password"); }}
        >
          {phase === "password" ? "Use Windows Hello instead" : "Use a password instead"}
        </button>
      </div>
    </div>
  );
}
