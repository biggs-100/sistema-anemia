import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserStore } from "@/stores/userStore";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const userSchema = z.object({
  usuario: z.string().min(3, "Usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  nombres: z.string().min(1, "Nombres es requerido"),
  apellidos: z.string().min(1, "Apellidos es requerido"),
  rolId: z.coerce.number().min(1, "Rol es requerido"),
});

type UserFormData = z.infer<typeof userSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Supervisor" },
  { id: 3, nombre: "Operador" },
  { id: 4, nombre: "Consulta" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserForm({ isOpen, onClose, onSuccess }: UserFormProps) {
  const { createUser, loading, error, clearError } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      usuario: "",
      password: "",
      nombres: "",
      apellidos: "",
      rolId: 3,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        usuario: "",
        password: "",
        nombres: "",
        apellidos: "",
        rolId: 3,
      });
      clearError();
    }
  }, [isOpen, reset, clearError]);

  const onSubmit = async (data: UserFormData) => {
    try {
      await createUser({
        usuario: data.usuario,
        password: data.password,
        nombres: data.nombres,
        apellidos: data.apellidos,
        rolId: data.rolId,
      });
      onSuccess();
      onClose();
    } catch {
      // error is already set in the store
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Nuevo Usuario</h3>
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
          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("usuario")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="usuario"
            />
            {errors.usuario && (
              <p className="mt-1 text-xs text-red-600">{errors.usuario.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...register("password")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Nombres */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Nombres <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("nombres")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombres"
            />
            {errors.nombres && (
              <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("apellidos")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Apellidos"
            />
            {errors.apellidos && (
              <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              {...register("rolId")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
            {errors.rolId && (
              <p className="mt-1 text-xs text-red-600">{errors.rolId.message}</p>
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
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar Usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
