// src/pages/LoginPage.jsx
// Importamos los hooks y componentes necesarios de React
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
// Importamos los íconos necesarios de lucide-react
import { AlertCircle } from 'lucide-react';

// Importamos el archivo de estilos central
import '../App.css';

// Importamos el logo SVG directamente
import PetHomeLogo from '/PetHomeLogo.svg';

// Componente para la página de inicio de sesión
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading: authLoading } = useAuth();
    // Estado para manejar los datos del formulario
    const [formData, setFormData] = useState({ email: '', password: '' });
    // Estado para manejar mensajes de error y el estado de carga
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Función que maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validaciones básicas
        if (!formData.email.trim()) {
            setError('El email es requerido');
            setLoading(false);
            return;
        }

        if (!formData.password.trim()) {
            setError('La contraseña es requerida');
            setLoading(false);
            return;
        }

        try {
            const result = await login(formData.email.trim(), formData.password);
            
            if (result.success) {
                // Redirigir al dashboard si el inicio de sesión es exitoso
                navigate("/dashboard", { replace: true });
            } else {
                // Manejar errores específicos de Supabase
                let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
                
                if (result.error) {
                    if (result.error.includes('Invalid login credentials')) {
                        errorMessage = 'Email o contraseña incorrectos';
                    } else if (result.error.includes('Email not confirmed')) {
                        errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
                    } else if (result.error.includes('Too many requests')) {
                        errorMessage = 'Demasiados intentos. Intenta nuevamente más tarde';
                    } else {
                        errorMessage = result.error;
                    }
                }
                
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Error inesperado en login:', err);
            setError('Error inesperado. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Función para manejar el cambio en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError('');
    };

    return (
        // Contenedor principal de la página de inicio de sesión
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    {/* Usamos el logo SVG importado */}
                    <img src={PetHomeLogo} alt="PetHome Logo" className="auth-logo" />
                    <h2 className="auth-title">
                        Bienvenido de vuelta
                    </h2>
                    <p className="auth-subtitle">Ingresa a tu cuenta de PetHome</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="tu@email.com"
                            disabled={loading || authLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="••••••••"
                            disabled={loading || authLoading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle className="error-icon" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || authLoading}
                        className={`btn-primary w-full ${(loading || authLoading) ? 'disabled' : ''}`}
                    >
                        {loading || authLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-link-text">
                        ¿No tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate("/register")}
                            className="auth-link"
                            disabled={loading || authLoading}
                        >
                            Regístrate aquí
                        </button>
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="back-link"
                        disabled={loading || authLoading}
                    >
                        ← Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;