import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function PatientListPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Tauri invoke() calls will load real data:
  // const { patients, loading, error, search } = usePatients();
  // useEffect(() => { search("")... }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // patientService.searchPatients(searchQuery);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Pacientes</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Gestión de pacientes registrados
          </p>
        </div>
        <Link
          to={ROUTES.PATIENT_NEW}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo Paciente
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por DNI, nombres o historia clínica..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
        >
          Buscar
        </button>
      </form>

      {/* Table placeholder — TanStack Table integration here */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                H. Clínica
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                DNI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Nombres
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Apellidos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Sexo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Estado
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
                {searchQuery
                  ? "No se encontraron pacientes"
                  : "Use el buscador para encontrar pacientes"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
