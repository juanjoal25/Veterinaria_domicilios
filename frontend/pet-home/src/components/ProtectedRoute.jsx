import { Navigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

// Componente de carga mientras se verifica la autenticación
const LoadingSpinner = () => (
  <div className="auth-page-container">
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="auth-title">Verificando acceso...</h2>
        <p className="auth-subtitle">Por favor espera un momento</p>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '2rem' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #FFD8C2',
          borderTop: '4px solid #ED7959',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  </div>
);

// Componente de acceso denegado
const AccessDenied = ({ requiredRole }) => (
  <div className="auth-page-container">
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="auth-title">Acceso Denegado</h2>
        <p className="auth-subtitle">
          No tienes permisos para acceder a esta sección
        </p>
      </div>
      <div className="error-message">
        <span>Se requiere rol: {requiredRole}</span>
      </div>
      <div className="auth-footer">
        <button
          onClick={() => window.history.back()}
          className="btn-primary w-full"
        >
          Volver atrás
        </button>
      </div>
    </div>
  </div>
);

// Componente principal de protección de rutas
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  redirectTo = "/login" 
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  // Mostrar spinner mientras carga
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si se requiere un rol específico, verificarlo
  if (requiredRole && !hasRole(requiredRole)) {
    return <AccessDenied requiredRole={requiredRole} />;
  }

  // Si todo está bien, renderizar los children
  return children;
};

export default ProtectedRoute;