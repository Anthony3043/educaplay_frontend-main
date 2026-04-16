/**
 * Tela: Home
 * Tela principal com seleção de tópicos
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, FlatList } from 'react-native';
import { THEME } from '../design_system/theme';
import { Button, Card } from '../components';
import { CHAT_TOPICS } from '../constants';
import { chatService } from '../services';

const HomeScreen = ({ route, navigation }) => {
  const { nickname } = route.params;
  const [chatRooms, setChatRooms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = {};
      for (const topic of Object.values(CHAT_TOPICS)) {
        const topicRooms = await chatService.getChatRoomsByTopic(topic.id);
        rooms[topic.id] = topicRooms;
      }
      setChatRooms(rooms);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId, roomTitle, topicId) => {
    navigation.navigate('Chat', {
      roomId,
      roomTitle,
      topicId,
      nickname,
    });
  };

  const handleCreateRoom = (topicId) => {
    navigation.navigate('CreateRoom', { topicId, nickname });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME.colors.background,
    },
    header: {
      paddingHorizontal: THEME.spacing.lg,
      paddingVertical: THEME.spacing.lg,
      backgroundColor: THEME.colors.primary,
    },
    headerTitle: {
      fontSize: THEME.typography.headingLarge.fontSize,
      fontWeight: THEME.typography.headingLarge.fontWeight,
      color: THEME.colors.white,
      marginBottom: THEME.spacing.sm,
    },
    nicknameText: {
      fontSize: THEME.typography.bodyMedium.fontSize,
      color: THEME.colors.primaryLight,
    },
    content: {
      flex: 1,
      padding: THEME.spacing.lg,
    },
    topicSection: {
      marginVertical: THEME.spacing.md,
    },
    topicTitle: {
      fontSize: THEME.typography.headingMedium.fontSize,
      fontWeight: THEME.typography.headingMedium.fontWeight,
      color: THEME.colors.text,
      marginBottom: THEME.spacing.md,
      marginLeft: THEME.spacing.sm,
    },
    roomCard: {
      marginVertical: THEME.spacing.sm,
    },
    roomTitle: {
      fontSize: THEME.typography.headingSmall.fontSize,
      fontWeight: THEME.typography.headingSmall.fontWeight,
      color: THEME.colors.text,
      marginBottom: THEME.spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: THEME.spacing.md,
    },
    createButton: {
      flex: 1,
      marginTop: THEME.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bem-vindo ao EducaPlay</Text>
        <Text style={styles.nicknameText}>Apelido: {nickname}</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.values(CHAT_TOPICS).map((topic) => (
          <View key={topic.id} style={styles.topicSection}>
            <Text style={styles.topicTitle}>
              {topic.emoji} {topic.label}
            </Text>

            {chatRooms[topic.id] && chatRooms[topic.id].length > 0 ? (
              chatRooms[topic.id].map((room) => (
                <Card
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() =>
                    handleJoinRoom(room.id, room.title, topic.id)
                  }
                >
                  <Text style={styles.roomTitle}>{room.title}</Text>
                  <Text
                    style={{
                      fontSize: THEME.typography.bodySmall.fontSize,
                      color: THEME.colors.textSecondary,
                    }}
                  >
                    👥 {room.participants || 0} participantes
                  </Text>
                  <Button
                    title="Entrar"
                    onPress={() =>
                      handleJoinRoom(room.id, room.title, topic.id)
                    }
                    variant="primary"
                    size="sm"
                    style={{ marginTop: THEME.spacing.md }}
                  />
                </Card>
              ))
            ) : (
              <Text
                style={{
                  fontSize: THEME.typography.bodyMedium.fontSize,
                  color: THEME.colors.textSecondary,
                  marginBottom: THEME.spacing.md,
                }}
              >
                Nenhuma sala disponível
              </Text>
            )}

            <Button
              title={`+ Criar Sala de ${topic.label}`}
              onPress={() => handleCreateRoom(topic.id)}
              variant="secondary"
              style={styles.createButton}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
