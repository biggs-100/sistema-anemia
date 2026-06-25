import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/utils/constants";
import type { Patient, SearchResult } from "@/types";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Determine the shortcut label based on platform
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac");
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  const doSearch = useCallback(
    async (q: string) => {
      if (!token || !q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await invoke<{ success: boolean; data?: SearchResult<Patient> }>(
          "search_patients",
          { token, query: q, page: 1, pageSize: 10 },
        );
        if (res.success && res.data) {
          setResults(res.data.data);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  const navigateToPatient = useCallback(
    (patient: Patient) => {
      navigate(ROUTES.PATIENT_DETAIL.replace(":id", String(patient.id)));
      close();
    },
    [navigate, close],
  );

  // Global keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if the user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Cmd+K even in inputs to close the search
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          if (open) {
            close();
          }
          return;
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          close();
        } else {
          setOpen(true);
        }
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToPatient(results[selectedIndex]);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, close, navigateToPatient]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="relative flex items-center border-b border-neutral-200 dark:border-neutral-700">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pacientes por DNI, nombre o HC..."
            className="w-full bg-transparent px-5 py-4 text-lg outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          <kbd className="absolute right-4 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
            {shortcutLabel}
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-neutral-400 dark:text-neutral-500">
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Buscando...
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No se encontraron pacientes
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((patient, index) => (
                <li
                  key={patient.id}
                  className={`flex cursor-pointer items-center justify-between px-5 py-3 transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                  }`}
                  onClick={() => navigateToPatient(patient)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {patient.apellidoPaterno} {patient.apellidoMaterno},{" "}
                      {patient.nombres}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      DNI: {patient.dni} · HC: {patient.historiaClinica}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    ↵
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!loading && !query.trim() && (
            <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
              Escriba para buscar pacientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
