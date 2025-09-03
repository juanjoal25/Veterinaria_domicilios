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
        console.log('=== AUTH STATE CHANGE ===');
        console.log('Event:', event);
        console.log('Session:', session);
        console.log('User:', session?.user);
        
        setSession(session);
        
        if (session?.user) {
          // Establecer un perfil mínimo inmediatamente para no bloquear la UI
          const immediateUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email,
            phone: session.user.user_metadata?.phone || '',
            role: 'client'
          };
          setUser(immediateUser);

          // Cargar el perfil completo en segundo plano
          console.log('Fetching user profile for:', session.user.id);
          fetchUserProfile(session.user.id).catch((e) => {
            console.error('Background fetchUserProfile error:', e);
          });
        } else {
          console.log('No session user, setting user to null');
          setUser(null);
        }
        
        setLoading(false);
        console.log('=== END AUTH STATE CHANGE ===');
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
      console.log('=== FETCH USER PROFILE ===');
      console.log('User ID:', userId);
      
      // Intentar obtener datos de la tabla users (opcional)
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            phone,
            role_id
          `)
          .eq('id', userId)
          .single();

        console.log('Query result:', { data, error });

        if (!error && data) {
          console.log('User data found in table:', data);
          
          // Determinar el rol basado en role_id
          let role = 'client';
          if (data.role_id === 1) {
            role = 'admin';
          } else if (data.role_id === 2) {
            role = 'client';
          }

          // Estructura el usuario con los datos de la tabla
          const userProfile = {
            id: data.id,
            name: data.name || data.email?.split('@')[0] || 'Usuario',
            email: data.email,
            phone: data.phone || '',
            role: role
          };
          
          console.log('Setting user profile (from table):', userProfile);
          setUser(userProfile);
          console.log('=== END FETCH USER PROFILE ===');
          return;
        }
      } catch (tableError) {
        console.log('Table query failed, using auth data only:', tableError.message);
      }

      // Si no hay datos en la tabla o hay error, usar solo datos de auth
      console.log('Using auth data only...');
      const userProfile = {
        id: userId,
        name: 'Usuario', // Nombre por defecto
        email: 'usuario@example.com', // Email por defecto
        phone: '',
        role: 'client'
      };
      
      console.log('Setting user profile (auth only):', userProfile);
      setUser(userProfile);
      console.log('=== END FETCH USER PROFILE ===');
      
    } catch (error) {
      console.error('Error en fetchUserProfile:', error);
      
      // Fallback final: usuario básico
      const userProfile = {
        id: userId,
        name: 'Usuario',
        email: 'usuario@example.com',
        phone: '',
        role: 'client'
      };
      console.log('Setting user profile (final fallback):', userProfile);
      setUser(userProfile);
    }
  };

  // Función de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('=== INICIO LOGIN ===');
      console.log('Email:', email);
      console.log('Password length:', password.length);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error de autenticación:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Login exitoso:', data);
      console.log('=== FIN LOGIN ===');
      // El usuario se establecerá automáticamente por el listener onAuthStateChange
      return { success: true, data };
    } catch (error) {
      console.error('Error en login:', error);
      console.error('Error stack:', error.stack);
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
        // Crear el registro en la tabla users con la estructura actual
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role_id: 2, // Por defecto asignamos rol de cliente (ID 2)
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
    const authenticated = !!session && !!user;
    console.log('isAuthenticated check:', {
      session: !!session,
      user: !!user,
      sessionData: session,
      userData: user,
      result: authenticated
    });
    return authenticated;
  };

  // Función para verificar si el usuario es admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Función para verificar si el usuario es cliente
  const isClient = () => {
    return hasRole('client');
  };

  // Función para verificar si un usuario existe en Supabase Auth
  const checkUserInAuth = async (email) => {
    try {
      // Intentar hacer login para verificar si el usuario existe en Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_to_check_existence'
      });
      
      // Si no hay error de "invalid credentials", el usuario existe
      return !error || !error.message.includes('Invalid login credentials');
    } catch (error) {
      return false;
    }
  };

  // Función para probar la conexión con Supabase
  const testSupabaseConnection = async () => {
    try {
      console.log('=== PROBANDO CONEXIÓN SUPABASE ===');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.auth.getSession();
      console.log('Session test:', { data, error });
      
      return { success: !error, error };
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error };
    }
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
    isClient,
    checkUserInAuth,
    testSupabaseConnection
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