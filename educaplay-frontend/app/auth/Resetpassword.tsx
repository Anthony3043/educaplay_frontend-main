/**
 * ResetPassword.tsx - Tela de redefinição de senha
 * Rota: /ResetPassword
 * Params: token (string) - vem do deep link do e-mail
 *
 * Deep link configurado em app.json: scheme = "educaplayfrontend"
 * Exemplo de link: educaplayfrontend://ResetPassword?token=abc123
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// ── Utilitário: análise de força da senha ──────────────────────────────────
type ForcaSenha = { nivel: 0 | 1 | 2 | 3 | 4; label: string; cor: string };

function analisarForca(senha: string): ForcaSenha {
  if (!senha) return { nivel: 0, label: "", cor: "#e8eaf0" };
  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;

  const mapa: Record<number, ForcaSenha> = {
    1: { nivel: 1, label: "Fraca", cor: "#f0556b" },
    2: { nivel: 2, label: "Razoável", cor: "#f59e0b" },
    3: { nivel: 3, label: "Boa", cor: "#3b82f6" },
    4: { nivel: 4, label: "Forte", cor: "#4cd97b" },
  };
  return mapa[score] ?? { nivel: 1, label: "Fraca", cor: "#f0556b" };
}

// ── Regras de senha ────────────────────────────────────────────────────────
const REGRAS = [
  { teste: (s: string) => s.length >= 8, texto: "Mínimo 8 caracteres" },
  { teste: (s: string) => /[A-Z]/.test(s), texto: "Uma letra maiúscula" },
  { teste: (s: string) => /[0-9]/.test(s), texto: "Um número" },
  { teste: (s: string) => /[^A-Za-z0-9]/.test(s), texto: "Um caractere especial (!@#$...)" },
];

export default function ResetPasswordScreen() {
  const router = useRouter();
  // Token recebido via deep link: educaplayfrontend://ResetPassword?token=...
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verNova, setVerNova] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const forca = analisarForca(novaSenha);
  const senhasIguais = novaSenha === confirmar && confirmar.length > 0;
  const senhasDispares = confirmar.length > 0 && novaSenha !== confirmar;
  const formularioValido =
    novaSenha.length >= 8 && senhasIguais && forca.nivel >= 2;

  const handleRedefinir = async () => {
    if (novaSenha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const api = (await import('../../src/services/api')).default;
      await api.post('/auth/reset-senha', { token, novaSenha });
      setSucesso(true);
    } catch (err) {
      setErro((err as any)?.response?.data?.error || 'Token inválido ou expirado.');
    } finally {
      setCarregando(false);
    }
  };

  // ── Tela de Sucesso ────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
        <View style={s.sucessoWrapper}>
          <View style={s.sucessoCard}>
            <View style={s.sucessoCircle}>
              <Ionicons name="checkmark-circle" size={44} color="#3a7d44" />
            </View>
            <View style={[s.sparkle, { top: -8, left: "12%", width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b", opacity: 0.65 }]} />
            <View style={[s.sparkle, { top: -12, right: "10%", width: 5, height: 5, borderRadius: 3, backgroundColor: "#f59e0b", opacity: 0.45 }]} />

            <Text style={s.sucessoTitulo}>Senha redefinida!</Text>
            <Text style={s.sucessoSub}>
              Sua senha foi atualizada com sucesso. Você já pode fazer login com
              sua nova senha.
            </Text>

            <TouchableOpacity
              style={s.btnLogin}
              onPress={() => router.push("/auth/Login")}
              activeOpacity={0.85}
            >
              <Text style={s.btnLoginText}>Ir para o login</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Tela Principal ─────────────────────────────────────────────────────
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
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => router.push("/auth/Login")}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Ícone */}
          <View style={s.iconArea}>
            <View style={s.iconCircle}>
              <Ionicons name="lock-closed-outline" size={36} color="#3a7d44" />
            </View>
            <View style={[s.sparkle, { top: 8, left: "22%", width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b", opacity: 0.65 }]} />
            <View style={[s.sparkle, { top: 2, right: "19%", width: 5, height: 5, borderRadius: 3, backgroundColor: "#f59e0b", opacity: 0.45 }]} />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Nova senha</Text>
            <Text style={s.subtitle}>
              Crie uma senha segura para proteger sua conta.
            </Text>

            {/* ── Nova Senha ── */}
            <Text style={s.label}>Nova senha</Text>
            <View style={s.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#888" />
              <TextInput
                style={s.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#bbbcc8"
                value={novaSenha}
                onChangeText={(t) => {
                  setNovaSenha(t);
                  setErro("");
                }}
                secureTextEntry={!verNova}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setVerNova(!verNova)}>
                <Text style={s.eyeIcon}>{verNova ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Barra de força */}
            {novaSenha.length > 0 && (
              <View style={s.forcaContainer}>
                <View style={s.forcaBarras}>
                  {([1, 2, 3, 4] as const).map((i) => (
                    <View
                      key={i}
                      style={[
                        s.forcaBarra,
                        {
                          backgroundColor:
                            i <= forca.nivel ? forca.cor : "#e8eaf0",
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[s.forcaLabel, { color: forca.cor }]}>
                  {forca.label}
                </Text>
              </View>
            )}

            {/* Checklist de regras */}
            {novaSenha.length > 0 && (
              <View style={s.checklistContainer}>
                {REGRAS.map((regra, i) => {
                  const ok = regra.teste(novaSenha);
                  return (
                    <View key={i} style={s.checklistRow}>
                      <Text
                        style={[
                          s.checklistDot,
                          { color: ok ? "#4cd97b" : "#bbbcc8" },
                        ]}
                      >
                        <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={ok ? "#4cd97b" : "#bbbcc8"} />
                      </Text>
                      <Text
                        style={[
                          s.checklistTexto,
                          { color: ok ? "#4cd97b" : "#bbbcc8" },
                        ]}
                      >
                        {regra.texto}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Confirmar Senha ── */}
            <Text style={[s.label, { marginTop: novaSenha.length > 0 ? 4 : 0 }]}>
              Confirmar senha
            </Text>
            <View
              style={[
                s.inputWrapper,
                senhasIguais && s.inputOk,
                senhasDispares && s.inputError,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#888" />
              <TextInput
                style={s.input}
                placeholder="Repita a nova senha"
                placeholderTextColor="#bbbcc8"
                value={confirmar}
                onChangeText={(t) => {
                  setConfirmar(t);
                  setErro("");
                }}
                secureTextEntry={!verConfirmar}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setVerConfirmar(!verConfirmar)}>
                <Ionicons name={verConfirmar ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Indicador de match */}
            {confirmar.length > 0 && (
              <Text
                style={[
                  s.matchText,
                  { color: senhasIguais ? "#4cd97b" : "#f0556b" },
                ]}
              >
                {senhasIguais ? "Senhas coincidem" : "Senhas não coincidem"}
              </Text>
            )}

            {/* Erro geral */}
            {erro ? <Text style={s.erroText}>{erro}</Text> : null}

            {/* Botão */}
            <TouchableOpacity
              style={[
                s.btnRedefinir,
                (!formularioValido || carregando) && s.btnDisabled,
              ]}
              onPress={handleRedefinir}
              activeOpacity={0.85}
              disabled={!formularioValido || carregando}
            >
              <Text style={s.btnRedefinirText}>
                {carregando ? "Salvando..." : "Redefinir senha"}
              </Text>
              {!carregando && <Ionicons name="arrow-forward" size={18} color="#fff" />}
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

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  backArrow: { fontSize: 20, color: "#5b6af0" },

  iconArea: {
    alignItems: "center", justifyContent: "center",
    height: 128, marginTop: 16, position: "relative",
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: "#eef0fd",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#5b6af0", shadowOpacity: 0.15, shadowRadius: 14, elevation: 4,
  },
  iconEmoji: { fontSize: 44 },
  sparkle: { position: "absolute", fontSize: 16, color: "#5b6af0", opacity: 0.55 },

  card: {
    marginHorizontal: 20, backgroundColor: "#fff", borderRadius: 24,
    padding: 24, shadowColor: "#000", shadowOpacity: 0.07,
    shadowRadius: 16, elevation: 4, marginTop: 8,
  },
  title: {
    fontSize: 22, fontWeight: "700", color: "#1a1d3b",
    textAlign: "center", marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: "#7a7f9a", textAlign: "center", marginBottom: 22,
  },

  label: { fontSize: 13, fontWeight: "600", color: "#1a1d3b", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f5f6fa",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: "#e8eaf0", marginBottom: 8,
  },
  inputOk: { borderColor: "#4cd97b", backgroundColor: "#f0fdf5" },
  inputError: { borderColor: "#f0556b", backgroundColor: "#fff5f6" },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1a1d3b" },
  eyeIcon: { fontSize: 18, paddingLeft: 8 },

  // Força da senha
  forcaContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  forcaBarras: { flexDirection: "row", flex: 1, gap: 4, marginRight: 10 },
  forcaBarra: { flex: 1, height: 4, borderRadius: 2 },
  forcaLabel: { fontSize: 12, fontWeight: "700", minWidth: 54, textAlign: "right" },

  // Checklist
  checklistContainer: { marginBottom: 16 },
  checklistRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  checklistDot: { fontSize: 13, marginRight: 8, fontWeight: "700", width: 14 },
  checklistTexto: { fontSize: 12 },

  // Match
  matchText: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginLeft: 2 },
  erroText: { fontSize: 12, color: "#f0556b", marginBottom: 8, marginLeft: 2 },

  // Botão principal
  btnRedefinir: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#5b6af0", borderRadius: 16, paddingVertical: 16,
    marginTop: 14, shadowColor: "#5b6af0", shadowOpacity: 0.3,
    shadowRadius: 10, elevation: 4,
  },
  btnDisabled: { backgroundColor: "#c4c9f5", shadowOpacity: 0, elevation: 0 },
  btnRedefinirText: { fontSize: 16, fontWeight: "700", color: "#fff", marginRight: 8 },
  btnArrow: { fontSize: 18, color: "#fff" },

  // Tela de sucesso
  sucessoWrapper: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  sucessoCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 32,
    alignItems: "center", width: "100%",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 20, elevation: 6,
    position: "relative",
  },
  sucessoCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: "#eef0fd",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
    shadowColor: "#5b6af0", shadowOpacity: 0.15, shadowRadius: 16, elevation: 4,
  },
  sucessoEmoji: { fontSize: 52 },
  sucessoTitulo: {
    fontSize: 24, fontWeight: "700", color: "#1a1d3b", marginBottom: 12,
  },
  sucessoSub: {
    fontSize: 14, color: "#7a7f9a", textAlign: "center", lineHeight: 22, marginBottom: 28,
  },
  btnLogin: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#5b6af0", borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 36, shadowColor: "#5b6af0", shadowOpacity: 0.3,
    shadowRadius: 10, elevation: 4, width: "100%",
  },
  btnLoginText: { fontSize: 16, fontWeight: "700", color: "#fff", marginRight: 8 },
});