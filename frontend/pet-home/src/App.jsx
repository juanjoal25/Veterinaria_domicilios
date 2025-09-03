import { useState, useEffect } from 'react'
import './App.css'
import { AuthProvider} from "./context/AuthContext";
import AppRoutes from "./routes";

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: "#F5EDE3" }}>
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

export default App
