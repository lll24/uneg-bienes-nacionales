import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, getUserInfo, setAuthToken, setUserInfo, removeAuthToken, removeUserInfo } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUserInfo());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          setUserInfo(userData);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (cedula, password) => {
    const data = await api.login(cedula, password);
    setAuthToken(data.access_token);
    setToken(data.access_token);
    const userInfo = {
      id: data.usuario_id,
      nombre: data.nombre,
      cedula: data.cedula,
      rol: data.rol,
    };
    setUser(userInfo);
    setUserInfo(userInfo);
    return data;
  };

  const logout = () => {
    removeAuthToken();
    removeUserInfo();
    setToken(null);
    setUser(null);
  };

  const isRole = (...roles) => user && roles.includes(user.rol);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isRole,
        isJefe: isRole('Jefe'),
        isAdmin: isRole('Administrador'),
        isRegistrador: isRole('Registrador'),
        isDocumentalista: isRole('Documentalista'),
        isAuditor: isRole('Auditor'),
        isRPU: isRole('Responsable de Unidad'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

