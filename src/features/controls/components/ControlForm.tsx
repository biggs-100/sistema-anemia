import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateControl } from "@/hooks/useControls";
import { classifyHemoglobina, getColorForClassification, getLabelForClassification } from "@/utils/classification";
import type { Control } from "@/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const controlSchema = z.object({
  fechaControl: z.string().min(1, "Fecha es requerida"),
  peso: z.coerce.number().positive("Debe ser mayor a 0"),
  talla: z.coerce.number().positive("Debe ser mayor a 0"),
  hemoglobina: z.coerce
    .number()
    .min(0, "Mínimo 0")
    .max(25, "Máximo 25"),
  temperatura: z.coerce.number().optional(),
  observaciones: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional(),
});

type ControlFormData = z.infer<typeof controlSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ControlFormProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: number;
  onSuccess: (control: Control) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ControlForm({
  isOpen,
  onClose,
  pacienteId,
  onSuccess,
}: ControlFormProps) {
  const { createControl, loading, error, clearError } = useCreateControl();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<ControlFormData>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      fechaControl: new Date().toISOString().split("T")[0],
      peso: undefined,
      talla: undefined,
      hemoglobina: undefined,
      temperatura: undefined,
      observaciones: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        fechaControl: new Date().toISOString().split("T")[0],
        peso: undefined,
        talla: undefined,
        hemoglobina: undefined,
        temperatura: undefined,
        observaciones: "",
      });
      clearError();
    }
  }, [isOpen, reset, clearError]);

  // Real-time classification preview
  const hemoglobinaValue = watch("hemoglobina");
  const classificationPreview = useMemo(() => {
    if (hemoglobinaValue === undefined || isNaN(hemoglobinaValue)) return null;
    const level = classifyHemoglobina(hemoglobinaValue);
    return {
      level,
      label: getLabelForClassification(level),
      color: getColorForClassification(level),
    };
  }, [hemoglobinaValue]);

  const onSubmit = async (data: ControlFormData) => {
    try {
      const dto = {
        pacienteId,
        fechaControl: data.fechaControl,
        peso: data.peso,
        talla: data.talla,
        hemoglobina: data.hemoglobina,
        temperatura: data.temperatura || undefined,
        observaciones: data.observaciones || undefined,
      };
      const control = await createControl(dto);
      onSuccess(control);
      onClose();
    } catch {
      // error is already set in the store / hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            Nuevo Control
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Fecha de Control <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("fechaControl")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.fechaControl && (
              <p className="mt-1 text-xs text-red-600">
                {errors.fechaControl.message}
              </p>
            )}
          </div>

          {/* Peso + Talla */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Peso (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("peso")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12.50"
              />
              {errors.peso && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.peso.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Talla (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("talla")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="85.00"
              />
              {errors.talla && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.talla.message}
                </p>
              )}
            </div>
          </div>

          {/* Hemoglobina + Temperatura */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Hemoglobina (g/dL) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                {...register("hemoglobina")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="11.5"
              />
              {errors.hemoglobina && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.hemoglobina.message}
                </p>
              )}

              {/* Real-time classification preview */}
              {classificationPreview && (
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classificationPreview.color}`}
                >
                  {classificationPreview.label}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Temperatura (°C)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("temperatura")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="36.5"
              />
              {errors.temperatura && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.temperatura.message}
                </p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Observaciones
            </label>
            <textarea
              {...register("observaciones")}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales..."
            />
            {errors.observaciones && (
              <p className="mt-1 text-xs text-red-600">
                {errors.observaciones.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || loading}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  Guardando...
                </span>
              ) : (
                "Guardar Control"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
