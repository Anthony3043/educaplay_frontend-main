import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
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
import { loginStyles as s } from "../styles/loginStyles";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);

  const handleLogin = () => {
    console.log("Login com:", email, senha);
  };

  const handleGoogle = () => {
    console.log("Login com Google");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Card branco com formulário ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Área superior: Logo ── */}
          <View style={[s.topArea, { position: "relative" }]}>
            {/* Foil decorativo */}
            <Image
              source={require("@/assets/images/design_foil.png")}
              style={s.foilImage}
              resizeMode="cover"
            />

            {/* Logo */}
            <View style={[s.logoRow, { zIndex: 1 }]}>
              <Image
                source={require("@/assets/images/logo_icon.png")}
                style={s.logoImage}
                resizeMode="contain"
              />
              <Text style={s.logoText}>
                Educa<Text style={s.logoTextAccent}>Play</Text>
              </Text>
            </View>
            <Text style={[s.tagline, { zIndex: 1 }]}>
              Organize hoje, ensine melhor amanhã.
            </Text>
          </View>

          {/* ── Seção do Zé Bloco ── */}
          <View style={s.mascoteSection}>
            <View style={s.mascoteCircleBg} />

            <Text style={[s.sparkle, { fontSize: 16, top: 24, left: "18%" }]}>
              ✦
            </Text>
            <Text style={[s.sparkle, { fontSize: 11, top: 16, right: "20%" }]}>
              ✦
            </Text>
            <Text style={[s.sparkle, { fontSize: 13, top: 60, right: "12%" }]}>
              ✦
            </Text>

            <Image
              source={require("@/assets/images/login_ze_bloco.png")}
              style={s.mascoteImage}
              resizeMode="contain"
            />
          </View>

          <View style={s.card}>
            <Text style={s.welcomeTitle}>Bem-vindo de volta!</Text>
            <Text style={s.welcomeSubtitle}>Faça login para continuar</Text>

            {/* E-mail */}
            <Text style={s.label}>E-mail</Text>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput
                style={s.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#bbbcc8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Senha */}
            <Text style={s.label}>Senha</Text>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#bbbcc8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                <Text style={s.eyeIcon}>{senhaVisivel ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Lembrar-me / Esqueceu */}
            <View style={s.optionsRow}>
              <TouchableOpacity
                style={s.checkboxRow}
                onPress={() => setLembrarMe(!lembrarMe)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, lembrarMe && s.checkboxChecked]}>
                  {lembrarMe && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkboxLabel}>Lembrar-me</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={s.forgotLink}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={s.btnEntrar}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={s.btnEntrarText}>Entrar</Text>
              <Text style={s.btnArrow}>→</Text>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou continue com</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Botão Google */}
            <TouchableOpacity
              style={s.btnGoogle}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <Text style={s.googleIcon}>G</Text>
              <Text style={s.btnGoogleText}>Entrar com Google</Text>
            </TouchableOpacity>

            {/* Criar conta */}
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
