/**
 * Componente: Input
 * Campo de entrada reutilizável
 */

import React from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import { THEME } from '../design_system/theme';

const Input = ({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  placeholderTextColor,
}) => {
  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: THEME.colors.border,
      borderRadius: THEME.borderRadius.md,
      paddingHorizontal: THEME.spacing.md,
      paddingVertical: THEME.spacing.sm,
      marginVertical: THEME.spacing.sm,
      backgroundColor: THEME.colors.white,
    },
    input: {
      fontSize: THEME.typography.bodyMedium.fontSize,
      color: THEME.colors.text,
      minHeight: multiline ? 100 : 44,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor || THEME.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
};

export default Input;
