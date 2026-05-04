/**
 * CheckEmail.tsx - Tela de confirmação de envio do e-mail
 * Rota: /CheckEmail
 * Params: email (string) - vem da ForgotPasswordScreen via router.push
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COUNTDOWN_INICIAL = 60;

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [countdown, setCountdown] = useState(COUNTDOWN_INICIAL);
  const [podeReenviar, setPodeReenviar] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenvios, setReenvios] = useState(0);

  // Countdown para habilitar reenvio
  useEffect(() => {
    if (countdown <= 0) {
      setPodeReenviar(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleReenviar = async () => {
    setReenviando(true);
    // TODO: chamar authService.sendPasswordReset(email)
    await new Promise((r) => setTimeout(r, 800)); // simula chamada de API
    setReenvios((r) => r + 1);
    setCountdown(COUNTDOWN_INICIAL);
    setPodeReenviar(false);
    setReenviando(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.push("/ForgotPassword")}
            activeOpacity={0.7}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Ícone */}
        <View style={s.iconArea}>
          <View style={s.iconCircle}>
            <Text style={s.iconEmoji}>📬</Text>
          </View>
          {/* Badge de confirmado */}
          <View style={s.badge}>
            <Text style={s.badgeText}>✓</Text>
          </View>
          <Text style={[s.sparkle, { top: 8, left: "20%" }]}>✦</Text>
          <Text style={[s.sparkle, { fontSize: 10, top: 2, right: "18%" }]}>✦</Text>
          <Text style={[s.sparkle, { fontSize: 13, bottom: 4, right: "12%" }]}>✦</Text>
        </View>

        {/* Card principal */}
        <View style={s.card}>
          <Text style={s.title}>Verifique seu e-mail</Text>
          <Text style={s.subtitle}>Enviamos um link de recuperação para:</Text>

          <View style={s.emailPill}>
            <Text style={s.emailText} numberOfLines={1} ellipsizeMode="middle">
              {email}
            </Text>
          </View>

          <Text style={s.instrucao}>
            Clique no link do e-mail para criar sua nova senha. Verifique também
            a pasta de <Text style={s.instrucaoBold}>spam</Text> ou{" "}
            <Text style={s.instrucaoBold}>lixo eletrônico</Text>.
          </Text>

          <View style={s.divider} />

          {/* Reenvio */}
          <Text style={s.reenviarLabel}>Não recebeu o e-mail?</Text>

          {reenvios > 0 && (
            <View style={s.reenviadoBadge}>
              <Text style={s.reenviadoText}>
                ✓ E-mail reenviado {reenvios > 1 ? `(${reenvios}x)` : ""}
              </Text>
            </View>
          )}

          {podeReenviar ? (
            <TouchableOpacity
              style={[s.btnReenviar, reenviando ? s.btnReenviarLoading : null]}
              onPress={handleReenviar}
              activeOpacity={0.8}
              disabled={reenviando}
            >
              <Text style={s.btnReenviarText}>
                {reenviando ? "Enviando..." : "Reenviar e-mail ↺"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.countdownBox}>
              <Text style={s.countdownText}>
                Reenviar em{" "}
                <Text style={s.countdownNum}>{formatarTempo(countdown)}</Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.btnLogin}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={s.btnLoginText}>Voltar para o login</Text>
          </TouchableOpacity>
        </View>

        {/* Aviso de expiração */}
        <View style={s.avisoBox}>
          <Text style={s.avisoEmoji}>⏱️</Text>
          <Text style={s.avisoText}>
            O link expira em <Text style={s.avisoBold}>30 minutos</Text>. Se
            expirar, basta solicitar um novo.
          </Text>
        </View>

        {/* Link errado? */}
        <TouchableOpacity
          style={s.trocarEmailRow}
          onPress={() => router.push("/ForgotPassword")}
          activeOpacity={0.7}
        >
          <Text style={s.trocarEmailText}>E-mail incorreto? Clique aqui para alterar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
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

  iconArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 136,
    marginTop: 20,
    position: "relative",
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#eef0fd",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5b6af0",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  iconEmoji: { fontSize: 50 },
  badge: {
    position: "absolute",
    top: 10,
    right: "26%",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4cd97b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#f5f6fa",
  },
  badgeText: { fontSize: 14, color: "#fff", fontWeight: "700" },
  sparkle: { position: "absolute", fontSize: 16, color: "#5b6af0", opacity: 0.55 },

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
    marginBottom: 12,
  },
  emailPill: {
    alignSelf: "center",
    backgroundColor: "#eef0fd",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 16,
    maxWidth: "90%",
  },
  emailText: { fontSize: 14, fontWeight: "700", color: "#5b6af0" },
  instrucao: {
    fontSize: 13,
    color: "#7a7f9a",
    textAlign: "center",
    lineHeight: 20,
  },
  instrucaoBold: { fontWeight: "700", color: "#5b6af0" },

  divider: { height: 1, backgroundColor: "#f0f1f7", marginVertical: 20 },

  reenviarLabel: {
    fontSize: 14,
    color: "#7a7f9a",
    textAlign: "center",
    marginBottom: 12,
  },
  reenviadoBadge: {
    alignSelf: "center",
    backgroundColor: "#edfaf2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#a7f3c8",
  },
  reenviadoText: { fontSize: 12, color: "#18a763", fontWeight: "600" },

  btnReenviar: {
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#5b6af0",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 16,
  },
  btnReenviarLoading: { borderColor: "#bbbcc8" },
  btnReenviarText: { fontSize: 14, fontWeight: "700", color: "#5b6af0" },

  countdownBox: {
    alignSelf: "center",
    backgroundColor: "#f5f6fa",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  countdownText: { fontSize: 13, color: "#7a7f9a" },
  countdownNum: { fontWeight: "700", color: "#5b6af0" },

  btnLogin: {
    backgroundColor: "#5b6af0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#5b6af0",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnLoginText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  avisoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#fffbea",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  avisoEmoji: { fontSize: 15, marginRight: 8, marginTop: 1 },
  avisoText: { flex: 1, fontSize: 13, color: "#78600a", lineHeight: 18 },
  avisoBold: { fontWeight: "700" },

  trocarEmailRow: { alignItems: "center", marginTop: 16 },
  trocarEmailText: { fontSize: 13, color: "#5b6af0", textDecorationLine: "underline" },
});
