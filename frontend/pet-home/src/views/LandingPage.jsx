// Importamos los componentes y hooks necesarios de React
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
// Importamos iconos de lucide-react para los servicios y estrellas de testimonios
import { Home, Utensils, Heart, Stethoscope, Briefcase, PawPrint, Star } from 'lucide-react';

// Importamos el archivo CSS donde se centralizarán los estilos
import '../App.css';

// Importamos el logo SVG directamente
import PetHomeLogo from '/PetHomeLogo.svg'; // Asegúrate de que la ruta sea correcta

// Componente para el encabezado de la página
const Header = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Renderiza el menú de navegación para escritorio y móvil
    return (
        <header className="main-header">
            <div className="container header-container">
                <div className="logo-container">
                    {/* Usamos el logo SVG importado */}
                    <img src={PetHomeLogo} alt="PetHome Logo" className="logo-image" />
                </div>
                {/* Menú de escritorio */}
                <nav className="desktop-nav">
                    <a href="#home">Home</a>
                    <a href="#sobre">Sobre</a>
                    <a href="#servicios">Servicios</a>
                    <button onClick={() => navigate("/register")} className="btn-secondary">Registro</button>
                    <button onClick={() => navigate("/login")} className="btn-primary">Ingresar</button>
                </nav>
                {/* Botón de menú móvil */}
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>
            {/* Menú móvil desplegable */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
                    <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                    <a href="#servicios" onClick={() => setMobileMenuOpen(false)}>Servicios</a>
                    <button onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} className="btn-secondary">Registro</button>
                    <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="btn-primary">Ingresar</button>
                </div>
            )}
        </header>
    );
};

// Componente para la sección principal (Hero)
const Hero = () => {
    const navigate = useNavigate();
    return (
        <section id="home" className="hero-section">
            <div className="container hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Cuidado Veterinario de calidad en la{' '}
                        <span className="primary-text">Comodidad de tu Hogar</span>
                    </h1>
                    <p className="hero-subtitle">
                        Evita el estrés de trasladar a tu mascota. Nuestros vets van a ti.
                    </p>
                    <button onClick={() => navigate("/register")} className="btn-primary">
                        Agendar Cita
                    </button>
                </div>
                <div className="hero-image-container">
                    <img
                        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500"
                        alt="Mascotas felices"
                        className="hero-image"
                    />
                </div>
            </div>
        </section>
    );
};

// Componente para la sección de servicios
const ServicesSection = ({ services }) => (
    <section id="servicios" className="services-section">
        <div className="container">
            <h2 className="section-title">Servicios</h2>
            <div className="services-grid">
                {services.map((service, index) => (
                    <div key={index} className="service-card">
                        <service.icon className="service-icon" />
                        <h3 className="service-title">{service.title}</h3>
                        <p className="service-description">{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// Componente para la sección "Sobre Nosotros"
const AboutUs = () => (
    <section id="sobre" className="about-us-section">
        <div className="container about-us-container">
            <div className="about-us-content">
                <h2 className="section-title">Sobre Nosotros</h2>
                <p>
                    Cuenta la historia de "PetHome" y su misión. Explica por qué eligieron
                    enfocarse en el servicio a domicilio.
                </p>
                <button className="btn-primary">¡Accede ahora!</button>
            </div>
            <div className="about-us-image-container">
                <img
                    src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=500"
                    alt="Veterinario con mascota"
                    className="about-us-image"
                />
            </div>
        </div>
    </section>
);

// Componente para la sección de testimonios
const Testimonials = ({ testimonials }) => (
    <section className="testimonials-section">
        <div className="container">
            <h2 className="section-title">
                Descubre qué piensan los usuarios de Pet<span className="primary-text">Home</span>
            </h2>
            <div className="testimonials-grid">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="testimonial-card">
                        <div className="testimonial-header">
                            {/* Avatar de testimonio, se puede reemplazar con una imagen real */}
                            <div className="testimonial-avatar"></div>
                            <div className="testimonial-info">
                                <h4 className="testimonial-name">{testimonial.name}</h4>
                                <p className="testimonial-role">{testimonial.role}</p>
                            </div>
                        </div>
                        <div className="testimonial-rating">
                            {/* Genera estrellas según el rating */}
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="star-icon" />
                            ))}
                        </div>
                        <p className="testimonial-text">{testimonial.text}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// Componente para la sección del boletín (Newsletter)
const Newsletter = () => {
    const [email, setEmail] = useState('');
    const handleEmailSubmit = (e) => {
        e.preventDefault();
        alert(`¡Gracias por suscribirte! Te enviaremos novedades a ${email}`);
        setEmail('');
    };

    return (
        <section className="newsletter-section">
            <div className="container newsletter-container">
                <div className="newsletter-content">
                    <h2 className="newsletter-title">¡No te pierdas nuestras actualizaciones!</h2>
                    <p className="newsletter-subtitle">
                        Regístrate para recibir novedades, nuevas herramientas, descuentos y actualizaciones.
                    </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="newsletter-form">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Introduce tu email..."
                        required
                        className="newsletter-input"
                    />
                    <button type="submit" className="btn-primary">
                        Suscribirse
                    </button>
                </form>
            </div>
        </section>
    );
};

// Componente para el pie de página
const Footer = () => (
    <footer className="main-footer">
        <div className="container footer-container">
            <div className="footer-logo">
                {/* Usamos el logo SVG importado en el footer */}
                <img src={PetHomeLogo} alt="PetHome Logo" className="logo-image" />
            </div>
            <p className="footer-copyright">
                © 2025 PetHome. Todos los derechos reservados.
            </p>
            <div className="footer-links">
                <a href="#">Política de Privacidad</a>
                <a href="#">Política de Cookies</a>
            </div>
        </div>
    </footer>
);

// Componente principal que une todas las secciones
const LandingPage = () => {
    // Definimos los datos de los servicios
    const services = [
        {
            icon: Home,
            title: "Domicilio",
            description: "Atención veterinaria en la comodidad de tu hogar."
        },
        {
            icon: Utensils,
            title: "Alimentación",
            description: "Asesoramiento nutricional y planes de dieta personalizados."
        },
        {
            icon: Heart,
            title: "Adopción",
            description: "Ayudamos a encontrar un hogar para mascotas necesitadas."
        },
        {
            icon: Stethoscope,
            title: "Salud",
            description: "Chequeos, vacunas y tratamientos preventivos."
        },
        {
            icon: Briefcase,
            title: "Cuidados",
            description: "Consejos y guías para el cuidado diario de tu mascota."
        },
        {
            icon: PawPrint,
            title: "Adiestramiento",
            description: "Entrenamiento básico y avanzado para un mejor comportamiento."
        },
    ];

    // Definimos los datos de los testimonios
    const testimonials = [
        {
            name: "Carlos Santana",
            role: "Dueño de Max",
            rating: 5,
            text: "¡PetHome es increíble! La atención a domicilio ha sido un salvavidas para mi perro Max. Los veterinarios son muy profesionales y cariñosos. Totalmente recomendados."
        },
        {
            name: "Andrea Lima",
            role: "Dueña de Misu",
            rating: 4,
            text: "Estoy muy contenta con el servicio de PetHome. Mi gata Misu se estresa mucho al salir y que el veterinario venga a casa es lo mejor. Solo un pequeño detalle en la puntualidad, pero nada grave."
        },
        {
            name: "Regina Buenos",
            role: "Mamá de 2 perros",
            rating: 5,
            text: "Necesitaba un servicio que se adaptara a mis horarios y PetHome lo tiene. Mis dos perros reciben una excelente atención y el seguimiento post-consulta es genial. ¡Cinco estrellas!"
        },
    ];

    return (
        <div className="app-container">
            <Header />
            <Hero />
            <ServicesSection services={services} />
            <AboutUs />
            <Testimonials testimonials={testimonials} />
            <Newsletter />
            <Footer />
        </div>
    );
};

export default LandingPage;