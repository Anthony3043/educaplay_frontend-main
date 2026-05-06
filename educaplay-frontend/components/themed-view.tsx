import { View, useColorScheme, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const scheme = useColorScheme();
  const backgroundColor = scheme === 'dark' ? (darkColor ?? '#000') : (lightColor ?? '#fff');
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
