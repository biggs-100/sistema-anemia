import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/utils/constants";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  minRole: number; // 1=Admin, 2=Supervisor, 3=Operador, 4=Consulta
}

const allNavItems: NavItem[] = [
  { path: ROUTES.DASHBOARD, label: "Dashboard", icon: "📊", minRole: 4 },
  { path: ROUTES.PATIENTS, label: "Pacientes", icon: "👥", minRole: 4 },
  { path: ROUTES.CONTROLS, label: "Controles", icon: "🩺", minRole: 4 },
  { path: ROUTES.TREATMENTS, label: "Tratamientos", icon: "💊", minRole: 4 },
  { path: ROUTES.REPORTS, label: "Reportes", icon: "📄", minRole: 4 },
  { path: ROUTES.ALERTS, label: "Alertas", icon: "🔔", minRole: 4 },
  { path: ROUTES.USERS, label: "Usuarios", icon: "🔐", minRole: 1 },
  { path: ROUTES.SETTINGS, label: "Configuración", icon: "⚙️", minRole: 1 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.rolId ?? 0;

  // Filter items: users with lower role number (higher privilege) see more items.
  // userRole <= item.minRole means higher-privilege users (lower numbers) pass more filters.
  const visibleItems = allNavItems.filter((item) => userRole <= item.minRole);

  return (
    <aside
      className={`flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-900 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo / Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-700">
        {!collapsed && (
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            Sistema Anemia
          </span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              }`
            }
          >
            <span className="text-lg" role="img" aria-hidden>
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
