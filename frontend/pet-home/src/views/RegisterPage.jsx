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

// Componente para la página de registro
const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    // Estado para manejar los datos del formulario
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    // Estado para manejar mensajes de error y el estado de carga
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Función que maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validación de contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            const result = await register(formData);
            if (result.success) {
                alert('¡Registro exitoso! Revisa tu email para verificar tu cuenta.');
                // Redirigir al dashboard si el registro es exitoso
                navigate("/dashboard");
            }
        } catch (err) {
            // Manejar errores de registro
            setError('Error al crear la cuenta. Intenta nuevamente.');
        } finally {
            // Desactivar el estado de carga
            setLoading(false);
        }
    };

    return (
        // Contenedor principal de la página de registro
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    {/* Usamos el logo SVG importado */}
                    <img src={PetHomeLogo} alt="PetHome Logo" className="auth-logo" />
                    <h2 className="auth-title">
                        Crea tu cuenta
                    </h2>
                    <p className="auth-subtitle">Únete a la familia PetHome</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="form-input"
                            placeholder="Juan Pérez"
                        />
                    </div>

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
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="form-input"
                            placeholder="3001234567"
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
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="form-input"
                            placeholder="Repite tu contraseña"
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
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-link-text">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            onClick={() => navigate("/login")}
                            className="auth-link"
                        >
                            Inicia sesión
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

export default RegisterPage;