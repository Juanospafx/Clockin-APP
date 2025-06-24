// src/pages/Home/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import SummaryCards from "./components/SummaryCards";
import Chart from "./components/Chart";
import UserMap from "./components/UserMap";
import { getMe } from "../../lib/users";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Si no hay token válido, redirigimos a login
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      getMe(token)
        .then(({ data }) => setIsAdmin(data.role === "admin"))
        .catch(() => setIsAdmin(false));
    }
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/** 1) Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/** 2) Contenido principal: ocupa el resto de la pantalla */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/** 2a) Header sticky arriba */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/** 2b) Área scrollable de contenido, con fondo blanco */}
        <main className="flex-1 overflow-auto bg-white">
          {/** 2b.1) Resumen de horas */}
          <SummaryCards />

          {/** 2b.2) Gráfico de barras */}
          <Chart />
          {isAdmin && <UserMap />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
