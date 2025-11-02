// Sidebar.tsx — NeuroStim
import type React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  LogOut,
  X,
  Moon,
  Sun,
  Home,
  UsersRound,
  User,
  Cpu,
  WavesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { useAuthStore } from "@/auth/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { name: "Panel", href: "/", icon: Home },
  { name: "Doctores", href: "/doctor", icon: UsersRound },
  { name: "Pacientes", href: "/patients", icon: User },
  { name: "Sesiones", href: "/monitoring", icon: WavesIcon },
  { name: "Dispositivos", href: "/devices", icon: Cpu },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-68 bg-gradient-to-b from-background to-muted/40 border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand header */}
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 grid place-items-center rounded-xl border bg-card shadow-sm">
                  <WavesIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    NeuroStim
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Control Center
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {/* Active rail */}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r",
                      isActive ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-3">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start gap-3"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
            </Button>

            {user && (
              <div className="px-3 py-2 rounded-xl border bg-card/60">
                <p className="text-sm font-medium">{user.fullname}</p>
                <p className="text-xs text-muted-foreground">
                  Operador registrado
                </p>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
