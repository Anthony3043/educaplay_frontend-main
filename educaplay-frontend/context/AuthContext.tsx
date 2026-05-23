import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';
import { registrarPushToken } from '../hooks/useNotifications';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  cargo?: string | null;
  instituicao?: string | null;
  foto?: string | null;
  materias?: string[];
};

type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string, lembrar?: boolean) => Promise<Usuario>;
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
    // Acorda o backend silenciosamente (Render free tier dorme após 15 min de inatividade).
    // Não aguarda resposta — o objetivo é apenas iniciar o cold start enquanto o app carrega.
    api.get('/health').catch(() => {});

    try {
      const lembrar = await AsyncStorage.getItem('@educaplay_remember');
      if (lembrar !== 'true') {
        // Sessão temporária: limpa dados ao reabrir o app
        await AsyncStorage.multiRemove(['@educaplay_token', '@educaplay_user']);
        setCarregando(false);
        return;
      }
      const u = await AsyncStorage.getItem('@educaplay_user');
      if (u) setUsuario(JSON.parse(u));
    } catch {}
    setCarregando(false);
  };

  const login = async (email: string, senha: string, lembrar: boolean = true): Promise<Usuario> => {
    const res = await api.post('/auth/login', { email, senha });
    const { token, usuario } = res.data;
    // Sempre salva o token na sessão atual (o interceptor do axios precisa dele)
    await AsyncStorage.setItem('@educaplay_token', token);
    await AsyncStorage.setItem('@educaplay_user', JSON.stringify(usuario));
    // Flag que decide se a sessão sobrevive ao fechar o app
    if (lembrar) {
      await AsyncStorage.setItem('@educaplay_remember', 'true');
    } else {
      await AsyncStorage.removeItem('@educaplay_remember');
    }
    setUsuario(usuario);
    registrarPushToken().catch(() => {});
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
    await AsyncStorage.multiRemove(['@educaplay_token', '@educaplay_user', '@educaplay_remember']);
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
