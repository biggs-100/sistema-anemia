import { useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePatientForm } from "@/hooks/usePatients";
import { usePatientStore } from "@/stores/patientStore";
import { ROUTES } from "@/utils/constants";
import Spinner from "@/components/ui/Spinner";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const patientSchema = z.object({
  historiaClinica: z.string().min(1, "Historia clínica es requerida").transform((s) => s.trim()),
  dni: z
    .string()
    .length(8, "DNI debe tener 8 dígitos")
    .regex(/^\d+$/, "Solo números")
    .transform((s) => s.trim()),
  nombres: z.string().min(1, "Nombres es requerido").transform((s) => s.trim()),
  apellidoPaterno: z.string().min(1, "Apellido paterno es requerido").transform((s) => s.trim()),
  apellidoMaterno: z.string().min(1, "Apellido materno es requerido").transform((s) => s.trim()),
  fechaNacimiento: z
    .string()
    .min(1, "Fecha de nacimiento es requerida")
    .refine(
      (val) => {
        const date = new Date(val);
        return date <= new Date();
      },
      { message: "La fecha de nacimiento no puede ser futura" },
    ),
  sexo: z.enum(["M", "F"], { required_error: "Seleccione sexo" }),
  centroPobladoId: z.string().min(1, "Seleccione centro poblado"),
  nombreApoderado: z.string().min(1, "Apoderado es requerido").transform((s) => s.trim()),
  celularApoderado: z
    .string()
    .regex(/^\d{9}$/, "Debe tener 9 dígitos")
    .optional()
    .or(z.literal("")),
});

type PatientFormData = z.infer<typeof patientSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sexoOptions = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

function calcularEdad(fechaNacimiento: string): string {
  if (!fechaNacimiento) return "";
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return "";
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0) {
    años--;
    meses += 12;
  }
  if (años < 2) {
    return años === 0 ? `${meses} meses` : `${años} año${años > 1 ? "s" : ""} ${meses} meses`;
  }
  return `${años} años ${meses} meses`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const patientId = id ? Number(id) : null;

  const {
    loading,
    error,
    centrosPoblados,
    createPatient,
    updatePatient,
    loadPatient,
    clearError,
  } = usePatientForm();

  const selectedPatient = usePatientStore((s) => s.selectedPatient);
  const loadingDetail = usePatientStore((s) => s.loadingDetail);

  // Load patient data in edit mode
  useEffect(() => {
    if (isEditMode && patientId) {
      loadPatient(patientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, isEditMode]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      historiaClinica: "",
      dni: "",
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      fechaNacimiento: "",
      sexo: undefined,
      centroPobladoId: "",
      nombreApoderado: "",
      celularApoderado: "",
    },
  });

  // Pre-fill form when patient data loads in edit mode
  useEffect(() => {
    if (isEditMode && selectedPatient && !loadingDetail) {
      reset({
        historiaClinica: selectedPatient.historiaClinica,
        dni: selectedPatient.dni,
        nombres: selectedPatient.nombres,
        apellidoPaterno: selectedPatient.apellidoPaterno,
        apellidoMaterno: selectedPatient.apellidoMaterno,
        fechaNacimiento: selectedPatient.fechaNacimiento,
        sexo: selectedPatient.sexo as "M" | "F",
        centroPobladoId: String(selectedPatient.centroPobladoId ?? ""),
        nombreApoderado: selectedPatient.nombreApoderado ?? "",
        celularApoderado: selectedPatient.celularApoderado ?? "",
      });
    }
  }, [isEditMode, selectedPatient, loadingDetail, reset]);

  // Auto-calculate age display
  const fechaNacimiento = watch("fechaNacimiento");
  const edadPreview = useMemo(() => calcularEdad(fechaNacimiento), [fechaNacimiento]);

  const onSubmit = useCallback(
    async (data: PatientFormData) => {
      clearError();
      const dto = {
        historiaClinica: data.historiaClinica,
        dni: data.dni,
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        centroPobladoId: Number(data.centroPobladoId),
        nombreApoderado: data.nombreApoderado,
        celularApoderado: data.celularApoderado || undefined,
      };

      try {
        if (isEditMode && patientId) {
          await updatePatient(patientId, dto);
          navigate(ROUTES.PATIENT_DETAIL.replace(":id", String(patientId)));
        } else {
          const created = await createPatient(dto);
          navigate(ROUTES.PATIENT_DETAIL.replace(":id", String(created.id)));
        }
      } catch {
        // Error is already set in the store
      }
    },
    [clearError, isEditMode, patientId, updatePatient, createPatient, navigate],
  );

  // Loading state for edit mode
  if (isEditMode && loadingDetail) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="flex items-center gap-2 text-neutral-400">
          <Spinner size="md" />
          <span className="text-sm">Cargando datos del paciente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">
          {isEditMode ? "Editar Paciente" : "Nuevo Paciente"}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {isEditMode
            ? "Modifique los datos del paciente"
            : "Registre un nuevo paciente en el sistema"}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Historia Clínica + DNI */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Historia Clínica <span className="text-red-500">*</span>
            </label>
            <input
              {...register("historiaClinica")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="001-2024-001"
            />
            {errors.historiaClinica && (
              <p className="mt-1 text-xs text-red-600">{errors.historiaClinica.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              {...register("dni")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={8}
              inputMode="numeric"
              placeholder="12345678"
            />
            {errors.dni && (
              <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p>
            )}
          </div>
        </div>

        {/* Nombres y Apellidos */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Nombres <span className="text-red-500">*</span>
          </label>
          <input
            {...register("nombres")}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Juan"
          />
          {errors.nombres && (
            <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Apellido Paterno <span className="text-red-500">*</span>
            </label>
            <input
              {...register("apellidoPaterno")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pérez"
            />
            {errors.apellidoPaterno && (
              <p className="mt-1 text-xs text-red-600">{errors.apellidoPaterno.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Apellido Materno <span className="text-red-500">*</span>
            </label>
            <input
              {...register("apellidoMaterno")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="García"
            />
            {errors.apellidoMaterno && (
              <p className="mt-1 text-xs text-red-600">{errors.apellidoMaterno.message}</p>
            )}
          </div>
        </div>

        {/* Fecha Nacimiento + Sexo */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Fecha de Nacimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("fechaNacimiento")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.fechaNacimiento && (
              <p className="mt-1 text-xs text-red-600">{errors.fechaNacimiento.message}</p>
            )}
            {edadPreview && (
              <p className="mt-1 text-xs text-neutral-500">Edad estimada: {edadPreview}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Sexo <span className="text-red-500">*</span>
            </label>
            <select
              {...register("sexo")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              {sexoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.sexo && (
              <p className="mt-1 text-xs text-red-600">{errors.sexo.message}</p>
            )}
          </div>
        </div>

        {/* Centro Poblado */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Centro Poblado <span className="text-red-500">*</span>
          </label>
          <select
            {...register("centroPobladoId")}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar centro poblado...</option>
            {centrosPoblados.map((cp) => (
              <option key={cp.id} value={String(cp.id)}>
                {cp.nombre} — {cp.distrito}, {cp.provincia}
              </option>
            ))}
          </select>
          {errors.centroPobladoId && (
            <p className="mt-1 text-xs text-red-600">{errors.centroPobladoId.message}</p>
          )}
        </div>

        {/* Apoderado */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Nombre del Apoderado <span className="text-red-500">*</span>
            </label>
            <input
              {...register("nombreApoderado")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="María García"
            />
            {errors.nombreApoderado && (
              <p className="mt-1 text-xs text-red-600">{errors.nombreApoderado.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Celular del Apoderado
            </label>
            <input
              {...register("celularApoderado")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={9}
              inputMode="numeric"
              placeholder="999888777"
            />
            {errors.celularApoderado && (
              <p className="mt-1 text-xs text-red-600">{errors.celularApoderado.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PATIENTS)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || loading ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" />
                Guardando...
              </span>
            ) : isEditMode ? (
              "Actualizar Paciente"
            ) : (
              "Guardar Paciente"
            )}
          </button>
        </div>
    </form>
    </div>
  );
}
