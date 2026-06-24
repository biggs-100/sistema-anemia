import { useState } from "react";
import { ROUTES } from "@/utils/constants";

export default function ControlsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Tauri invoke("get_controls") will load controls
  // useControls hook will be used when wired

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Controles</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Historial de controles de hemoglobina
          </p>
        </div>
        <button
          disabled={!selectedPatientId}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Nuevo Control
        </button>
      </div>

      {/* Patient filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar paciente por DNI o nombre..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200">
          Filtrar
        </button>
      </div>

      {/* Controls table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Paciente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Hb (g/dL)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Clasificación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Peso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Talla
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm text-neutral-400"
              >
                Seleccione un paciente para ver sus controles
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
