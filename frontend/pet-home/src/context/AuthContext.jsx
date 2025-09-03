// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Obtener la sesión actual al cargar
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión:', error.message);
          setLoading(false);
          return;
        }

        setSession(session);
        
        if (session?.user) {
          // Obtener datos completos del usuario desde la tabla users
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error en getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup del listener
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Función para obtener el perfil completo del usuario
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          role_id,
          roles(name)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo perfil:', error.message);
        return;
      }

      if (data) {
        // Estructura el usuario con el rol
        const userProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.roles?.name || 'client'
        };
        
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error en fetchUserProfile:', error);
    }
  };

  // Función de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // El usuario se establecerá automáticamente por el listener onAuthStateChange
      return { success: true, data };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error inesperado durante el login' };
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Primero registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Si el registro de auth fue exitoso, crear el perfil en la tabla users
      if (authData.user) {
        // Obtener el role_id para 'client' (asumiendo que existe)
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'client')
          .single();

        const roleId = roleData?.id || 2; // Fallback al ID 2 si no encuentra el rol

        // Crear el registro en la tabla users
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role_id: roleId,
            }
          ]);

        if (profileError) {
          console.error('Error creando perfil:', profileError);
          // Aunque el perfil falle, el auth fue exitoso
        }
      }

      return { success: true, data: authData };
    } catch (error) {
      console.error('Error en register:', error);
      return { success: false, error: 'Error inesperado durante el registro' };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error en logout:', error.message);
      }
      // El estado se limpiará automáticamente por el listener
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (roleName) => {
    return user?.role === roleName;
  };

  // Función para verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return !!session && !!user;
  };

  // Función para verificar si el usuario es admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Función para verificar si el usuario es cliente
  const isClient = () => {
    return hasRole('client');
  };

  const value = {
    user,
    session,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated,
    isAdmin,
    isClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;