import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarSessao();
  }, []);

  const carregarSessao = async () => {
    try {
      const u = await AsyncStorage.getItem('@educaplay_user');
      if (u) setUsuario(JSON.parse(u));
    } catch {}
    setCarregando(false);
  };

  const login = async (email, senha) => {
    const res = await api.post('/auth/login', { email, senha });
    const { token, usuario } = res.data;
    await AsyncStorage.setItem('@educaplay_token', token);
    await AsyncStorage.setItem('@educaplay_user', JSON.stringify(usuario));
    setUsuario(usuario);
    return usuario;
  };

  const register = async (dados) => {
    const res = await api.post('/auth/register', dados);
    const { token, usuario } = res.data;
    await AsyncStorage.setItem('@educaplay_token', token);
    await AsyncStorage.setItem('@educaplay_user', JSON.stringify(usuario));
    setUsuario(usuario);
    return usuario;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@educaplay_token');
    await AsyncStorage.removeItem('@educaplay_user');
    setUsuario(null);
  };

  const atualizarUsuario = (dados) => {
    const novo = { ...usuario, ...dados };
    setUsuario(novo);
    AsyncStorage.setItem('@educaplay_user', JSON.stringify(novo));
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, register, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
