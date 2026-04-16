/**
 * Componente: Card
 * Cartão reutilizável para exibir conteúdo
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../design_system/theme';

const Card = ({ children, onPress, style, elevated = false }) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: THEME.colors.white,
      borderRadius: THEME.borderRadius.lg,
      padding: THEME.spacing.lg,
      marginVertical: THEME.spacing.md,
      ...(elevated ? THEME.shadows.lg : THEME.shadows.md),
    },
  });

  const content = <View style={[styles.container, style]}>{children}</View>;

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
};

export default Card;
