import { useEffect, useState } from "react";
import { useBackupStore } from "@/stores/backupStore";
import { useAuthStore } from "@/stores/authStore";
import type { Backup } from "@/types";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatSize(mb: number): string {
  return `${mb.toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { backups, loading, creating, restoring, error, loadBackups, createBackup, restoreBackup } =
    useBackupStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rolId === 1;
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCreateBackup = async () => {
    try {
      await createBackup();
    } catch {
      // error displayed in store
    }
  };

  const handleRestoreClick = (id: number) => {
    setRestoreId(id);
    setShowConfirm(true);
  };

  const handleConfirmRestore = async () => {
    if (restoreId === null) return;
    try {
      await restoreBackup(restoreId);
      setShowConfirm(false);
      setRestoreId(null);
      alert("Backup restaurado correctamente. La aplicación se reiniciará.");
    } catch {
      // error displayed in store
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Configuración</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Administración del sistema y copias de seguridad
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-yellow-700">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Configuración</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Administración del sistema y copias de seguridad
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Backups Section */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Copias de Seguridad</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Gestión de backups de la base de datos
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Respaldando...
              </span>
            ) : (
              "Crear Backup"
            )}
          </button>
        </div>

        {/* Backups history table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">Historial de Backups</h4>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-neutral-400">
              <Spinner size="sm" className="mr-2" />
              <span className="text-sm">Cargando backups...</span>
            </div>
          ) : backups.length === 0 ? (
            <p className="text-sm text-neutral-400">No hay backups registrados</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Archivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Tamaño</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                        {backup.fechaGeneracion ? formatDate(backup.fechaGeneracion) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                        {backup.nombreArchivo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                        {formatSize(backup.tamañoMb)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            backup.resultado === "exitoso"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {backup.resultado === "exitoso" ? "Exitoso" : "Fallido"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <button
                          onClick={() => handleRestoreClick(backup.id)}
                          disabled={restoring}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Información del Sistema</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-neutral-500">Versión</p>
            <p className="mt-1 text-sm text-neutral-900">0.1.0</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-500">Base de Datos</p>
            <p className="mt-1 text-sm text-neutral-900">SQLite</p>
          </div>
        </div>
      </div>

      {/* Restore confirmation dialog */}
      <Modal isOpen={showConfirm} onClose={() => { setShowConfirm(false); setRestoreId(null); }} title="Restaurar Backup">
        <p className="mt-2 text-sm text-neutral-600">
          ¿Está seguro de restaurar este backup? Los datos actuales serán reemplazados.
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setShowConfirm(false);
              setRestoreId(null);
            }}
            disabled={restoring}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmRestore}
            disabled={restoring}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {restoring ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
