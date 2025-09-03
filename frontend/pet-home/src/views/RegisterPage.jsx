// src/pages/RegisterPage.jsx
// Importamos los hooks y componentes necesarios de React
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
// Importamos los íconos necesarios de lucide-react
import { AlertCircle, CheckCircle } from 'lucide-react';

// Importamos el archivo de estilos central
import '../App.css';

// Importamos el logo SVG directamente
import PetHomeLogo from '/PetHomeLogo.svg';

// Componente para la página de registro
const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, loading: authLoading } = useAuth();
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
    const [successMessage, setSuccessMessage] = useState('');

    // Función de validación del formulario
    const validateForm = () => {
        // Validar nombre
        if (!formData.name.trim()) {
            return 'El nombre es requerido';
        }
        if (formData.name.trim().length < 2) {
            return 'El nombre debe tener al menos 2 caracteres';
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return 'Por favor ingresa un email válido';
        }

        // Validar teléfono
        if (!formData.phone.trim()) {
            return 'El teléfono es requerido';
        }
        if (formData.phone.trim().length < 10) {
            return 'El teléfono debe tener al menos 10 dígitos';
        }

        // Validar contraseña
        if (formData.password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        if (!/(?=.*[a-z])/.test(formData.password)) {
            return 'La contraseña debe contener al menos una letra minúscula';
        }
        if (!/(?=.*[A-Z])/.test(formData.password)) {
            return 'La contraseña debe contener al menos una letra mayúscula';
        }
        if (!/(?=.*\d)/.test(formData.password)) {
            return 'La contraseña debe contener al menos un número';
        }

        // Validar confirmación de contraseña
        if (formData.password !== formData.confirmPassword) {
            return 'Las contraseñas no coinciden';
        }

        return null;
    };

    // Función que maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validar formulario
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const result = await register({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                password: formData.password
            });

            if (result.success) {
                setSuccessMessage(
                    '¡Registro exitoso! Te hemos enviado un email de confirmación. ' +
                    'Por favor revisa tu bandeja de entrada y confirma tu cuenta para poder iniciar sesión.'
                );
                
                // Limpiar el formulario
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: ''
                });

                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                // Manejar errores específicos de Supabase
                let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
                
                if (result.error) {
                    if (result.error.includes('User already registered')) {
                        errorMessage = 'Ya existe una cuenta con este email';
                    } else if (result.error.includes('Password should be')) {
                        errorMessage = 'La contraseña no cumple con los requisitos mínimos';
                    } else if (result.error.includes('Invalid email')) {
                        errorMessage = 'El email ingresado no es válido';
                    } else {
                        errorMessage = result.error;
                    }
                }
                
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Error inesperado en registro:', err);
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
        // Limpiar mensajes cuando el usuario empiece a escribir
        if (error) setError('');
        if (successMessage) setSuccessMessage('');
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
                        <label htmlFor="name" className="form-label">
                            Nombre completo
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Juan Pérez"
                            disabled={loading || authLoading}
                        />
                    </div>

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
                        <label htmlFor="phone" className="form-label">
                            Teléfono
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="3001234567"
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
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Mínimo 8 caracteres"
                            disabled={loading || authLoading}
                        />
                        <small style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                            Debe contener al menos: 8 caracteres, 1 mayúscula, 1 minúscula y 1 número
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirmar contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Repite tu contraseña"
                            disabled={loading || authLoading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle className="error-icon" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.95rem'
                        }}>
                            <CheckCircle style={{ height: '1.1rem', width: '1.1rem', marginRight: '0.5rem' }} />
                            {successMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || authLoading}
                        className={`btn-primary w-full ${(loading || authLoading) ? 'disabled' : ''}`}
                    >
                        {loading || authLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-link-text">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="auth-link"
                            disabled={loading || authLoading}
                        >
                            Inicia sesión
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

export default RegisterPage;