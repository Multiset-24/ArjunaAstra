"use client";
import { useProgress } from "@/lib/store/progress";

export function ThemeToggle({ className }: { className?: string }) {
  const { state, setPref } = useProgress();
  const dark = state.prefs.theme !== "paper";
  return (
    <button
      type="button"
      className={className}
      onClick={() => setPref("theme", dark ? "paper" : "dark")}
      aria-label={dark ? "Switch to paper (light) theme" : "Switch to walnut (dark) theme"}
      title={dark ? "Paper theme" : "Walnut theme"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
    </button>
  );
}
