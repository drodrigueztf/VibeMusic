import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('vibemusic_token');
    if (token) {
      authAPI.getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('vibemusic_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('vibemusic_token');
          localStorage.removeItem('vibemusic_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await authAPI.login({ email, password });
      setUser(res.data.user);
      localStorage.setItem('vibemusic_token', res.data.token);
      localStorage.setItem('vibemusic_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const res = await authAPI.register({ username, email, password });
      localStorage.setItem('vibemusic_token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vibemusic_token');
    localStorage.removeItem('vibemusic_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
};
