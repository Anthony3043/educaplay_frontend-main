import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginStyles as s } from "../styles/LoginStyles";
import { registerStyles as r } from "../styles/RegisterStyles";

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

  const papeis = ["Supervisão", "Professor"];

  const handleRegister = () => {
    console.log("Registro:", { nome, email, senha, instituicao, papel });
    router.push("/home");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Dropdown como Modal — renderiza acima de tudo na tela */}
      <Modal
        visible={papelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPapelOpen(false)}
      >
        <TouchableOpacity
          style={r.modalOverlay}
          activeOpacity={1}
          onPress={() => setPapelOpen(false)}
        >
          <View style={r.modalDropdown}>
            <Text style={r.modalDropdownTitle}>Selecione seu papel</Text>
            {papeis.map((p) => (
              <TouchableOpacity
                key={p}
                style={r.dropdownItem}
                onPress={() => {
                  setPapel(p);
                  setPapelOpen(false);
                }}
              >
                <Text
                  style={[r.dropdownText, papel === p && r.dropdownTextActive]}
                >
                  {p}
                </Text>
                {papel === p && <Text style={r.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
            <Image
              source={require("@/assets/images/design_foil.png")}
              style={r.foil}
              resizeMode="cover"
            />

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

          <View style={[s.card, { backgroundColor: "transparent" }]}>
            <Text style={s.welcomeTitle}>Crie sua conta</Text>
            <Text style={s.welcomeSubtitle}>
              Preencha os dados abaixo para começar
            </Text>

            {/* Nome + E-mail em linha */}
            <View style={r.rowInputs}>
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

              {/* Papel — abre Modal ao invés de dropdown inline */}
              <View style={r.halfField}>
                <TouchableOpacity
                  style={[r.inlineInput, papel ? r.inlineInputActive : null]}
                  onPress={() => setPapelOpen(true)}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
