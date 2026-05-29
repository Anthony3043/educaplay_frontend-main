/**
 * CheckEmail.tsx - Tela de confirmação de envio do e-mail
 * Rota: /CheckEmail
 * Params: email (string) - vem da ForgotPasswordScreen via router.push
 */

import { styles as s } from "@/styles/CheckEmailstyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../src/services/api";

const COUNTDOWN_INICIAL = 60;

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [countdown, setCountdown] = useState(COUNTDOWN_INICIAL);
  const [podeReenviar, setPodeReenviar] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenvios, setReenvios] = useState(0);
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

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
    try {
      await api.post('/auth/check-email', { email });
      setReenvios((r) => r + 1);
      setCountdown(COUNTDOWN_INICIAL);
      setPodeReenviar(false);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        showInfo("Erro", "E-mail não encontrado. Volte e tente com outro e-mail.", "erro");
      } else if (
        !err?.response ||
        err?.code === 'ECONNABORTED' ||
        err?.message?.includes('timeout') ||
        err?.message?.includes('Network')
      ) {
        showInfo("Tempo esgotado", "O servidor demorou para responder. Aguarde alguns segundos e tente novamente.", "aviso");
      } else {
        showInfo("Erro", "Não foi possível reenviar o e-mail. Tente novamente.", "erro");
      }
    } finally {
      setReenviando(false);
    }
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
            onPress={() => router.push("/auth/ForgotPassword")}
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
          <Text style={[s.sparkle, { fontSize: 10, top: 2, right: "18%" }]}>
            ✦
          </Text>
          <Text style={[s.sparkle, { fontSize: 13, bottom: 4, right: "12%" }]}>
            ✦
          </Text>
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
            onPress={() => router.push("/auth/Login")}
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
          onPress={() => router.push("/auth/ForgotPassword")}
          activeOpacity={0.7}
        >
          <Text style={s.trocarEmailText}>
            E-mail incorreto? Clique aqui para alterar
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={inf.overlay}>
          <View style={inf.box}>
            <View style={[inf.iconCircle, { backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : modalInfo.tipo === "sucesso" ? "#dcfce7" : "#FFF7ED" }]}>
              <Ionicons name={modalInfo.tipo === "erro" ? "close-circle-outline" : modalInfo.tipo === "sucesso" ? "checkmark-circle-outline" : "warning-outline"} size={32} color={modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316"} />
            </View>
            <Text style={[inf.titulo, { color: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]}>{modalInfo.titulo}</Text>
            <Text style={inf.msg}>{modalInfo.mensagem}</Text>
            <TouchableOpacity style={[inf.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]} onPress={() => setModalInfo(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={inf.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const inf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 3 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
