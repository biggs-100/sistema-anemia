import { useState } from "react";

export default function SettingsPage() {
  const [backingUp, setBackingUp] = useState(false);

  // Tauri invoke("create_backup", "list_backups", "restore_backup")
  const handleBackup = async () => {
    setBackingUp(true);
    // await invoke("create_backup");
    setBackingUp(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Configuración</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Administración del sistema y copias de seguridad
        </p>
      </div>

      {/* Backup Section */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">
          Copias de Seguridad
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Gestión de backups de la base de datos
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backingUp ? "Respaldando..." : "Crear Backup"}
          </button>
          <button className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Restaurar Backup
          </button>
        </div>

        {/* Backups list */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-neutral-700">
            Historial de Backups
          </h4>
          <p className="mt-2 text-sm text-neutral-400">
            {/* Tauri invoke("list_backups") will populate */}
            No hay backups registrados
          </p>
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">
          Información del Sistema
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-neutral-500">
              Versión
            </p>
            <p className="mt-1 text-sm text-neutral-900">0.1.0</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-500">
              Base de Datos
            </p>
            <p className="mt-1 text-sm text-neutral-900">SQLite</p>
          </div>
        </div>
      </div>
    </div>
  );
}
