/**
 * Serviço de Chat
 * Funções para integração com a API de chat anônimo
 */

import api from './api';

// Buscar salas de chat por tópico
export const getChatRoomsByTopic = async (topic) => {
  try {
    const response = await api.get(`/chat/rooms/${topic}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar salas de chat:', error);
    throw error;
  }
};

// Criar nova sala de chat
export const createChatRoom = async (topic, title) => {
  try {
    const response = await api.post('/chat/rooms', { topic, title });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error);
    throw error;
  }
};

// Enviar mensagem
export const sendMessage = async (roomId, message) => {
  try {
    const response = await api.post(`/chat/messages`, {
      roomId,
      message,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

// Buscar mensagens da sala
export const getMessages = async (roomId, limit = 50) => {
  try {
    const response = await api.get(`/chat/messages/${roomId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
};

export default {
  getChatRoomsByTopic,
  createChatRoom,
  sendMessage,
  getMessages,
};
