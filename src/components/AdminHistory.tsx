"use client";

import { useCallback, useEffect, useState } from "react";
import { apiHistoryAction, apiListHistory, type HistoryGroup } from "@/lib/api";

/**
 * Admin > History: every admin change (add, edit, delete, approve, reject, combine),
 * newest first, with who made it. Each line can be undone or redone, and "Jump here"
 * makes the data look like right after that line (later lines undone, earlier ones
 * redone). Server: api-service services/history.ts. `onChanged` refreshes the other tabs.
 */
export default function AdminHistory({ onChanged }: { onChanged: () => Promise<unknown> }) {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setGroups(await apiListHistory(200));
      setError("");
    } catch (err) {
      setError(`Could not load the history: ${(err as Error).message}`);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    apiListHistory(200)
      .then((g) => { if (alive) setGroups(g); })
      .catch((err: Error) => { if (alive) setError(`Could not load the history: ${err.message}`); });
    return () => { alive = false; };
  }, []);

  async function run(group: string, action: "undo" | "redo" | "jump") {
    setBusy(true);
    try {
      await apiHistoryAction(group, action);
      await Promise.all([load(), onChanged()]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // "Undo last" = the newest line still in effect; "Redo" = the undone line right above it.
  const current = groups.findIndex((g) => !g.undone);
  const undoLast = current >= 0 ? groups[current] : null;
  const redoNext = current > 0 ? (groups[current - 1].undone ? groups[current - 1] : null) : current < 0 && groups.length ? groups[groups.length - 1] : null;
  const when = (at: string) => new Date(`${at.replace(" ", "T")}Z`).toLocaleString();
  const rowsText = (g: HistoryGroup) =>
    g.rows.map((r) => `${r.name} (${r.table === "events" ? "event" : "spot"}, ${r.change})`).join(", ");

  return (
    <div className="card table-card">
      <div className="a-toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <span className="muted">{groups.length} change(s) | newest first</span>
        <div className="flex gap-sm" style={{ marginLeft: "auto" }}>
          <button className="btn ghost" type="button" disabled={busy || !undoLast} onClick={() => undoLast && run(undoLast.group, "undo")} title={undoLast ? `Undo: ${undoLast.label}` : ""}>Undo last</button>
          <button className="btn ghost" type="button" disabled={busy || !redoNext} onClick={() => redoNext && run(redoNext.group, "redo")} title={redoNext ? `Redo: ${redoNext.label}` : ""}>Redo</button>
        </div>
      </div>
      {error && <p className="field-note warn" style={{ padding: "0 18px" }}>{error}</p>}
      <table>
        <thead><tr><th>Change</th><th className="hide-sm">Who</th><th className="hide-sm">When</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={g.group} className={`${g.undone ? "hist-undone" : ""}${i === current ? " hist-current" : ""}`}>
              <td>
                <div className="ev-name">{g.label}{g.undone && <span className="status draft" style={{ marginLeft: 8 }}>Undone</span>}{i === current && <span className="status live" style={{ marginLeft: 8 }}>Current</span>}</div>
                <div className="ev-sub">{rowsText(g)}</div>
              </td>
              <td className="hide-sm">{g.actor}</td>
              <td className="hide-sm">{when(g.at)}</td>
              <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                {g.undone
                  ? <button className="btn ghost hist-btn" type="button" disabled={busy} onClick={() => run(g.group, "redo")}>Redo</button>
                  : <button className="btn ghost hist-btn" type="button" disabled={busy} onClick={() => run(g.group, "undo")}>Undo</button>}
                <button className="btn ghost hist-btn" type="button" disabled={busy || i === current} title="Make everything look like right after this change" onClick={() => { if (confirm(`Jump to right after "${g.label}"? Later changes are undone (you can redo them).`)) void run(g.group, "jump"); }}>Jump here</button>
              </div></td>
            </tr>
          ))}
          {groups.length === 0 && !error && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-2)" }}>No changes yet. Admin edits from now on show up here.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
