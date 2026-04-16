/**
 * Componente: ChatBubble
 * Bolha de mensagem para o chat
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../design_system/theme';

const ChatBubble = ({ message, sender = 'other', timestamp }) => {
  const isOwn = sender === 'own';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginVertical: THEME.spacing.sm,
      paddingHorizontal: THEME.spacing.md,
    },
    bubble: {
      maxWidth: '80%',
      paddingVertical: THEME.spacing.md,
      paddingHorizontal: THEME.spacing.lg,
      borderRadius: THEME.borderRadius.lg,
      backgroundColor: isOwn ? THEME.colors.primary : THEME.colors.gray200,
      marginLeft: isOwn ? 0 : THEME.spacing.md,
      marginRight: isOwn ? THEME.spacing.md : 0,
      ...THEME.shadows.md,
    },
    messageText: {
      fontSize: THEME.typography.bodyMedium.fontSize,
      color: isOwn ? THEME.colors.white : THEME.colors.text,
      lineHeight: THEME.typography.bodyMedium.lineHeight,
    },
    timestamp: {
      fontSize: THEME.typography.labelSmall.fontSize,
      color: isOwn ? THEME.colors.white : THEME.colors.textSecondary,
      marginTop: THEME.spacing.xs,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.messageText}>{message}</Text>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    </View>
  );
};

export default ChatBubble;
