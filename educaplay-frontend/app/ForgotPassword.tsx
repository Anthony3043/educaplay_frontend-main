/**
 * ForgotPassword.tsx - Tela de recuperação de senha
 * Rota: /ForgotPassword
 */

import { styles as s } from "@/styles/ForgotPasswordstyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleEnviar = async () => {
    if (!email.trim()) {
      setErro("Por favor, insira seu e-mail.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErro("Por favor, insira um e-mail válido.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await api.post("/auth/check-email", { email: email.trim() });
      router.push({ pathname: "/CheckEmail", params: { email } });
    } catch (err) {
      if ((err as any)?.response?.status === 404) {
        setErro("Este e-mail não está cadastrado.");
      } else {
        setErro("Erro ao verificar e-mail. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Header com voltar */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={s.backArrow}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Ícone central */}
          <View style={s.iconArea}>
            <View style={s.iconCircle}>
              <Text style={s.iconEmoji}>🔑</Text>
            </View>
            <Text style={[s.sparkle, { top: 10, left: "22%" }]}>✦</Text>
            <Text style={[s.sparkle, { fontSize: 11, top: 4, right: "20%" }]}>
              ✦
            </Text>
            <Text
              style={[s.sparkle, { fontSize: 13, bottom: 6, right: "14%" }]}
            >
              ✦
            </Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Esqueceu a senha?</Text>
            <Text style={s.subtitle}>
              Sem problemas! Informe seu e-mail cadastrado e enviaremos um link
              para redefinir sua senha.
            </Text>

            <Text style={s.label}>E-mail</Text>
            <View style={[s.inputWrapper, erro ? s.inputWrapperError : null]}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput
                style={s.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#bbbcc8"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErro("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleEnviar}
              />
              {email.length > 0 && (
                <TouchableOpacity onPress={() => setEmail("")}>
                  <Text style={s.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {erro ? <Text style={s.erroText}>{erro}</Text> : null}

            <TouchableOpacity
              style={[s.btnEnviar, (!email || carregando) ? s.btnDisabled : null]}
              onPress={handleEnviar}
              activeOpacity={0.85}
              disabled={!email || carregando}
            >
              {carregando
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={s.btnEnviarText}>Enviar link de recuperação</Text>
                    <Text style={s.btnArrow}>→</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={s.voltarRow}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={s.voltarText}>← Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
