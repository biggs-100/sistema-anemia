import { useAuthStore } from "@/stores/authStore";

export default function Header() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-neutral-900">
        Sistema de Seguimiento de Niños Tratados por Anemia
      </h1>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-neutral-600">
            {user.nombres} {user.apellidos}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
