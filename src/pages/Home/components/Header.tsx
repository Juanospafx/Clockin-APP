// src/pages/Home/components/Header.tsx
import React from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center px-4 lg:px-16 h-16">
        {/** 1) Botón hamburguesa en móvil (< lg) */}
        <button
          className="lg:hidden mr-4 p-2 rounded hover:bg-gray-100"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        {/** 2) Título principal */}
        <h1 className="text-2xl font-bold text-gray-800">BrightClock</h1>

        {/** 3) Espaciador para empujar contenido a la derecha si se necesita */}
        <div className="flex-1" />

        {/** 4) (Opcional) Aquí podrías poner botones de usuario o configuración
            <button className="p-2 rounded hover:bg-gray-100">
              <CogIcon className="w-6 h-6 text-gray-700" />
            </button>
        **/}
      </div>
    </header>
  );
};

export default Header;
