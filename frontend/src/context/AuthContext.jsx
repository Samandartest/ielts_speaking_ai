import { createContext, useState, useContext, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await getProfile();
          setUser(data);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const loginUser = async (userData) => {
    localStorage.setItem('token', userData.token);
    setUser(userData);
    // Profile dan to'liq ma'lumot olish (targetBand ham)
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch {}
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Sessiya tugagandan keyin user ni yangilash uchun
  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);