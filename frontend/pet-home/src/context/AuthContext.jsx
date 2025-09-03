import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular verificación de sesión
    const checkSession = () => {
      const savedUser = localStorage.getItem('pethome_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    // Simulación de login - integrar con Supabase
    const mockUser = {
      id: '123',
      email,
      name: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'client'
    };
    localStorage.setItem('pethome_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { success: true };
  };

  const register = async (userData) => {
    // Simulación de registro - integrar con Supabase
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: 'client'
    };
    localStorage.setItem('pethome_user', JSON.stringify(newUser));
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('pethome_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export { AuthProvider, useAuth };