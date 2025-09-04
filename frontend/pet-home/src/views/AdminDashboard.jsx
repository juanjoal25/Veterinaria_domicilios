import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import {
  Home, Calendar, Heart, Users, CreditCard, Menu, X, LogOut,
  Plus, Edit2, Trash2, Check, AlertCircle, Clock, MapPin,
  Phone, Mail, Star, ChevronRight, User, Settings, FileText,
  PawPrint, Activity, Pill, Stethoscope, Shield, Sparkles,
  TrendingUp, UserCheck, CalendarCheck, BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para datos
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalAppointments: 0,
    pendingAppointments: 0
  });
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Estados para formularios
  const [editingUser, setEditingUser] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para citas
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Cargar estadísticas generales
  const loadStats = async () => {
    try {
      // Contar usuarios
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Contar mascotas
      const { count: petCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true });

      // Contar citas
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Contar citas pendientes
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: userCount || 0,
        totalPets: petCount || 0,
        totalAppointments: appointmentCount || 0,
        pendingAppointments: pendingCount || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando usuarios:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error en loadUsers:', error);
    }
  };

  // Cargar mascotas
  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          users(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando mascotas:', error);
        return;
      }

      setPets(data || []);
    } catch (error) {
      console.error('Error en loadPets:', error);
    }
  };

  // Cargar citas
  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          pets(name, species),
          users(name, email)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error cargando citas:', error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error en loadAppointments:', error);
    }
  };

  // CRUD Usuarios
  const createUser = async (userData) => {
    try {
      setLoading(true);
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          phone: userData.phone
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Crear perfil en la tabla users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role_id: userData.role_id
        }]);

      if (profileError) {
        throw new Error(profileError.message);
      }

      showMessage('success', 'Usuario creado exitosamente');
      loadUsers();
      setShowUserModal(false);
      setEditingUser(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error creando usuario:', error);
      showMessage('error', 'Error al crear usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          role_id: userData.role_id
        })
        .eq('id', userData.id);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Usuario actualizado exitosamente');
      loadUsers();
      setShowUserModal(false);
      setEditingUser(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      showMessage('error', 'Error al actualizar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Eliminar de la tabla users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Usuario eliminado exitosamente');
      loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      showMessage('error', 'Error al eliminar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Mascotas
  const createPet = async (petData) => {
    try {
      setLoading(true);
      
              const { error } = await supabase
          .from('pets')
          .insert([{
            name: petData.name,
            species: petData.species,
            breed: petData.breed,
            age: petData.age,
            gender: petData.gender,
            weight: petData.weight,
            owner_id: petData.owner_id,
            medical_notes: petData.medical_notes
          }]);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Mascota creada exitosamente');
      loadPets();
      setShowPetModal(false);
      setEditingPet(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error creando mascota:', error);
      showMessage('error', 'Error al crear mascota: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async (petData) => {
    try {
      setLoading(true);
      
              const { error } = await supabase
          .from('pets')
          .update({
            name: petData.name,
            species: petData.species,
            breed: petData.breed,
            age: petData.age,
            gender: petData.gender,
            weight: petData.weight,
            medical_notes: petData.medical_notes
          })
          .eq('id', petData.id);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Mascota actualizada exitosamente');
      loadPets();
      setShowPetModal(false);
      setEditingPet(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error actualizando mascota:', error);
      showMessage('error', 'Error al actualizar mascota: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async (petId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Mascota eliminada exitosamente');
      loadPets();
    } catch (error) {
      console.error('Error eliminando mascota:', error);
      showMessage('error', 'Error al eliminar mascota: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Citas
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .insert([{
          date: appointmentData.date,
          time: appointmentData.time,
          pet_id: appointmentData.pet_id,
          owner_id: appointmentData.owner_id,
          service_type: appointmentData.service_type,
          notes: appointmentData.notes,
          status: 'pending'
        }]);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Cita creada exitosamente');
      loadAppointments();
      setShowAppointmentForm(false);
      setEditingAppointment(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error creando cita:', error);
      showMessage('error', 'Error al crear cita: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .update({
          date: appointmentData.date,
          time: appointmentData.time,
          service_type: appointmentData.service_type,
          notes: appointmentData.notes,
          status: appointmentData.status
        })
        .eq('id', appointmentData.id);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Cita actualizada exitosamente');
      loadAppointments();
      setShowAppointmentForm(false);
      setEditingAppointment(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error actualizando cita:', error);
      showMessage('error', 'Error al actualizar cita: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', 'Cita eliminada exitosamente');
      loadAppointments();
    } catch (error) {
      console.error('Error eliminando cita:', error);
      showMessage('error', 'Error al eliminar cita: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        throw new Error(error.message);
      }

      showMessage('success', `Estado de cita actualizado a: ${newStatus}`);
      loadAppointments();
    } catch (error) {
      console.error('Error actualizando estado de cita:', error);
      showMessage('error', 'Error al actualizar estado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadStats();
    loadUsers();
    loadPets();
    loadAppointments();
  }, []);

  // Componente Modal
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

  // Componente UserForm
  const UserForm = ({ user, isEditing, onSubmit, onClose, loading }) => {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role_id: user?.role_id || 2,
      password: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!isEditing && !formData.password) {
        alert('La contraseña es requerida para nuevos usuarios');
        return;
      }
      onSubmit(formData);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Nombre Completo</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
            disabled={isEditing}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value={2}>Cliente</option>
            <option value={1}>Administrador</option>
          </select>
        </div>
        
        {!isEditing && (
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              minLength={8}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
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
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    );
  };

  // Componente PetForm
  const PetForm = ({ pet, isEditing, onSubmit, onClose, loading, users }) => {
    const [formData, setFormData] = useState({
      name: pet?.name || '',
      species: pet?.species || '',
      breed: pet?.breed || '',
      age: pet?.age || '',
      gender: pet?.gender || 'Macho',
      weight: pet?.weight || '',
      owner_id: pet?.owner_id || '',
      medical_notes: pet?.medical_notes || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Nombre de la Mascota</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Especie</label>
          <select
            name="species"
            value={formData.species}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Selecciona una especie</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Ave">Ave</option>
            <option value="Reptil">Reptil</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Raza</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Edad (años)</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="form-input"
              min="0"
              max="30"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Género</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Peso (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            className="form-input"
            step="0.1"
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Dueño</label>
          <select
            name="owner_id"
            value={formData.owner_id}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Selecciona un dueño</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Notas Médicas</label>
          <textarea
            name="medical_notes"
            value={formData.medical_notes}
            onChange={handleChange}
            className="form-input form-textarea"
            rows="3"
            placeholder="Información médica relevante..."
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
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
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
            </form>
    );
  };

  // Componente AppointmentForm
  const AppointmentForm = ({ appointment, isEditing, onSubmit, onClose, loading, users, pets }) => {
    const [formData, setFormData] = useState({
      date: appointment?.date || new Date().toISOString().split('T')[0],
      time: appointment?.time || '',
      pet_id: appointment?.pet_id || '',
      owner_id: appointment?.owner_id || '',
      service_type: appointment?.service_type || 'Consulta General',
      notes: appointment?.notes || '',
      status: appointment?.status || 'pending'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handlePetChange = (e) => {
      const petId = e.target.value;
      const selectedPet = pets.find(pet => pet.id === petId);
      setFormData(prev => ({
        ...prev,
        pet_id: petId,
        owner_id: selectedPet?.owner_id || ''
      }));
    };

    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Hora</label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Selecciona una hora</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Mascota</label>
            <select
              name="pet_id"
              value={formData.pet_id}
              onChange={handlePetChange}
              className="form-input"
              required
            >
              <option value="">Selecciona una mascota</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species}) - {pet.users?.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Dueño</label>
            <input
              type="text"
              name="owner_id"
              value={formData.owner_id}
              className="form-input"
              disabled
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Tipo de Servicio</label>
          <select
            name="service_type"
            value={formData.service_type}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="Consulta General">Consulta General</option>
            <option value="Vacunación">Vacunación</option>
            <option value="Esterilización">Esterilización</option>
            <option value="Cirugía">Cirugía</option>
            <option value="Emergencia">Emergencia</option>
            <option value="Control">Control</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        
        {isEditing && (
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-input form-textarea"
            rows="3"
            placeholder="Notas adicionales sobre la cita..."
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
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
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    );
  };
  
  // Vista del Dashboard principal
  const DashboardView = () => (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1>Panel de Administración <span className="highlight">PetHome</span> 🏥</h1>
        <p>Gestiona usuarios, mascotas, citas y supervisa el funcionamiento completo del sistema veterinario.</p>
      </section>

      {/* Mensaje de estado */}
      {message.text && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <section className="stats-section">
        <h2>Estadísticas Generales</h2>
        <div className="stats-grid">
          <div className="stat-item admin-stat">
            <div className="stat-icon">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Usuarios Registrados</div>
            </div>
          </div>
          
          <div className="stat-item admin-stat">
            <div className="stat-icon">
              <PawPrint className="w-8 h-8" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalPets}</div>
              <div className="stat-label">Mascotas Registradas</div>
            </div>
          </div>
          
          <div className="stat-item admin-stat">
            <div className="stat-icon">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalAppointments}</div>
              <div className="stat-label">Citas Totales</div>
            </div>
          </div>
          
          <div className="stat-item admin-stat">
            <div className="stat-icon">
              <Clock className="w-8 h-8" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pendingAppointments}</div>
              <div className="stat-label">Citas Pendientes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-grid-top">
        <div className="dashboard-card admin-card" onClick={() => setShowUserModal(true)}>
          <div className="card-icon">👥</div>
          <h3>Gestionar Usuarios</h3>
          <p>Ver, editar y administrar todos los usuarios registrados en el sistema</p>
          <button className="card-button">Ver Usuarios</button>
        </div>

        <div className="dashboard-card admin-card" onClick={() => setShowPetModal(true)}>
          <div className="card-icon">🐾</div>
          <h3>Gestionar Mascotas</h3>
          <p>Administrar el registro de mascotas y su información médica</p>
          <button className="card-button">Ver Mascotas</button>
        </div>

                 <div className="dashboard-card admin-card" onClick={() => {
           setEditingAppointment(null);
           setIsEditing(false);
           setShowAppointmentForm(true);
         }}>
           <div className="card-icon">📅</div>
           <h3>Gestionar Citas</h3>
           <p>Programar, modificar y supervisar todas las citas veterinarias</p>
           <button className="card-button">Ver Citas</button>
         </div>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <h2>Actividad Reciente</h2>
        <div className="activity-item">
          <div className="activity-icon">👤</div>
          <div className="activity-content">
            <h4>Nuevo usuario registrado</h4>
            <p>Se ha registrado un nuevo usuario en el sistema</p>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon">🐕</div>
          <div className="activity-content">
            <h4>Mascota registrada</h4>
            <p>Una nueva mascota ha sido añadida al sistema</p>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon">📅</div>
          <div className="activity-content">
            <h4>Cita programada</h4>
            <p>Se ha agendado una nueva cita veterinaria</p>
          </div>
        </div>
      </section>
    </div>
  );

  // Vista de gestión de usuarios
  const UsersView = () => (
    <div className="admin-view">
      <div className="view-header">
        <h2>Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={() => setShowUserModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>
      
      <div className="data-table">
        <div className="table-header">
          <div className="table-cell">Nombre</div>
          <div className="table-cell">Email</div>
          <div className="table-cell">Teléfono</div>
          <div className="table-cell">Rol</div>
          <div className="table-cell">Registro</div>
          <div className="table-cell">Acciones</div>
        </div>
        
        {users.map((user) => (
          <div key={user.id} className="table-row">
            <div className="table-cell">{user.name}</div>
            <div className="table-cell">{user.email}</div>
            <div className="table-cell">{user.phone || 'N/A'}</div>
            <div className="table-cell">
              <span className={`role-badge ${user.role_id === 1 ? 'admin' : 'client'}`}>
                {user.role_id === 1 ? 'Admin' : 'Cliente'}
              </span>
            </div>
            <div className="table-cell">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
            <div className="table-cell">
              <button 
                className="action-btn edit"
                onClick={() => {
                  setEditingUser(user);
                  setIsEditing(true);
                  setShowUserModal(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                className="action-btn delete"
                onClick={() => deleteUser(user.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Vista de gestión de mascotas
  const PetsView = () => (
    <div className="admin-view">
      <div className="view-header">
        <h2>Gestión de Mascotas</h2>
        <button className="btn-primary" onClick={() => setShowPetModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mascota
        </button>
      </div>
      
      <div className="data-table">
        <div className="table-header">
          <div className="table-cell">Nombre</div>
          <div className="table-cell">Especie</div>
          <div className="table-cell">Raza</div>
          <div className="table-cell">Dueño</div>
          <div className="table-cell">Edad</div>
          <div className="table-cell">Acciones</div>
        </div>
        
        {pets.map((pet) => (
          <div key={pet.id} className="table-row">
            <div className="table-cell">{pet.name}</div>
            <div className="table-cell">{pet.species}</div>
            <div className="table-cell">{pet.breed || 'N/A'}</div>
            <div className="table-cell">{pet.users?.name || 'N/A'}</div>
            <div className="table-cell">{pet.age || 'N/A'} años</div>
            <div className="table-cell">
              <button 
                className="action-btn edit"
                onClick={() => {
                  setEditingPet(pet);
                  setIsEditing(true);
                  setShowPetModal(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                className="action-btn delete"
                onClick={() => deletePet(pet.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
            </div>
    </div>
  );

  // Vista de gestión de citas
  const AppointmentsView = () => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'status-pending';
        case 'confirmed': return 'status-confirmed';
        case 'cancelled': return 'status-cancelled';
        case 'completed': return 'status-completed';
        default: return 'status-pending';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'confirmed': return 'Confirmada';
        case 'cancelled': return 'Cancelada';
        case 'completed': return 'Completada';
        default: return 'Pendiente';
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div className="admin-view">
        <div className="view-header">
          <h2>Gestión de Citas</h2>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingAppointment(null);
              setIsEditing(false);
              setShowAppointmentForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </button>
        </div>
        
        <div className="appointment-list">
          <h3>Citas Programadas</h3>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500">No hay citas programadas</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-info">
                  <div className="appointment-time">
                    {formatDate(appointment.date)} - {appointment.time}
                  </div>
                  <div className="appointment-details">
                    <strong>{appointment.pets?.name}</strong> ({appointment.pets?.species}) - 
                    <strong> {appointment.users?.name}</strong> - 
                    <em>{appointment.service_type}</em>
                    {appointment.notes && (
                      <span> - {appointment.notes}</span>
                    )}
                  </div>
                </div>
                
                <div className="appointment-actions">
                  <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                  
                  <button
                    className="appointment-btn edit"
                    onClick={() => {
                      setEditingAppointment(appointment);
                      setIsEditing(true);
                      setShowAppointmentForm(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        className="appointment-btn complete"
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      >
                        ✓
                      </button>
                      <button
                        className="appointment-btn cancel"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      >
                        ✕
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      className="appointment-btn complete"
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                    >
                      ✓ Completar
                    </button>
                  )}
                  
                  <button
                    className="appointment-btn delete"
                    onClick={() => deleteAppointment(appointment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <a href="#" className="logo">PetH Admin</a>
          <ul className="nav-links">
            <li>
              <button 
                className={activeView === 'dashboard' ? 'nav-link active' : 'nav-link'}
                onClick={() => setActiveView('dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={activeView === 'users' ? 'nav-link active' : 'nav-link'}
                onClick={() => setActiveView('users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </button>
            </li>
            <li>
              <button 
                className={activeView === 'pets' ? 'nav-link active' : 'nav-link'}
                onClick={() => setActiveView('pets')}
              >
                <PawPrint className="w-4 h-4 mr-2" />
                Mascotas
              </button>
            </li>
            <li>
              <button 
                className={activeView === 'appointments' ? 'nav-link active' : 'nav-link'}
                onClick={() => setActiveView('appointments')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Citas
              </button>
            </li>
          </ul>
          <div className="user-menu">
            <div className="user-avatar admin-avatar">
              <Shield className="w-5 h-5" />
            </div>
            <span className="user-name">{user?.name || 'Admin'}</span>
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'users' && <UsersView />}
        {activeView === 'pets' && <PetsView />}
                 {activeView === 'appointments' && <AppointmentsView />}
      </main>

      {/* Modals */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
          setIsEditing(false);
        }}
        title={isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
      >
        <UserForm 
          user={editingUser}
          isEditing={isEditing}
          onSubmit={isEditing ? updateUser : createUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
            setIsEditing(false);
          }}
          loading={loading}
        />
      </Modal>

      <Modal
        isOpen={showPetModal}
        onClose={() => {
          setShowPetModal(false);
          setEditingPet(null);
          setIsEditing(false);
        }}
        title={isEditing ? "Editar Mascota" : "Crear Nueva Mascota"}
      >
        <PetForm 
          pet={editingPet}
          isEditing={isEditing}
          onSubmit={isEditing ? updatePet : createPet}
          onClose={() => {
            setShowPetModal(false);
            setEditingPet(null);
            setIsEditing(false);
          }}
          loading={loading}
          users={users}
        />
      </Modal>

      <Modal
        isOpen={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setEditingAppointment(null);
          setIsEditing(false);
        }}
        title={isEditing ? "Editar Cita" : "Crear Nueva Cita"}
      >
        <AppointmentForm 
          appointment={editingAppointment}
          isEditing={isEditing}
          onSubmit={isEditing ? updateAppointment : createAppointment}
          onClose={() => {
            setShowAppointmentForm(false);
            setEditingAppointment(null);
            setIsEditing(false);
          }}
          loading={loading}
          users={users}
          pets={pets}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;

