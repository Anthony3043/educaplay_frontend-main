import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  cargo?: string | null;
  instituicao?: string | null;
  foto?: string | null;
};

type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  register: (dados: Partial<Usuario> & { senha: string }) => Promise<Usuario>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
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

  const login = async (email: string, senha: string): Promise<Usuario> => {
    const res = await api.post('/auth/login', { email, senha });
    const { token, usuario } = res.data;
    await AsyncStorage.setItem('@educaplay_token', token);
    await AsyncStorage.setItem('@educaplay_user', JSON.stringify(usuario));
    setUsuario(usuario);
    return usuario;
  };

  const register = async (dados: any): Promise<Usuario> => {
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

  const atualizarUsuario = (dados: Partial<Usuario>) => {
    const novo = { ...usuario, ...dados } as Usuario;
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
