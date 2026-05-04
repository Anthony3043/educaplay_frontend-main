/**
 * ForgotPassword.tsx - Tela de recuperação de senha
 * Rota: /ForgotPassword
 */

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");

  const handleEnviar = () => {
    if (!email.trim()) {
      setErro("Por favor, insira seu e-mail.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErro("Por favor, insira um e-mail válido.");
      return;
    }
    setErro("");
    // TODO: chamar authService.sendPasswordReset(email)
    router.push({ pathname: "/CheckEmail", params: { email } });
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
            <Text style={[s.sparkle, { fontSize: 11, top: 4, right: "20%" }]}>✦</Text>
            <Text style={[s.sparkle, { fontSize: 13, bottom: 6, right: "14%" }]}>✦</Text>
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
              style={[s.btnEnviar, !email ? s.btnDisabled : null]}
              onPress={handleEnviar}
              activeOpacity={0.85}
              disabled={!email}
            >
              <Text style={s.btnEnviarText}>Enviar link de recuperação</Text>
              <Text style={s.btnArrow}>→</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  backArrow: { fontSize: 20, color: "#5b6af0" },

  // Ícone
  iconArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    marginTop: 20,
    position: "relative",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#eef0fd",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5b6af0",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  iconEmoji: { fontSize: 44 },
  sparkle: {
    position: "absolute",
    fontSize: 16,
    color: "#5b6af0",
    opacity: 0.55,
  },

  // Card
  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1d3b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7a7f9a",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },

  // Input
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1d3b",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "#e8eaf0",
    marginBottom: 6,
  },
  inputWrapperError: {
    borderColor: "#f0556b",
    backgroundColor: "#fff5f6",
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1a1d3b" },
  clearIcon: { fontSize: 14, color: "#bbbcc8", paddingLeft: 8 },
  erroText: {
    fontSize: 12,
    color: "#f0556b",
    marginBottom: 12,
    marginLeft: 2,
  },

  // Botão
  btnEnviar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5b6af0",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: "#5b6af0",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: "#c4c9f5",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnEnviarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
  },
  btnArrow: { fontSize: 18, color: "#fff" },

  voltarRow: { alignItems: "center", marginTop: 20 },
  voltarText: { fontSize: 14, color: "#5b6af0", fontWeight: "600" },
});
