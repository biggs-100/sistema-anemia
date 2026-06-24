import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
import { ROUTES } from "@/utils/constants";

// const patientSchema = z.object({
//   historiaClinica: z.string().min(1, "Requerido"),
//   dni: z.string().length(8, "DNI debe tener 8 dígitos"),
//   nombres: z.string().min(1, "Requerido"),
//   apellidoPaterno: z.string().min(1, "Requerido"),
//   apellidoMaterno: z.string().min(1, "Requerido"),
//   fechaNacimiento: z.string().min(1, "Requerido"),
//   sexo: z.enum(["M", "F"]),
//   direccion: z.string().optional(),
// });

// type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormValues {
  historiaClinica: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  direccion: string;
}

export default function PatientFormPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>();

  // const { register, handleSubmit, formState: { errors, isSubmitting } } =
  //   useForm<PatientFormData>({
  //     resolver: zodResolver(patientSchema),
  //   });

  const onSubmit = async (_data: PatientFormValues) => {
    // Tauri invoke("create_patient", { dto: data })
    // await patientService.createPatient(data);
    navigate(ROUTES.PATIENTS);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Nuevo Paciente</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Registre un nuevo paciente en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Historia Clínica */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Historia Clínica
            </label>
            <input
              {...register("historiaClinica", { required: "Requerido" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.historiaClinica && (
              <p className="mt-1 text-xs text-red-600">{errors.historiaClinica.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">DNI</label>
            <input
              {...register("dni", { required: "Requerido", minLength: 8 })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={8}
            />
            {errors.dni && (
              <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p>
            )}
          </div>
        </div>

        {/* Nombres y Apellidos */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombres</label>
          <input
            {...register("nombres", { required: "Requerido" })}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.nombres && (
            <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Apellido Paterno
            </label>
            <input
              {...register("apellidoPaterno", { required: "Requerido" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.apellidoPaterno && (
              <p className="mt-1 text-xs text-red-600">{errors.apellidoPaterno.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Apellido Materno
            </label>
            <input
              {...register("apellidoMaterno", { required: "Requerido" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.apellidoMaterno && (
              <p className="mt-1 text-xs text-red-600">{errors.apellidoMaterno.message}</p>
            )}
          </div>
        </div>

        {/* Fecha Nacimiento y Sexo */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              {...register("fechaNacimiento", { required: "Requerido" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.fechaNacimiento && (
              <p className="mt-1 text-xs text-red-600">{errors.fechaNacimiento.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Sexo</label>
            <select
              {...register("sexo", { required: "Requerido" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {errors.sexo && (
              <p className="mt-1 text-xs text-red-600">{errors.sexo.message}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Dirección</label>
          <input
            {...register("direccion")}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PATIENTS)}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
