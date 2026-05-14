import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView,
  Modal, Platform, SafeAreaView, ScrollView, StatusBar,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { loginStyles as s } from "../styles/LoginStyles";
import { registerStyles as r } from "../styles/RegisterStyles";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [papel, setPapel] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);
  const [papelOpen, setPapelOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const senhasIguais = confirmarSenha.length > 0 && senha === confirmarSenha;
  const senhasDispares = confirmarSenha.length > 0 && senha !== confirmarSenha;

  const papeis = ["Supervisao", "Professor"];

  const handleRegister = async () => {
    if (!nome.trim() || !email.trim() || !senha || !papel) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      const usuario = await register({ nome: nome.trim(), email: email.trim(), senha, papel, instituicao });
      if (usuario.papel === "Professor") {
        router.replace("/home-professor");
      } else {
        router.replace("/home");
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || (err as any)?.message || "Erro ao criar conta. Verifique se o servidor está rodando.";
      Alert.alert("Erro", msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Modal visible={papelOpen} transparent animationType="fade" onRequestClose={() => setPapelOpen(false)}>
        <TouchableOpacity style={r.modalOverlay} activeOpacity={1} onPress={() => setPapelOpen(false)}>
          <View style={r.modalDropdown}>
            <Text style={r.modalDropdownTitle}>Selecione seu papel</Text>
            {papeis.map((p) => (
              <TouchableOpacity key={p} style={r.dropdownItem} onPress={() => { setPapel(p); setPapelOpen(false); }}>
                <Text style={[r.dropdownText, papel === p && r.dropdownTextActive]}>
                  {p === "Supervisao" ? "🏫 Supervisão" : "👨🏫 Professor"}
                </Text>
                {papel === p && <Text style={r.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={r.topBlock}>
            <Image source={require("@/assets/images/design_foil.png")} style={r.foil} resizeMode="cover" />
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
                  <Image source={require("@/assets/images/logo_icon.png")} style={s.logoImage} resizeMode="contain" />
                  <Text style={s.logoText}>Educa<Text style={s.logoTextAccent}>Play</Text></Text>
                </View>
                <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>
              </View>
              <View style={r.mascoteSide}>
                <Image source={require("@/assets/images/register_ze_bloco.png")} style={r.mascoteImage} resizeMode="contain" />
              </View>
            </View>
          </View>

          <View style={[s.card, { backgroundColor: "transparent" }]}>
            <Text style={s.welcomeTitle}>Crie sua conta</Text>
            <Text style={s.welcomeSubtitle}>Preencha os dados abaixo para começar</Text>

            <View style={r.rowInputs}>
              <View style={r.halfField}>
                <View style={r.inlineInput}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>👤</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Nome completo</Text>
                      <TextInput style={r.inlineTextInput} placeholder="Digite seu nome" placeholderTextColor="#bbbcc8"
                        value={nome} onChangeText={setNome} autoCapitalize="words" />
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
                      <TextInput style={r.inlineTextInput} placeholder="Digite seu e-mail" placeholderTextColor="#bbbcc8"
                        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={r.inlineInput}>
              <View style={r.inlineIconLabel}>
                <Text style={r.inlineIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>Senha</Text>
                  <TextInput style={r.inlineTextInput} placeholder="Crie uma senha" placeholderTextColor="#bbbcc8"
                    value={senha} onChangeText={setSenha} secureTextEntry={!senhaVisivel} autoCapitalize="none" />
                </View>
              </View>
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                <Text style={s.eyeIcon}>{senhaVisivel ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <View style={[r.inlineInput, senhasIguais && { borderColor: '#3a7d44', borderWidth: 1.5 }, senhasDispares && { borderColor: '#ef4444', borderWidth: 1.5 }]}>
              <View style={r.inlineIconLabel}>
                <Text style={r.inlineIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>Confirmar senha</Text>
                  <TextInput style={r.inlineTextInput} placeholder="Digite novamente a sua senha" placeholderTextColor="#bbbcc8"
                    value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry={!confirmarSenhaVisivel} autoCapitalize="none" />
                </View>
              </View>
              <TouchableOpacity onPress={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}>
                <Text style={s.eyeIcon}>{confirmarSenhaVisivel ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            {senhasDispares && (
              <Text style={{ fontSize: 12, color: '#ef4444', marginTop: -8, marginBottom: 4, marginLeft: 2 }}>
                ✗ As senhas não coincidem
              </Text>
            )}
            {senhasIguais && (
              <Text style={{ fontSize: 12, color: '#3a7d44', marginTop: -8, marginBottom: 4, marginLeft: 2 }}>
                ✓ Senhas coincidem
              </Text>
            )}

            <View style={r.rowInputs}>
              <View style={r.halfField}>
                <View style={r.inlineInput}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>🏫</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Instituição (opcional)</Text>
                      <TextInput style={r.inlineTextInput} placeholder="Nome da instituição" placeholderTextColor="#bbbcc8"
                        value={instituicao} onChangeText={setInstituicao} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={r.halfField}>
                <TouchableOpacity style={[r.inlineInput, papel ? r.inlineInputActive : null]} onPress={() => setPapelOpen(true)} activeOpacity={0.8}>
                  <View style={r.inlineIconLabel}>
                    <Text style={r.inlineIcon}>🛡️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Seu papel *</Text>
                      <Text style={[r.inlineTextInput, { color: papel ? "#1a1a2e" : "#bbbcc8" }]}>
                        {papel === "Supervisao" ? "Supervisão" : papel || "Selecione..."}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: "#aaa" }}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.btnEntrar} onPress={handleRegister} activeOpacity={0.85} disabled={carregando}>
              {carregando ? <ActivityIndicator color="#fff" /> : <>
                <Text style={s.btnEntrarText}>Criar conta</Text>
                <Text style={s.btnArrow}>→</Text>
              </>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
