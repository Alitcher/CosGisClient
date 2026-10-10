"use client";

/**
 * Inline script that sets the theme before first paint (no wrong-theme flash).
 *
 * React 19 warns when it creates a <script> on the client (e.g. when the layout
 * re-renders on a language switch). So the script is only executable in the
 * server-rendered HTML; on the client it's rendered as type="text/plain",
 * which React leaves alone. By then the theme is already set and ThemeSync
 * keeps it in step.
 */
export default function ThemeScript({ code }: { code: string }) {
  return (
    <script
      suppressHydrationWarning
      type={typeof window === "undefined" ? undefined : "text/plain"}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
