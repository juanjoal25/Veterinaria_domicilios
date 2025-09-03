import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [pets, setPets] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Cargar mascotas del usuario
  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);
      
      if (error) {
        console.error('Error cargando mascotas:', error);
        return;
      }
      
      setPets(data || []);
    } catch (error) {
      console.error('Error en loadPets:', error);
    }
  };

  // Cargar exámenes de las mascotas del usuario
  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          pets(name, species)
        `)
        .in('pet_id', pets.map(pet => pet.id));
      
      if (error) {
        console.error('Error cargando exámenes:', error);
        return;
      }
      
      setExams(data || []);
    } catch (error) {
      console.error('Error en loadExams:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadPets();
    }
  }, [user?.id]);

  useEffect(() => {
    if (pets.length > 0) {
      loadExams();
    }
  }, [pets]);

  // Función para mostrar mensajes
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Componente para el formulario de citas
  const AppointmentForm = ({ pets, onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
      pet_id: '',
      appointment_type: 'Consulta General',
      appointment_date: '',
      appointment_time: '09:00',
      reason: '',
      status: 'pending'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            ...formData,
            client_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          onError('Error al agendar la cita: ' + error.message);
          return;
        }

        onSuccess('¡Cita agendada exitosamente!');
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
            Tipo de Consulta
          </label>
          <select 
            value={formData.appointment_type}
            onChange={(e) => setFormData({...formData, appointment_type: e.target.value})}
            className="form-input"
          >
            <option>Consulta General</option>
            <option>Vacunación</option>
            <option>Control</option>
            <option>Emergencia</option>
            <option>Cirugía</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Fecha Preferida *
          </label>
          <input 
            type="date" 
            required
            value={formData.appointment_date}
            onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Hora Preferida
          </label>
          <select 
            value={formData.appointment_time}
            onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
            className="form-input"
          >
            <option>09:00</option>
            <option>10:00</option>
            <option>11:00</option>
            <option>14:00</option>
            <option>15:00</option>
            <option>16:00</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Motivo de la Consulta
          </label>
          <textarea 
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
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
      age: '',
      weight: '',
      color: '',
      gender: 'Macho',
      medical_notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('pets')
          .insert([{
            ...formData,
            owner_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          onError('Error al registrar la mascota: ' + error.message);
          return;
        }

        onSuccess('¡Mascota registrada exitosamente!');
        loadPets(); // Recargar la lista de mascotas
      } catch (error) {
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
              Edad (años)
            </label>
            <input 
              type="number" 
              min="0"
              max="30"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="form-input"
              placeholder="Ej: 3"
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
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              className="form-input"
              placeholder="Ej: 25.5"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Color
          </label>
          <input 
            type="text" 
            value={formData.color}
            onChange={(e) => setFormData({...formData, color: e.target.value})}
            className="form-input"
            placeholder="Ej: Marrón, Blanco, Negro, etc."
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Notas Médicas
          </label>
          <textarea 
            value={formData.medical_notes}
            onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
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
  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <a href="#" className="logo">PetH</a>
          <ul className="nav-links">
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Mis Mascotas</a></li>
            <li><a href="#">Citas</a></li>
            <li><a href="#">Historial</a></li>
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
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1>Bienvenido de vuelta, <span className="highlight">{user?.name || 'Usuario'}</span> 👋</h1>
          <p>Gestiona el cuidado de tus mascotas desde la comodidad de tu hogar. Aquí encontrarás todas las herramientas para mantener la salud de tus compañeros peludos al día.</p>
        </section>

        {/* Mensaje de estado */}
        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

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
          <div className="dashboard-card" onClick={() => setShowHistoryModal(true)}>
            <div className="card-icon">🐾</div>
            <h3>Mis Mascotas</h3>
            <p>Ver todas tus mascotas registradas y gestionar su información</p>
            <button className="card-button">Ver Mascotas</button>
          </div>

          <div className="dashboard-card" onClick={() => setShowProfileModal(true)}>
            <div className="card-icon">👤</div>
            <h3>Mi Perfil</h3>
            <p>Gestiona tu información personal y configuración de cuenta</p>
            <button className="card-button">Ver Perfil</button>
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
              <div className="stat-number">0</div>
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
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <h4>Última cita agendada</h4>
              <p>Consulta general - Sistema de citas disponible</p>
              </div>
              </div>
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
                    <h4 className="font-medium text-gray-800">{exam.exam_type}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Mascota:</strong> {exam.pets?.name} ({exam.pets?.species})
                  </p>
                  {exam.results && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Resultados:</strong> {exam.results}
                    </p>
                  )}
                  {exam.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Notas:</strong> {exam.notes}
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
          {pets.length === 0 ? (
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
              <h3 className="font-semibold text-gray-800">Tus Mascotas</h3>
              {pets.map((pet, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 text-lg">{pet.name}</h4>
                    <span className="text-sm text-gray-500">
                      {pet.species}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {pet.breed && <p><strong>Raza:</strong> {pet.breed}</p>}
                    {pet.age && <p><strong>Edad:</strong> {pet.age} años</p>}
                    {pet.weight && <p><strong>Peso:</strong> {pet.weight} kg</p>}
                    {pet.color && <p><strong>Color:</strong> {pet.color}</p>}
                    <p><strong>Género:</strong> {pet.gender}</p>
                    <p><strong>Registrado:</strong> {new Date(pet.created_at).toLocaleDateString()}</p>
                  </div>
                  {pet.medical_notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Notas médicas:</strong> {pet.medical_notes}
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
    </div>
  );
}

export default ClientDashboard;