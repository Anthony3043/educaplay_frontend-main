import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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
import { registerStyles as r } from "../styles/registerStyles";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [papel, setPapel] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);
  const [papelOpen, setPapelOpen] = useState(false);

  const papeis = ["Professor", "Coordenador", "Diretor", "Outro"];

  const handleRegister = () => {
    console.log("Registro:", { nome, email, senha, instituicao, papel });
  };

  const handleGoogle = () => {
    console.log("Registro com Google");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffdede" />

      {/* ── Card com formulário ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Bloco superior: foil + logo + mascote ── */}
          <View style={r.topBlock}>
            {/* Foil decorativo */}
            <Image
              source={require("@/assets/images/design_foil.png")}
              style={r.foil}
              resizeMode="cover"
            />

            {/* Header sobre o foil */}
            <View style={r.headerRow}>
              <TouchableOpacity style={r.backBtn} onPress={() => router.back()}>
                <Text style={r.backArrow}>←</Text>
              </TouchableOpacity>
              <View style={r.headerRight}>
                <Text style={r.headerText}>Já tem uma conta? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={r.headerLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logo à esquerda + Mascote à direita */}
            <View style={r.logoMascoteRow}>
              <View style={r.logoSide}>
                <View style={s.logoRow}>
                  <Image
                    source={require("@/assets/images/logo_icon.png")}
                    style={s.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={s.logoText}>
                    Educa<Text style={s.logoTextAccent}>Play</Text>
                  </Text>
                </View>
                <Text style={s.tagline}>
                  Organize hoje, ensine melhor amanhã.
                </Text>
              </View>

              <View style={r.mascoteSide}>
                <Image
                  source={require("@/assets/images/register_ze_bloco.png")}
                  style={r.mascoteImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={[s.card, { backgroundColor: 'transparent' }]}>
            <Text style={s.welcomeTitle}>Crie sua conta</Text>
            <Text style={s.welcomeSubtitle}>
              Preencha os dados abaixo para começar
            </Text>

            {/* Nome + E-mail em linha */}
            <View style={r.rowInputs}>
              {/* Nome completo */}
              <View style={r.halfField}>
                <View style={r.inlineInput}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>👤</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Nome completo</Text>
                      <TextInput
                        style={r.inlineTextInput}
                        placeholder="Digite seu nome"
                        placeholderTextColor="#bbbcc8"
                        value={nome}
                        onChangeText={setNome}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* E-mail */}
              <View style={r.halfField}>
                <View style={r.inlineInput}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>✉️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>E-mail</Text>
                      <TextInput
                        style={r.inlineTextInput}
                        placeholder="Digite seu e-mail"
                        placeholderTextColor="#bbbcc8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Senha */}
            <View style={r.inlineInput}>
              <View style={r.inlineIconLabel}>
                <Text style={r.inlineIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>Senha</Text>
                  <TextInput
                    style={r.inlineTextInput}
                    placeholder="Crie uma senha"
                    placeholderTextColor="#bbbcc8"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!senhaVisivel}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                <Text style={s.eyeIcon}>{senhaVisivel ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirmar Senha */}
            <View style={r.inlineInput}>
              <View style={r.inlineIconLabel}>
                <Text style={r.inlineIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>Confirmar senha</Text>
                  <TextInput
                    style={r.inlineTextInput}
                    placeholder="Digite novamente a sua senha"
                    placeholderTextColor="#bbbcc8"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry={!confirmarSenhaVisivel}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}
              >
                <Text style={s.eyeIcon}>
                  {confirmarSenhaVisivel ? "🙈" : "👁️"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instituição + Papel em linha */}
            <View style={r.rowInputs}>
              {/* Instituição */}
              <View style={r.halfField}>
                <View style={r.inlineInput}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>🏫</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Instituição (opcional)</Text>
                      <TextInput
                        style={r.inlineTextInput}
                        placeholder="Nome da instituição"
                        placeholderTextColor="#bbbcc8"
                        value={instituicao}
                        onChangeText={setInstituicao}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Papel */}
              <View style={[r.halfField, { zIndex: 10 }]}>
                <TouchableOpacity
                  style={r.inlineInput}
                  onPress={() => setPapelOpen(!papelOpen)}
                  activeOpacity={0.8}
                >
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>🛡️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Seu papel</Text>
                      <Text
                        style={[
                          r.inlineTextInput,
                          { color: papel ? "#1a1a2e" : "#bbbcc8" },
                        ]}
                      >
                        {papel || "Selecione..."}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: "#aaa" }}>▼</Text>
                </TouchableOpacity>

                {papelOpen && (
                  <View style={r.dropdown}>
                    {papeis.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={r.dropdownItem}
                        onPress={() => {
                          setPapel(p);
                          setPapelOpen(false);
                        }}
                      >
                        <Text style={r.dropdownText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Banner segurança */}
            <View style={r.securityBanner}>
              <Text style={r.securityIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={r.securityTitle}>Seus dados estão protegidos</Text>
                <Text style={r.securityText}>
                  Utilizamos criptografia e boas práticas de segurança para
                  garantir a privacidade das suas informações.
                </Text>
              </View>
            </View>

            {/* Botão Criar conta */}
            <TouchableOpacity
              style={s.btnEntrar}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={s.btnEntrarText}>Criar conta</Text>
              <Text style={s.btnArrow}>→</Text>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou cadastre-se com</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Botão Google */}
            <TouchableOpacity
              style={s.btnGoogle}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <Text style={s.googleIcon}>G</Text>
              <Text style={s.btnGoogleText}>Continuar com Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
