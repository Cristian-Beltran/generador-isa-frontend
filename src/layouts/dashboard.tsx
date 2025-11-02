// DashboardLayout.tsx — sin cambios funcionales, ajuste leve de fondos
import type React from "react";
import { useState } from "react";
import BaseLayout from "./base";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BaseLayout showThemeToggle={false}>
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </BaseLayout>
  );
};

export default DashboardLayout;
