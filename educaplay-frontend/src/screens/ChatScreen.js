/**
 * Tela: Chat
 * Tela de conversa em tempo real
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { THEME } from '../design_system/theme';
import { Button, Input, ChatBubble } from '../components';
import { chatService } from '../services';

const ChatScreen = ({ route, navigation }) => {
  const { roomId, roomTitle, topicId, nickname } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    navigation.setOptions({ title: roomTitle });
    loadMessages();

    // Simular carregamento periódico de mensagens
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const data = await chatService.getMessages(roomId);
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim().length === 0) return;

    try {
      setLoading(true);
      await chatService.sendMessage(roomId, inputMessage);

      // Adicionar mensagem localmente
      const newMessage = {
        id: Date.now().toString(),
        message: inputMessage,
        sender: nickname,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages([...messages, newMessage]);
      setInputMessage('');

      // Scroll para a última mensagem
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME.colors.background,
    },
    messageList: {
      flex: 1,
      paddingVertical: THEME.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      paddingHorizontal: THEME.spacing.md,
      paddingVertical: THEME.spacing.md,
      backgroundColor: THEME.colors.gray50,
      borderTopWidth: 1,
      borderTopColor: THEME.colors.border,
      gap: THEME.spacing.md,
    },
    input: {
      flex: 1,
    },
    sendButton: {
      justifyContent: 'center',
    },
    emptyText: {
      textAlign: 'center',
      fontSize: THEME.typography.bodyMedium.fontSize,
      color: THEME.colors.textSecondary,
      marginTop: THEME.spacing.xl,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.container}>
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma mensagem ainda...</Text>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || item.timestamp}
            renderItem={({ item }) => (
              <ChatBubble
                message={item.message}
                sender={item.sender === nickname ? 'own' : 'other'}
                timestamp={item.timestamp}
              />
            )}
            style={styles.messageList}
            onEndReached={loadMessages}
            onEndReachedThreshold={0.1}
          />
        )}

        <View style={styles.inputContainer}>
          <Input
            placeholder="Digite uma mensagem..."
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline={false}
            style={styles.input}
          />
          <Button
            title="Enviar"
            onPress={handleSendMessage}
            variant="primary"
            size="sm"
            disabled={loading || inputMessage.trim().length === 0}
            style={styles.sendButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
