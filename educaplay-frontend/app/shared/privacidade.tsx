import { styles as s } from "@/styles/configuracoesstyles";
import { Colors } from "@/src/constants/colors";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import api from "../../src/services/api";
import { useAuth } from "../../context/AuthContext";

const BIOMETRIA_KEY = "@educaplay_biometria";
const FRASE_CONFIRMACAO = "EXCLUIR MINHA CONTA";

export default function PrivacidadeScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [biometriaDisponivel, setBiometriaDisponivel] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroConfirmacao, setErroConfirmacao] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    verificarBiometria();
    carregarPreferencia();
  }, []);

  const verificarBiometria = async () => {
    const compativel = await LocalAuthentication.hasHardwareAsync();
    const cadastrado = await LocalAuthentication.isEnrolledAsync();
    setBiometriaDisponivel(compativel && cadastrado);
  };

  const carregarPreferencia = async () => {
    const salvo = await AsyncStorage.getItem(BIOMETRIA_KEY);
    setBiometriaAtiva(salvo === "true");
  };

  const toggleBiometria = async (valor: boolean) => {
    if (valor) {
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua identidade para ativar a autenticação por digital",
        fallbackLabel: "Usar senha",
        cancelLabel: "Cancelar",
      });
      if (!resultado.success) return;
    }
    setBiometriaAtiva(valor);
    await AsyncStorage.setItem(BIOMETRIA_KEY, String(valor));
  };

  const abrirModalExcluir = () => {
    setTextoConfirmacao("");
    setErroConfirmacao(false);
    setModalVisivel(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const confirmarExclusao = async () => {
    if (textoConfirmacao.trim() !== FRASE_CONFIRMACAO) {
      setErroConfirmacao(true);
      return;
    }
    setExcluindo(true);
    try {
      await api.delete("/auth/conta");
      setModalVisivel(false);
      await logout();
      router.replace("/auth/Login");
    } catch {
      setExcluindo(false);
      setErroConfirmacao(true);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }} showsVerticalScrollIndicator={false}>

        <Text style={ls.secaoLabel}>SEGURANÇA</Text>

        <View style={[s.configItem, { justifyContent: "space-between", opacity: biometriaDisponivel ? 1 : 0.45 }]}>
          <View style={s.configIcon}>
            <Ionicons name="finger-print" size={20} color="#1a1a2e" />
          </View>
          <View style={s.configContent}>
            <Text style={s.configTitle}>Digital</Text>
            <Text style={s.configSubtitle}>
              {biometriaDisponivel
                ? "Usar impressão digital para entrar no app"
                : "Biometria não disponível neste dispositivo"}
            </Text>
          </View>
          <Switch
            value={biometriaAtiva}
            onValueChange={toggleBiometria}
            disabled={!biometriaDisponivel}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={biometriaAtiva ? Colors.primary : Colors.textMuted}
          />
        </View>

        <Text style={[ls.secaoLabel, { marginTop: 12 }]}>CONTA</Text>

        <TouchableOpacity
          style={[s.configItem, { borderColor: Colors.error, borderWidth: 1 }]}
          activeOpacity={0.7}
          onPress={abrirModalExcluir}
        >
          <View style={[s.configIcon, { backgroundColor: Colors.errorBg }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </View>
          <View style={s.configContent}>
            <Text style={[s.configTitle, { color: Colors.error }]}>Excluir minha conta</Text>
            <Text style={s.configSubtitle}>Remove permanentemente todos os seus dados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbbcc8" />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de confirmação de exclusão */}
      <Modal visible={modalVisivel} transparent animationType="fade" onRequestClose={() => setModalVisivel(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <View style={ls.overlay}>
          <View style={ls.modalBox}>
            <Ionicons name="warning-outline" size={36} color={Colors.error} style={{ textAlign: "center", alignSelf: "center" }} />
            <Text style={ls.modalTitulo}>Excluir conta</Text>
            <Text style={ls.modalDescricao}>
              Esta ação é <Text style={{ fontWeight: "800", color: Colors.error }}>irreversível</Text>. Todos os seus dados serão apagados permanentemente.
            </Text>

            <View style={ls.fraseBox}>
              <Text style={ls.fraseLabel}>Para confirmar, digite exatamente:</Text>
              <Text style={ls.frase}>{FRASE_CONFIRMACAO}</Text>
            </View>

            <TextInput
              ref={inputRef}
              style={[ls.input, erroConfirmacao && ls.inputErro]}
              value={textoConfirmacao}
              onChangeText={(t) => { setTextoConfirmacao(t); setErroConfirmacao(false); }}
              placeholder="Digite aqui..."
              placeholderTextColor="#bbb"
              autoCapitalize="characters"
            />
            {erroConfirmacao && (
              <Text style={ls.erroTexto}>✗ O texto não corresponde. Conta não excluída.</Text>
            )}

            <View style={ls.botoesRow}>
              <TouchableOpacity style={ls.btnCancelar} onPress={() => setModalVisivel(false)} disabled={excluindo}>
                <Text style={ls.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ls.btnExcluir, excluindo && { opacity: 0.6 }]}
                onPress={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={ls.btnExcluirText}>Excluir</Text>}
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  secaoLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginBottom: 4 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalBox: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, width: "100%", gap: 12 },
  modalIcon: { fontSize: 36, textAlign: "center" },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
  modalDescricao: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  fraseBox: { backgroundColor: Colors.errorBg, borderRadius: 10, padding: 12, gap: 4 },
  fraseLabel: { fontSize: 12, color: Colors.textSecondary },
  frase: { fontSize: 16, fontWeight: "800", color: Colors.error, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  inputErro: { borderColor: Colors.error },
  erroTexto: { fontSize: 12, color: Colors.error, fontWeight: "600" },
  botoesRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnCancelar: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center" },
  btnCancelarText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  btnExcluir: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.error, alignItems: "center" },
  btnExcluirText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
