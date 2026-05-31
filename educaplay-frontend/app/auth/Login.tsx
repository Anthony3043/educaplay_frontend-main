import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { loginStyles as s } from "../../styles/loginstyles";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

  // Botão voltar do Android → sai do app (Login é a tela inicial)
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      showInfo("Atenção", "Preencha e-mail e senha.", "aviso");
      return;
    }
    setCarregando(true);
    try {
      const usuario = await login(email.trim(), senha, lembrarMe);
      if (usuario.papel === "Professor") {
        router.replace("/professor/home-professor");
      } else {
        router.replace("/supervisao/home");
      }
    } catch (err) {
      showInfo("Erro", (err as any)?.response?.data?.error || "Credenciais inválidas.", "erro");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[s.topArea, { position: "relative" }]}>
            <Image source={require("@/assets/images/design_foil.png")} style={s.foilImage} resizeMode="cover" />
            <View style={[s.logoRow, { zIndex: 1 }]}>
              <Image source={require("@/assets/images/logo_icon.png")} style={s.logoImage} resizeMode="contain" />
              <Text style={s.logoText}>Educa<Text style={s.logoTextAccent}>Play</Text></Text>
            </View>
            <Text style={[s.tagline, { zIndex: 1 }]}>Organize hoje, ensine melhor amanhã.</Text>
          </View>

          <View style={s.mascoteSection}>
            {/* Halo de fundo suave */}
            <View style={s.mascoteHalo} />
            {/* Dots assimétricos decorativos */}
            <View style={[s.mascoteDot, { width: 10, height: 10, top: 20, left: "16%",  backgroundColor: "#86efac", opacity: 0.55 }]} />
            <View style={[s.mascoteDot, { width:  5, height:  5, top: 10, right: "18%", backgroundColor: "#4ade80", opacity: 0.38 }]} />
            <View style={[s.mascoteDot, { width:  7, height:  7, top: 68, right: "12%", backgroundColor: "#bbf7d0", opacity: 0.50 }]} />
            <View style={[s.mascoteDot, { width:  4, height:  4, top: 42, left: "10%",  backgroundColor: "#fde68a", opacity: 0.65 }]} />
            <View style={[s.mascoteDot, { width:  6, height:  6, top: 85, left: "28%",  backgroundColor: "#86efac", opacity: 0.30 }]} />
            {/* Sparkles dourados */}
            <Text style={[s.mascoteSparkle, { top: 16, right: "24%", fontSize: 14 }]}>✦</Text>
            <Text style={[s.mascoteSparkle, { top:  7, left:  "23%", fontSize:  9 }]}>✦</Text>
            <Image source={require("@/assets/ze_bloquinho_auth.png")} style={s.mascoteImage} resizeMode="contain" />
          </View>

          <View style={s.card}>
            <Text style={s.welcomeTitle}>Bem-vindo de volta!</Text>
            <Text style={s.welcomeSubtitle}>Faça login para continuar</Text>

            <Text style={s.label}>E-mail</Text>
            <View style={s.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#888" style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Digite seu e-mail" placeholderTextColor="#bbbcc8"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <Text style={s.label}>Senha</Text>
            <View style={s.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#888" style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Digite sua senha" placeholderTextColor="#bbbcc8"
                value={senha} onChangeText={setSenha} secureTextEntry={!senhaVisivel} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                <Ionicons name={senhaVisivel ? "eye-off-outline" : "eye-outline"} size={20} color="#888" style={s.eyeIcon} />
              </TouchableOpacity>
            </View>

            <View style={s.optionsRow}>
              <TouchableOpacity style={s.checkboxRow} onPress={() => setLembrarMe(!lembrarMe)} activeOpacity={0.7}>
                <View style={[s.checkbox, lembrarMe && s.checkboxChecked]}>
                  {lembrarMe && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkboxLabel}>Lembrar-me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/auth/ForgotPassword")}>
                <Text style={s.forgotLink}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.btnEntrar} onPress={handleLogin} activeOpacity={0.85} disabled={carregando}>
              {carregando ? <ActivityIndicator color="#fff" /> : <>
                <Text style={s.btnEntrarText}>Entrar</Text>
                <Text style={s.btnArrow}>→</Text>
              </>}
            </TouchableOpacity>

            <View style={s.createAccountRow}>
              <Text style={s.createAccountText}>É da supervisão? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/CodigoSupervisao")}>
                <Text style={s.createAccountLink}>Cadastrar →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
