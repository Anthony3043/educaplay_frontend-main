/**
 * Componente: Button
 * Botão reutilizável para toda a aplicação
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../design_system/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}) => {
  const styles = StyleSheet.create({
    container: {
      paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
      paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 20 : 16,
      borderRadius: THEME.borderRadius.md,
      backgroundColor:
        variant === 'primary'
          ? THEME.colors.primary
          : variant === 'secondary'
          ? THEME.colors.secondary
          : THEME.colors.gray200,
      opacity: disabled ? 0.6 : 1,
      ...THEME.shadows.md,
    },
    text: {
      color:
        variant === 'primary' || variant === 'secondary'
          ? THEME.colors.white
          : THEME.colors.text,
      fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
