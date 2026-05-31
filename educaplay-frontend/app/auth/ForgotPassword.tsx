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
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/services/api";

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
      router.push({ pathname: "/auth/CheckEmail", params: { email } });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setErro("Este e-mail não está cadastrado.");
      } else if (status === 503) {
        setErro("Não foi possível enviar o e-mail. Verifique sua caixa de spam ou tente novamente em instantes.");
      } else if (
        !err?.response ||
        err?.code === 'ECONNABORTED' ||
        err?.message?.includes('timeout') ||
        err?.message?.includes('Network')
      ) {
        setErro("O servidor demorou para responder. Aguarde alguns segundos e tente novamente.");
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
            </TouchableOpacity>
          </View>

          {/* Ícone central */}
          <View style={s.iconArea}>
            <View style={s.iconCircle}>
              <Ionicons name="key-outline" size={36} color="#3a7d44" />
            </View>
            <View style={[s.sparkle, { top: 10, left: "22%", width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b", opacity: 0.65 }]} />
            <View style={[s.sparkle, { top: 4, right: "20%", width: 5, height: 5, borderRadius: 3, backgroundColor: "#f59e0b", opacity: 0.45 }]} />
            <View style={[s.sparkle, { bottom: 6, right: "14%", width: 7, height: 7, borderRadius: 4, backgroundColor: "#86efac", opacity: 0.55 }]} />
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
              <Ionicons name="mail-outline" size={18} color="#888" style={s.inputIcon} />
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
                  <Ionicons name="close-circle" size={18} color="#aaa" style={s.clearIcon} />
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
