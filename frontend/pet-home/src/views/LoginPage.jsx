// Importamos los hooks y componentes necesarios de React
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
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
    const { login } = useAuth();
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

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                // Redirigir al dashboard si el inicio de sesión es exitoso
                navigate("/dashboard");
            }
        } catch (err) {
            // Manejar errores de inicio de sesión
            setError('Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            // Desactivar el estado de carga
            setLoading(false);
        }
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
                        <label className="form-label">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="form-input"
                            placeholder="••••••••"
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
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-link-text">
                        ¿No tienes cuenta?{' '}
                        <button
                            onClick={() => navigate("/register")}
                            className="auth-link"
                        >
                            Regístrate aquí
                        </button>
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="back-link"
                    >
                        ← Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;