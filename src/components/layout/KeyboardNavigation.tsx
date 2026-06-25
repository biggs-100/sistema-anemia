import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Hook: useFormSubmitShortcut
// Attaches Ctrl/Cmd+Enter handler to submit a form from anywhere.
// Usage: useFormSubmitShortcut(() => handleSubmit());
// ---------------------------------------------------------------------------
export function useFormSubmitShortcut(onSubmit: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onSubmit]);
}

// ---------------------------------------------------------------------------
// Shortcut definitions for the help modal
// ---------------------------------------------------------------------------
interface ShortcutEntry {
  keys: string;
  label: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: "⌘K / Ctrl+K", label: "Abrir búsqueda global" },
  { keys: "G luego D", label: "Ir a Dashboard" },
  { keys: "G luego P", label: "Ir a Pacientes" },
  { keys: "G luego C", label: "Ir a Controles" },
  { keys: "G luego T", label: "Ir a Tratamientos" },
  { keys: "G luego A", label: "Ir a Alertas" },
  { keys: "G luego R", label: "Ir a Reportes" },
  { keys: "? / Shift+/", label: "Mostrar esta ayuda" },
  { keys: "Escape", label: "Cerrar modales / ayuda" },
  { keys: "⌘Enter / Ctrl+Enter", label: "Enviar formulario activo" },
];

// ---------------------------------------------------------------------------
// Navigation map: first key "G" → second key → route
// ---------------------------------------------------------------------------
const NAV_MAP: Record<string, string> = {
  d: ROUTES.DASHBOARD,
  p: ROUTES.PATIENTS,
  c: ROUTES.CONTROLS,
  t: ROUTES.TREATMENTS,
  a: ROUTES.ALERTS,
  r: ROUTES.REPORTS,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function KeyboardNavigation() {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  // Refs for the G→X navigation state machine
  const navBufferRef = useRef("");
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const clearBuffer = useCallback(() => {
    navBufferRef.current = "";
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Allow Escape globally (even in inputs) to close help modal
      if (e.key === "Escape") {
        if (showHelp) {
          e.preventDefault();
          setShowHelp(false);
          return;
        }
      }

      // ? to open help (only outside inputs)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const tag = target.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setShowHelp(true);
          return;
        }
      }

      // Skip the rest if focus is in an input/textarea
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // "G" key → start navigation buffer (1s timeout)
      if (e.key === "g" || e.key === "G") {
        if (navBufferRef.current === "") {
          navBufferRef.current = "g";
          navTimeoutRef.current = setTimeout(clearBuffer, 1000);
          return;
        }
        clearBuffer();
        return;
      }

      // If buffer is "g", check for second key
      if (navBufferRef.current === "g") {
        const key = e.key.toLowerCase();
        if (NAV_MAP[key]) {
          e.preventDefault();
          navigate(NAV_MAP[key]);
          clearBuffer();
          return;
        }
        // Not a valid nav key → clear buffer
        clearBuffer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearBuffer();
    };
  }, [navigate, showHelp, clearBuffer]);

  // Close help on click outside
  useEffect(() => {
    if (!showHelp) return;
    const handleClick = () => setShowHelp(false);
    // Small delay so the click that opened it doesn't close it
    const id = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 100);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handleClick);
    };
  }, [showHelp]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Atajos de Teclado
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
            >
              <span className="text-neutral-600 dark:text-neutral-400">
                {shortcut.label}
              </span>
              <kbd className="rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Presione <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">Escape</kbd> o haga clic fuera para cerrar
        </p>
      </div>
    </div>
  );
}
