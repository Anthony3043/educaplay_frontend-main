/**
 * Tela: Login
 * Primeira tela que o usuário vê - autenticação anônima
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { THEME } from '../design_system/theme';
import { Button, Input, Card } from '../components';
import { CHAT_TOPICS } from '../constants';

const LoginScreen = ({ navigation }) => {
  const [nickname, setNickname] = useState('');

  const handleLogin = () => {
    if (nickname.trim().length === 0) {
      alert('Por favor, digite um apelido');
      return;
    }
    // Navegar para Home com o nickname
    navigation.navigate('Home', { nickname });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME.colors.background,
    },
    scrollView: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: THEME.spacing.lg,
    },
    header: {
      textAlign: 'center',
      fontSize: THEME.typography.displayMedium.fontSize,
      fontWeight: THEME.typography.displayMedium.fontWeight,
      color: THEME.colors.primary,
      marginBottom: THEME.spacing.xl,
    },
    description: {
      textAlign: 'center',
      fontSize: THEME.typography.bodyMedium.fontSize,
      color: THEME.colors.textSecondary,
      marginBottom: THEME.spacing.lg,
      lineHeight: THEME.typography.bodyMedium.lineHeight,
    },
    topicsTitle: {
      fontSize: THEME.typography.headingMedium.fontSize,
      fontWeight: THEME.typography.headingMedium.fontWeight,
      color: THEME.colors.text,
      marginTop: THEME.spacing.xl,
      marginBottom: THEME.spacing.md,
    },
    topicsList: {
      marginVertical: THEME.spacing.md,
    },
    topicItem: {
      marginVertical: THEME.spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.header}>🎮 EducaPlay</Text>

        <Text style={styles.description}>
          Conecte-se anonimamente e converse sobre seus tópicos favoritos
        </Text>

        <Card style={{ marginVertical: THEME.spacing.lg }}>
          <View>
            <Text
              style={{
                fontSize: THEME.typography.headingSmall.fontSize,
                fontWeight: THEME.typography.headingSmall.fontWeight,
                color: THEME.colors.text,
                marginBottom: THEME.spacing.md,
              }}
            >
              Escolha um apelido
            </Text>

            <Input
              placeholder="Digite um apelido"
              value={nickname}
              onChangeText={setNickname}
            />

            <Button
              title="Entrar"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              style={{ marginTop: THEME.spacing.lg }}
            />
          </View>
        </Card>

        <Text style={styles.topicsTitle}>Tópicos Disponíveis:</Text>

        <View style={styles.topicsList}>
          {Object.values(CHAT_TOPICS).map((topic) => (
            <Card key={topic.id} style={styles.topicItem}>
              <Text
                style={{
                  fontSize: THEME.typography.bodyLarge.fontSize,
                  color: THEME.colors.text,
                }}
              >
                {topic.emoji} {topic.label}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
