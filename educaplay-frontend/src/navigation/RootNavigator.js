/**
 * Configuração de Navegação
 * Define as rotas e estrutura de navegação da aplicação
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { THEME } from './design_system/theme';
import { LoginScreen, HomeScreen, ChatScreen } from './screens';

const Stack = createNativeStackNavigator();

const navigationOptions = {
  headerStyle: {
    backgroundColor: THEME.colors.primary,
  },
  headerTintColor: THEME.colors.white,
  headerTitleStyle: {
    fontWeight: THEME.typography.headingSmall.fontWeight,
    fontSize: THEME.typography.headingSmall.fontSize,
  },
};

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={navigationOptions}
        initialRouteName="Login"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'EducaPlay',
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'Chat',
            headerBackVisible: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
