// Header.tsx — NeuroStim
import type React from "react";
import { Menu, Brain, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/auth/useAuth";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Marca */}
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 grid place-items-center rounded-xl border bg-card">
              <Brain className="h-5 w-5 text-primary" />
              <span
                className="absolute -inset-0.5 rounded-xl bg-primary/10 blur-sm"
                aria-hidden
              />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight">
                NeuroStim Control
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Gestión de sesiones de estimulación
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Estado de sistema (placeholder) */}
          <div className="hidden md:flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Sistema estable</span>
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full grid place-items-center bg-primary text-primary-foreground font-medium">
              {user?.fullname?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-medium">{user?.fullname}</p>
              <p className="text-[11px] text-muted-foreground">
                Operador clínico
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
