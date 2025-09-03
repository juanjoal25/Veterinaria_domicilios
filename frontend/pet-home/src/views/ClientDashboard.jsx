import { useState } from 'react';
import { useNavigate } from "react-router-dom";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Cliente</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      </header>
      <main>
        <h2 className="text-xl mb-4">Bienvenido, {user.name}</h2>
        <p>Aquí puedes gestionar tus citas y ver el historial de tus mascotas.</p>
      </main>
    </div>
  );
}

export default ClientDashboard;