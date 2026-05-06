import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StatusBar, Text,
  TextInput, TouchableOpacity, View, ActivityIndicator,
} from "react-native";
import { loginStyles as s } from "../styles/loginStyles";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }
    setCarregando(true);
    try {
      const usuario = await login(email.trim(), senha);
      if (usuario.papel === "Professor") {
        router.replace("/home-professor");
      } else {
        router.replace("/home");
      }
    } catch (err) {
      Alert.alert("Erro", err?.response?.data?.error || "Credenciais inválidas.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
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
            <View style={s.mascoteCircleBg} />
            <Text style={[s.sparkle, { fontSize: 16, top: 24, left: "18%" }]}>✦</Text>
            <Text style={[s.sparkle, { fontSize: 11, top: 16, right: "20%" }]}>✦</Text>
            <Text style={[s.sparkle, { fontSize: 13, top: 60, right: "12%" }]}>✦</Text>
            <Image source={require("@/assets/images/login_ze_bloco.png")} style={s.mascoteImage} resizeMode="contain" />
          </View>

          <View style={s.card}>
            <Text style={s.welcomeTitle}>Bem-vindo de volta!</Text>
            <Text style={s.welcomeSubtitle}>Faça login para continuar</Text>

            <Text style={s.label}>E-mail</Text>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput style={s.input} placeholder="Digite seu e-mail" placeholderTextColor="#bbbcc8"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <Text style={s.label}>Senha</Text>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput style={s.input} placeholder="Digite sua senha" placeholderTextColor="#bbbcc8"
                value={senha} onChangeText={setSenha} secureTextEntry={!senhaVisivel} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                <Text style={s.eyeIcon}>{senhaVisivel ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.optionsRow}>
              <TouchableOpacity style={s.checkboxRow} onPress={() => setLembrarMe(!lembrarMe)} activeOpacity={0.7}>
                <View style={[s.checkbox, lembrarMe && s.checkboxChecked]}>
                  {lembrarMe && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkboxLabel}>Lembrar-me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
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
              <Text style={s.createAccountText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push("/Register")}>
                <Text style={s.createAccountLink}>Criar conta →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
