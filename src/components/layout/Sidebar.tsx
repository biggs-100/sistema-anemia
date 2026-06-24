import { NavLink } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: ROUTES.DASHBOARD, label: "Dashboard", icon: "📊" },
  { path: ROUTES.PATIENTS, label: "Pacientes", icon: "👥" },
  { path: ROUTES.CONTROLS, label: "Controles", icon: "🩺" },
  { path: ROUTES.TREATMENTS, label: "Tratamientos", icon: "💊" },
  { path: ROUTES.REPORTS, label: "Reportes", icon: "📄" },
  { path: ROUTES.ALERTS, label: "Alertas", icon: "🔔" },
  { path: ROUTES.USERS, label: "Usuarios", icon: "🔐" },
  { path: ROUTES.SETTINGS, label: "Configuración", icon: "⚙️" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo / Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
        {!collapsed && (
          <span className="text-sm font-bold text-blue-600">Sistema Anemia</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
