import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import {
  Home, Calendar, Heart, Users, CreditCard, Menu, X, LogOut,
  Plus, Edit2, Trash2, Check, AlertCircle, Clock, MapPin,
  Phone, Mail, Star, ChevronRight, User, Settings, FileText,
  PawPrint, Activity, Pill, Stethoscope, Shield, Sparkles
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeView, setActiveView] = useState('appointments');

  // Datos simulados para el admin
  const [appointments] = useState([
    {
      id: 1,
      client: 'Juan Pérez',
      pet: 'Max',
      service: 'Consulta General',
    }
  ]);
}

export default AdminDashboard;