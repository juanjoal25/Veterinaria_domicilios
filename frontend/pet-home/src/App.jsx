// src/App.jsx
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from "./context/AuthContext";
import AppRoutes from "./routes";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen" style={{ backgroundColor: "#F5EDE3" }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;