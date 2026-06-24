import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function ControlsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">
          Controles por Paciente
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Los controles de hemoglobina se gestionan desde la ficha de cada
          paciente. Seleccione un paciente para ver y registrar sus controles.
        </p>
        <button
          onClick={() => navigate(ROUTES.PATIENTS)}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ir a Pacientes
        </button>
      </div>
    </div>
  );
}
