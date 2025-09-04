import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [pets, setPets] = useState([]);
  const [exams, setExams] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Cargar mascotas del usuario
  const loadPets = async () => {
    try {
      if (!user?.id) {
        console.log('No hay usuario autenticado, saltando carga de mascotas');
        return;
      }

      setPetsLoading(true);
      console.log('Cargando mascotas para usuario:', user.id);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error cargando mascotas:', error);
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setPets([]);
        return;
      }
      
      console.log('Mascotas cargadas exitosamente:', data);
      setPets(data || []);
    } catch (error) {
      console.error('Error en loadPets:', error);
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  // Cargar exámenes de las citas del usuario
  const loadExams = async () => {
    try {
      // Solo cargar exámenes si hay citas
      if (appointments.length === 0) {
        setExams([]);
        return;
      }

      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          appointments(
            pets(name, species)
          )
        `)
        .in('appointment_id', appointments.map(apt => apt.id));
      
      if (error) {
        console.error('Error cargando exámenes:', error);
        return;
      }
      
      setExams(data || []);
    } catch (error) {
      console.error('Error en loadExams:', error);
    }
  };

  // Cargar servicios disponibles
  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error cargando servicios:', error);
        return;
      }
      
      setServices(data || []);
    } catch (error) {
      console.error('Error en loadServices:', error);
    }
  };

  // Cargar citas del usuario
  const loadAppointments = async () => {
    try {
      if (!user?.id) {
        console.log('No hay usuario autenticado, saltando carga de citas');
        return;
      }

      console.log('Cargando citas para usuario:', user.id);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          pets(name, species),
          services(name)
        `)
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      
      if (error) {
        console.error('Error cargando citas:', error);
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setAppointments([]);
        return;
      }
      
      console.log('Citas cargadas exitosamente:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error en loadAppointments:', error);
      setAppointments([]);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadPets();
      loadAppointments();
      loadServices();
    }
  }, [user?.id]);

  useEffect(() => {
    if (appointments.length > 0) {
      loadExams();
    }
  }, [appointments]);

  // Función para mostrar mensajes
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el color del estado de la cita
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  // Función para obtener el texto del estado de la cita
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return 'Pendiente';
    }
  };

  // Componente para el formulario de citas
  const AppointmentForm = ({ pets, onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
      pet_id: '',
      service_id: '',
      scheduled_at: '',
      notes: '',
      status: 'pending'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Validar que se seleccionó una mascota
        if (!formData.pet_id) {
          onError('Por favor selecciona una mascota');
          return;
        }

        if (!formData.service_id) {
          onError('Por favor selecciona un servicio');
          return;
        }

        if (!formData.scheduled_at) {
          onError('Por favor selecciona una fecha y hora');
          return;
        }

        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            pet_id: formData.pet_id,
            user_id: user.id,
            service_id: formData.service_id,
            scheduled_at: formData.scheduled_at,
            notes: formData.notes,
            status: 'pending'
          }]);

        if (error) {
          onError('Error al agendar la cita: ' + error.message);
          return;
        }

        onSuccess('¡Cita agendada exitosamente!');
        loadAppointments(); // Recargar la lista de citas
      } catch (error) {
        onError('Error inesperado al agendar la cita');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">
            Seleccionar Mascota *
          </label>
          <select 
            required
            value={formData.pet_id}
            onChange={(e) => setFormData({...formData, pet_id: e.target.value})}
            className="form-input"
          >
            <option value="">Selecciona una mascota</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>
                {pet.name} - {pet.species}
              </option>
            ))}
          </select>
        </div>
        
                <div className="form-group">
          <label className="form-label">
            Servicio *
          </label>
          <select 
            required
            value={formData.service_id}
            onChange={(e) => setFormData({...formData, service_id: e.target.value})}
            className="form-input"
          >
            <option value="">Selecciona un servicio</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - ${(service.base_price_cents / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Fecha y Hora *
          </label>
          <input 
            type="datetime-local" 
            required
            value={formData.scheduled_at}
            onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
            min={new Date().toISOString().slice(0, 16)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Motivo de la Consulta
          </label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="form-input form-textarea"
            rows="3"
            placeholder="Describe brevemente el motivo de la consulta..."
          />
        </div>
        
        <div className="form-buttons">
          <button 
            type="button"
            onClick={onClose}
            className="form-btn form-btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="form-btn form-btn-primary"
          >
            {loading ? 'Agendando...' : 'Agendar Cita'}
          </button>
        </div>
      </form>
    );
  };

  // Componente para el formulario de mascotas
  const PetForm = ({ onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
      name: '',
      species: 'Perro',
      breed: '',
      birthdate: '',
      weight_kg: '',
      sex: 'Macho',
      notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Validar campos requeridos
        if (!formData.name.trim()) {
          onError('El nombre de la mascota es requerido');
          return;
        }

        if (!formData.species.trim()) {
          onError('La especie es requerida');
          return;
        }

        if (!user?.id) {
          onError('Usuario no autenticado');
          return;
        }

        // Preparar datos para envío - solo campos esenciales primero
        const petData = {
          name: formData.name.trim(),
          species: formData.species.trim(),
          user_id: user.id
        };

        // Agregar campos opcionales solo si tienen valor
        if (formData.breed.trim()) {
          petData.breed = formData.breed.trim();
        }
        if (formData.birthdate) {
          petData.birthdate = formData.birthdate;
        }
        if (formData.weight_kg) {
          petData.weight_kg = parseFloat(formData.weight_kg);
        }
        if (formData.sex.trim()) {
          petData.sex = formData.sex.trim();
        }
        if (formData.notes.trim()) {
          petData.notes = formData.notes.trim();
        }

        console.log('Enviando datos de mascota:', petData);

        const { data, error } = await supabase
          .from('pets')
          .insert([petData]);

        if (error) {
          console.error('Error detallado al crear mascota:', error);
          onError('Error al registrar la mascota: ' + error.message);
          return;
        }

        console.log('Mascota creada exitosamente:', data);
        onSuccess('¡Mascota registrada exitosamente!');
        loadPets(); // Recargar la lista de mascotas
      } catch (error) {
        console.error('Error inesperado al registrar la mascota:', error);
        onError('Error inesperado al registrar la mascota');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">
            Nombre de la Mascota *
          </label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="form-input"
            placeholder="Ej: Max, Luna, etc."
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Especie *
            </label>
            <select 
              required
              value={formData.species}
              onChange={(e) => setFormData({...formData, species: e.target.value})}
              className="form-input"
            >
              <option>Perro</option>
              <option>Gato</option>
              <option>Conejo</option>
              <option>Ave</option>
              <option>Otro</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Género
            </label>
            <select 
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className="form-input"
            >
              <option>Macho</option>
              <option>Hembra</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Raza
          </label>
          <input 
            type="text" 
            value={formData.breed}
            onChange={(e) => setFormData({...formData, breed: e.target.value})}
            className="form-input"
            placeholder="Ej: Pastor Alemán, Persa, etc."
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Fecha de Nacimiento
            </label>
            <input 
              type="date" 
              value={formData.birthdate}
              onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Peso (kg)
            </label>
            <input 
              type="number" 
              min="0"
              step="0.1"
              value={formData.weight_kg}
              onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
              className="form-input"
              placeholder="Ej: 25.5"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Sexo
          </label>
          <select 
            required
            value={formData.sex}
            onChange={(e) => setFormData({...formData, sex: e.target.value})}
            className="form-input"
          >
            <option>Macho</option>
            <option>Hembra</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Notas
          </label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="form-input form-textarea"
            rows="3"
            placeholder="Alergias, medicamentos, condiciones especiales..."
          />
        </div>
        
        <div className="form-buttons">
          <button 
            type="button"
            onClick={onClose}
            className="form-btn form-btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="form-btn form-btn-primary"
          >
            {loading ? 'Registrando...' : 'Registrar Mascota'}
          </button>
        </div>
      </form>
    );
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button 
              onClick={onClose}
              className="modal-close-btn"
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Vista del Dashboard Principal
  const DashboardView = () => (
    <div>
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1>Bienvenido de vuelta, {user?.name} 👋</h1>
        <p>Gestiona el cuidado de tus mascotas desde la comodidad de tu hogar. Aquí encontrarás todas las herramientas para mantener la salud de tus compañeros peludos al día.</p>
      </section>

      {/* Dashboard Grid - Top Row */}
      <section className="dashboard-grid-top">
        <div className="dashboard-card" onClick={() => setShowPetModal(true)}>
          <div className="card-icon">🐕</div>
          <h3>Registrar Mascota</h3>
          <p>Añade una nueva mascota a tu perfil con toda su información básica y médica</p>
          <button className="card-button">Registrar Nueva</button>
        </div>

        <div className="dashboard-card" onClick={() => setShowAppointmentModal(true)}>
          <div className="card-icon">📅</div>
          <h3>Agendar Cita</h3>
          <p>Programa una consulta veterinaria para el cuidado preventivo o tratamiento de tu mascota</p>
          <button className="card-button">Agendar Ahora</button>
        </div>

        <div className="dashboard-card" onClick={() => setShowExamModal(true)}>
          <div className="card-icon">🔬</div>
          <h3>Consultar Exámenes</h3>
          <p>Revisa los resultados de laboratorio y estudios médicos de todas tus mascotas</p>
          <button className="card-button">Ver Resultados</button>
        </div>
      </section>

      {/* Dashboard Grid - Bottom Row */}
      <section className="dashboard-grid-bottom">
        <div className="dashboard-card" onClick={() => setActiveView('pets')}>
          <div className="card-icon">🐾</div>
          <h3>Mis Mascotas</h3>
          <p>Ver todas tus mascotas registradas y gestionar su información</p>
          <button className="card-button">Ver Mascotas</button>
        </div>

        <div className="dashboard-card" onClick={() => setActiveView('appointments')}>
          <div className="card-icon">📅</div>
          <h3>Mis Citas</h3>
          <p>Gestiona tus citas veterinarias programadas</p>
          <button className="card-button">Ver Citas</button>
        </div>

        <div className="dashboard-card" onClick={() => setActiveView('exams')}>
          <div className="card-icon">🔬</div>
          <h3>Mis Exámenes</h3>
          <p>Consulta los resultados de exámenes de tus mascotas</p>
          <button className="card-button">Ver Exámenes</button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <h2>Resumen de tus Mascotas</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{pets.length}</div>
            <div className="stat-label">Mascotas Registradas</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{appointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length}</div>
            <div className="stat-label">Citas Próximas</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{exams.length}</div>
            <div className="stat-label">Exámenes Pendientes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">1</div>
            <div className="stat-label">Años con PetH</div>
          </div>
        </div>
      </section>

      {/* Activity Section */}
      <section className="activity-section">
        <h2>Actividad Reciente</h2>
        {appointments.length > 0 ? (
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <h4>Última cita agendada</h4>
              <p>{appointments[0].services?.name} - {formatDateTime(appointments[0].scheduled_at)}</p>
            </div>
          </div>
        ) : (
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <h4>No hay citas agendadas</h4>
              <p>Agenda tu primera cita veterinaria</p>
            </div>
          </div>
        )}
        <div className="activity-item">
          <div className="activity-icon">🔬</div>
          <div className="activity-content">
            <h4>Resultados disponibles</h4>
            <p>Exámenes de laboratorio - {exams.length} registros</p>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon">🐕</div>
          <div className="activity-content">
            <h4>Mascotas registradas</h4>
            <p>Total de mascotas en el sistema: {pets.length}</p>
          </div>
        </div>
      </section>
    </div>
  );

  // Vista de Mascotas
  const PetsView = () => (
    <div className="admin-view">
      <div className="view-header">
        <h2>Mis Mascotas</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowPetModal(true)}
        >
          ➕ Nueva Mascota
        </button>
      </div>
      
      {petsLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando mascotas...</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐕</div>
          <h3>No tienes mascotas registradas</h3>
          <p>Registra tu primera mascota para comenzar a cuidar de ella</p>
          <button 
            className="btn-primary"
            onClick={() => setShowPetModal(true)}
          >
            Registrar Primera Mascota
          </button>
        </div>
      ) : (
        <div className="pets-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-header">
                <div className="pet-avatar">
                  {pet.species === 'Perro' ? '🐕' : pet.species === 'Gato' ? '🐱' : '🐾'}
                </div>
                <div className="pet-info">
                  <h3>{pet.name}</h3>
                  <p>{pet.species}</p>
                </div>
                <div className="pet-status">
                  <span className="status-badge status-active">Activa</span>
                </div>
              </div>
              
              <div className="pet-details">
                {pet.breed && (
                  <div className="detail-item">
                    <span className="detail-label">Raza</span>
                    <span className="detail-value">{pet.breed}</span>
                  </div>
                )}
                {pet.birthdate && (
                  <div className="detail-item">
                    <span className="detail-label">Edad</span>
                    <span className="detail-value">
                      {Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))} años
                    </span>
                  </div>
                )}
                {pet.weight_kg && (
                  <div className="detail-item">
                    <span className="detail-label">Peso</span>
                    <span className="detail-value">{pet.weight_kg} kg</span>
                  </div>
                )}
                {pet.sex && (
                  <div className="detail-item">
                    <span className="detail-label">Sexo</span>
                    <span className="detail-value">{pet.sex}</span>
                  </div>
                )}
              </div>
              
              {pet.notes && (
                <div className="pet-notes">
                  <strong>Notas:</strong> {pet.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista de Citas
  const AppointmentsView = () => (
    <div className="admin-view">
      <div className="view-header">
        <h2>Mis Citas</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAppointmentModal(true)}
        >
          📅 Agendar Nueva Cita
        </button>
      </div>
      
      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No tienes citas agendadas</h3>
          <p>Agenda tu primera cita veterinaria para comenzar a cuidar de tu mascota</p>
          <button 
            className="btn-primary"
            onClick={() => setShowAppointmentModal(true)}
          >
            Agendar Primera Cita
          </button>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-icon">
                  📅
                </div>
                <div className="appointment-info">
                  <h3>{appointment.services?.name}</h3>
                  <p>{appointment.pets?.name} ({appointment.pets?.species})</p>
                </div>
                <div className="appointment-status">
                  <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>
              
              <div className="appointment-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Fecha y Hora</span>
                  <span className="detail-value">{formatDateTime(appointment.scheduled_at)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🐾 Mascota</span>
                  <span className="detail-value">{appointment.pets?.name} ({appointment.pets?.species})</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🩺 Servicio</span>
                  <span className="detail-value">{appointment.services?.name}</span>
                </div>
              </div>
              
              {appointment.notes && (
                <div className="appointment-notes">
                  <strong>Notas:</strong> {appointment.notes}
                </div>
              )}
              
              <div className="appointment-actions">
                <button 
                  className="btn-payment"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowPaymentModal(true);
                  }}
                >
                  💳 Pagar Cita
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista de Exámenes
  const ExamsView = () => (
    <div className="admin-view">
      <div className="view-header">
        <h2>Mis Exámenes</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowExamModal(true)}
        >
          🔬 Ver Todos los Exámenes
        </button>
      </div>
      
      {exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <h3>No hay exámenes disponibles</h3>
          <p>Los resultados de exámenes de tus mascotas aparecerán aquí cuando estén disponibles</p>
          <button 
            className="btn-primary"
            onClick={() => setShowExamModal(true)}
          >
            Ver Exámenes
          </button>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-header">
                <div className="exam-icon">
                  🔬
                </div>
                <div className="exam-info">
                  <h3>{exam.type}</h3>
                  <p>{exam.appointments?.pets?.name} ({exam.appointments?.pets?.species})</p>
                </div>
                <div className="exam-status">
                  <span className={`status-badge ${exam.status === 'completed' ? 'status-completed' : exam.status === 'pending' ? 'status-pending' : 'status-confirmed'}`}>
                    {exam.status === 'completed' ? 'Completado' : exam.status === 'pending' ? 'Pendiente' : 'En Proceso'}
                  </span>
                </div>
              </div>
              
              <div className="exam-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Fecha</span>
                  <span className="detail-value">{new Date(exam.created_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🐾 Mascota</span>
                  <span className="detail-value">{exam.appointments?.pets?.name} ({exam.appointments?.pets?.species})</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🩺 Tipo</span>
                  <span className="detail-value">{exam.type}</span>
                </div>
              </div>
              
              {exam.result_url && (
                <div className="exam-results">
                  <a 
                    href={exam.result_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="result-link"
                  >
                    📄 Ver Resultados
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Componente de Pasarela de Pagos
  const PaymentGateway = () => {
    const [paymentData, setPaymentData] = useState({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      email: user?.email || ''
    });
    const [paymentStep, setPaymentStep] = useState(1); // 1: Datos, 2: Confirmación, 3: Procesando, 4: Éxito
    const [isProcessing, setIsProcessing] = useState(false);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setPaymentData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const formatCardNumber = (value) => {
      return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const handleCardNumberChange = (e) => {
      const formatted = formatCardNumber(e.target.value);
      setPaymentData(prev => ({
        ...prev,
        cardNumber: formatted
      }));
    };

    const handleExpiryChange = (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      setPaymentData(prev => ({
        ...prev,
        expiryDate: value
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setPaymentStep(3);
      setIsProcessing(true);

      // Simular procesamiento de pago
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentStep(4);
      }, 3000);
    };

    const resetPayment = () => {
      setPaymentStep(1);
      setIsProcessing(false);
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        email: user?.email || ''
      });
    };

    const getServicePrice = () => {
      return selectedAppointment?.services?.price || 50000; // Precio por defecto
    };

    if (paymentStep === 4) {
      return (
        <div className="payment-success">
          <div className="success-icon">✅</div>
          <h2>¡Pago Exitoso!</h2>
          <p>Tu pago ha sido procesado correctamente.</p>
          <div className="payment-details">
            <h3>Detalles del Pago:</h3>
            <p><strong>Servicio:</strong> {selectedAppointment?.services?.name}</p>
            <p><strong>Mascota:</strong> {selectedAppointment?.pets?.name}</p>
            <p><strong>Fecha:</strong> {formatDateTime(selectedAppointment?.scheduled_at)}</p>
            <p><strong>Monto:</strong> ${getServicePrice().toLocaleString()} COP</p>
          </div>
          <div className="payment-actions">
            <button 
              className="btn-primary"
              onClick={() => {
                setShowPaymentModal(false);
                resetPayment();
              }}
            >
              Finalizar
            </button>
          </div>
        </div>
      );
    }

    if (paymentStep === 3) {
      return (
        <div className="payment-processing">
          <div className="processing-spinner"></div>
          <h2>Procesando Pago...</h2>
          <p>Por favor espera mientras procesamos tu pago de forma segura.</p>
        </div>
      );
    }

    return (
      <div className="payment-gateway">
        <div className="payment-header">
          <h2>💳 Pasarela de Pagos</h2>
          <p>Pago seguro para tu cita veterinaria</p>
        </div>

        <div className="payment-summary">
          <h3>Resumen del Pago</h3>
          <div className="summary-item">
            <span>Servicio:</span>
            <span>{selectedAppointment?.services?.name}</span>
          </div>
          <div className="summary-item">
            <span>Mascota:</span>
            <span>{selectedAppointment?.pets?.name}</span>
          </div>
          <div className="summary-item">
            <span>Fecha:</span>
            <span>{formatDateTime(selectedAppointment?.scheduled_at)}</span>
          </div>
          <div className="summary-item total">
            <span>Total a Pagar:</span>
            <span>${getServicePrice().toLocaleString()} COP</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label className="form-label">Número de Tarjeta</label>
            <input
              type="text"
              name="cardNumber"
              value={paymentData.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Vencimiento</label>
              <input
                type="text"
                name="expiryDate"
                value={paymentData.expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/AA"
                maxLength="5"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">CVV</label>
              <input
                type="text"
                name="cvv"
                value={paymentData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength="4"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Titular</label>
            <input
              type="text"
              name="cardholderName"
              value={paymentData.cardholderName}
              onChange={handleInputChange}
              placeholder="Nombre como aparece en la tarjeta"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email de Confirmación</label>
            <input
              type="email"
              name="email"
              value={paymentData.email}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="payment-security">
            <div className="security-badges">
              <span className="security-badge">🔒 SSL Seguro</span>
              <span className="security-badge">🛡️ Protegido</span>
              <span className="security-badge">💳 Visa/Mastercard</span>
            </div>
          </div>

          <div className="form-buttons">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isProcessing}
            >
              💳 Pagar ${getServicePrice().toLocaleString()} COP
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <a href="#" className="logo">PetH</a>
          <ul className="nav-links">
            <li>
              <button 
                className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                🏠 Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'pets' ? 'active' : ''}`}
                onClick={() => setActiveView('pets')}
              >
                🐾 Mis Mascotas
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveView('appointments')}
              >
                📅 Citas
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'exams' ? 'active' : ''}`}
                onClick={() => setActiveView('exams')}
              >
                🔬 Exámenes
              </button>
            </li>
          </ul>
          <div className="user-menu">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
        <button
                onClick={handleLogout}
              className="logout-btn"
        >
          Cerrar Sesión
        </button>
          </div>
        </div>
      </header>

            {/* Main Content */}
      <main className="main-container">
        {/* Mensaje de estado */}
        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Renderizar la vista activa */}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'pets' && <PetsView />}
        {activeView === 'appointments' && <AppointmentsView />}
        {activeView === 'exams' && <ExamsView />}
      </main>

      {/* Modals */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Agendar Nueva Cita"
      >
        <AppointmentForm 
          pets={pets}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={(message) => {
            showMessage('success', message);
            setShowAppointmentModal(false);
          }}
          onError={(message) => showMessage('error', message)}
        />
      </Modal>

      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title="Exámenes de Mascotas"
      >
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay exámenes registrados</h3>
              <p className="text-gray-500">Los exámenes de tus mascotas aparecerán aquí cuando estén disponibles.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Exámenes Realizados</h3>
              {exams.map((exam, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{exam.type}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Mascota:</strong> {exam.appointments?.pets?.name} ({exam.appointments?.pets?.species})
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Estado:</strong> {exam.status}
                  </p>
                  {exam.result_url && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Resultados:</strong> <a href={exam.result_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver resultados</a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setShowExamModal(false)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPetModal}
        onClose={() => setShowPetModal(false)}
        title="Registrar Nueva Mascota"
      >
        <PetForm 
          onClose={() => setShowPetModal(false)}
          onSuccess={(message) => {
            showMessage('success', message);
            setShowPetModal(false);
          }}
          onError={(message) => showMessage('error', message)}
        />
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Mis Mascotas"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Tus Mascotas ({pets.length})</h3>
              {user?.id && (
                <p className="text-xs text-gray-500">Usuario: {user.id}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadPets}
                disabled={petsLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm disabled:opacity-50"
              >
                {petsLoading ? '⏳' : '🔄'} Recargar
              </button>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setShowPetModal(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
              >
                ➕ Nueva Mascota
              </button>
            </div>
          </div>
          
          {petsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando mascotas...</p>
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🐕</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No tienes mascotas registradas</h3>
              <p className="text-gray-500 mb-4">Registra tu primera mascota para comenzar a usar el sistema.</p>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setShowPetModal(true);
                }}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200"
              >
                Registrar Mascota
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map((pet, index) => (
                <div key={pet.id || index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                        {pet.species === 'Perro' ? '🐕' : pet.species === 'Gato' ? '🐱' : '🐾'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-xl">{pet.name}</h4>
                        <p className="text-gray-600">{pet.species}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Activa
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Registrada: {new Date(pet.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {pet.breed && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Raza</p>
                        <p className="font-medium text-gray-800">{pet.breed}</p>
                      </div>
                    )}
                    {pet.birthdate && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Edad</p>
                        <p className="font-medium text-gray-800">
                          {Math.floor((new Date() - new Date(pet.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))} años
                        </p>
                      </div>
                    )}
                    {pet.weight_kg && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Peso</p>
                        <p className="font-medium text-gray-800">{pet.weight_kg} kg</p>
                      </div>
                    )}
                    {pet.sex && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Sexo</p>
                        <p className="font-medium text-gray-800">{pet.sex}</p>
                      </div>
                    )}
                  </div>
                  
                  {pet.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800">
                        <strong>Notas:</strong> {pet.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Perfil de Usuario"
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">
              Nombre Completo
            </label>
            <input 
              type="text" 
              defaultValue={user?.name}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Email
            </label>
            <input 
              type="email" 
              defaultValue={user?.email}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Teléfono
            </label>
            <input 
              type="tel" 
              defaultValue={user?.phone}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Dirección
            </label>
            <textarea 
              className="form-input form-textarea"
              rows="3"
              placeholder="Ingresa tu dirección completa..."
            />
          </div>
          
          <div className="form-buttons">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="form-btn form-btn-secondary"
            >
              Cancelar
            </button>
            <button 
              onClick={() => setShowProfileModal(false)}
              className="form-btn form-btn-primary"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedAppointment(null);
        }}
        title=""
      >
        <PaymentGateway />
      </Modal>
    </div>
  );
}

export default ClientDashboard;