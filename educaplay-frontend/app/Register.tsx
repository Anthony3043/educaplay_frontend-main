import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { loginStyles as s } from "../styles/loginStyles";
import { registerStyles as r } from "../styles/registerStyles";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [papel, setPapel] = useState("");

  // ── Matérias (múltiplas) ──────────────────────────────────────────────────
  const [materias, setMaterias] = useState<string[]>([]);
  const [materiaInput, setMateriaInput] = useState("");

  const adicionarMateria = () => {
    const trimmed = materiaInput.trim();
    if (!trimmed) return;
    if (materias.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMateriaInput("");
      return;
    }
    setMaterias((prev) => [...prev, trimmed]);
    setMateriaInput("");
  };

  const removerMateria = (idx: number) => {
    setMaterias((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Senha ─────────────────────────────────────────────────────────────────
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);
  const [papelOpen, setPapelOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroEmail, setErroEmail] = useState("");
  const [erroNome, setErroNome] = useState("");

  // Previne double-tap
  const submitting = useRef(false);

  const senhasIguais = confirmarSenha.length > 0 && senha === confirmarSenha;
  const senhasDispares = confirmarSenha.length > 0 && senha !== confirmarSenha;

  const papeis = ["Supervisao", "Professor"];

  const handleRegister = async () => {
    // Previne duplo clique
    if (submitting.current || carregando) return;

    // Limpa erros anteriores
    setErroNome("");
    setErroEmail("");

    // Validação completa antes de qualquer chamada
    const nomePartes = nome.trim().split(/\s+/);
    if (nomePartes.length < 2 || nomePartes.some((p) => p.length < 2)) {
      setErroNome("Informe seu nome completo (nome e sobrenome).");
      return;
    }
    if (!email.trim()) {
      setErroEmail("O e-mail é obrigatório.");
      return;
    }
    if (!senha || !papel) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }
    if (papel === "Professor" && materias.length === 0) {
      Alert.alert("Atenção", "Informe pelo menos uma matéria que você leciona.");
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

    submitting.current = true;
    setCarregando(true);
    try {
      const usuario = await register({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        papel,
        instituicao,
        materias: papel === "Professor" ? materias : [],
      });
      if (usuario.papel === "Professor") {
        router.replace("/home-professor");
      } else {
        router.replace("/home");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (status === 409) {
        setErroEmail("Este e-mail já está cadastrado. Use outro ou faça login.");
      } else {
        Alert.alert("Erro no cadastro", backendMsg || err?.message || "Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setCarregando(false);
      submitting.current = false;
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
                <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
              </TouchableOpacity>
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

          <View style={[s.card, { marginTop: 0 }]}>
            <Text style={s.welcomeTitle}>Crie sua conta</Text>
            <Text style={s.welcomeSubtitle}>Preencha os dados abaixo para começar</Text>

            {/* Nome */}
            <View style={[r.inlineInput, erroNome ? { borderColor: "#ef4444", borderWidth: 1.5 } : null]}>
              <View style={r.inlineIconLabel}>
                <Ionicons name="person-outline" size={18} color="#888" style={r.inlineIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>Nome completo *</Text>
                  <TextInput
                    style={r.inlineTextInput}
                    placeholder="Digite seu nome e sobrenome"
                    placeholderTextColor="#bbbcc8"
                    value={nome}
                    onChangeText={(t) => { setNome(t); setErroNome(""); }}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>
            {erroNome ? (
              <Text style={reg.erro}>✗ {erroNome}</Text>
            ) : null}

            {/* E-mail */}
            <View style={[r.inlineInput, erroEmail ? { borderColor: "#ef4444", borderWidth: 1.5 } : null]}>
              <View style={r.inlineIconLabel}>
                <Ionicons name="mail-outline" size={18} color="#888" style={r.inlineIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={r.inlineLabel}>E-mail</Text>
                  <TextInput
                    style={r.inlineTextInput}
                    placeholder="Digite seu e-mail"
                    placeholderTextColor="#bbbcc8"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErroEmail(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>
            {erroEmail ? (
              <Text style={reg.erro}>✗ {erroEmail}</Text>
            ) : null}

            {/* Senha */}
            <View style={r.inlineInput}>
              <View style={r.inlineIconLabel}>
                <Ionicons name="lock-closed-outline" size={18} color="#888" style={r.inlineIcon} />
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
                <Ionicons name={senhaVisivel ? "eye-off-outline" : "eye-outline"} size={20} color="#888" style={s.eyeIcon} />
              </TouchableOpacity>
            </View>

            {/* Confirmar senha */}
            <View style={[
              r.inlineInput,
              senhasIguais && { borderColor: "#3a7d44", borderWidth: 1.5 },
              senhasDispares && { borderColor: "#ef4444", borderWidth: 1.5 },
            ]}>
              <View style={r.inlineIconLabel}>
                <Ionicons name="lock-closed-outline" size={18} color="#888" style={r.inlineIcon} />
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
              <TouchableOpacity onPress={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}>
                <Ionicons name={confirmarSenhaVisivel ? "eye-off-outline" : "eye-outline"} size={20} color="#888" style={s.eyeIcon} />
              </TouchableOpacity>
            </View>
            {senhasDispares && (
              <Text style={reg.erro}>✗ As senhas não coincidem</Text>
            )}
            {senhasIguais && (
              <Text style={[reg.erro, { color: "#3a7d44" }]}>✓ Senhas coincidem</Text>
            )}

            {/* Instituição + Papel */}
            <View style={[r.rowInputs, { alignItems: "stretch", marginBottom: 12 }]}>
              <View style={r.halfField}>
                <View style={[r.inlineInput, { flex: 1, marginBottom: 0 }]}>
                  <View style={r.inlineIconLabel}>
                    <Ionicons name="school-outline" size={18} color="#888" style={r.inlineIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={r.inlineLabel}>Instituição (opcional)</Text>
                      <TextInput
                        style={r.inlineTextInput}
                        placeholder="Nome da escola"
                        placeholderTextColor="#bbbcc8"
                        value={instituicao}
                        onChangeText={setInstituicao}
                      />
                    </View>
                  </View>
                </View>
              </View>
              <View style={r.halfField}>
                <TouchableOpacity
                  style={[r.inlineInput, papel ? r.inlineInputActive : null, { flex: 1, marginBottom: 0 }]}
                  onPress={() => setPapelOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={r.inlineIconLabel}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#888" style={r.inlineIcon} />
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

            {/* Campo matérias — somente para Professor */}
            {papel === "Professor" && (
              <View style={reg.materiaBlock}>
                <Text style={reg.materiaLabel}>
                  Matérias que você leciona <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>

                {/* Chips das matérias adicionadas */}
                {materias.length > 0 && (
                  <View style={reg.chipsRow}>
                    {materias.map((m, idx) => (
                      <View key={idx} style={reg.chip}>
                        <Text style={reg.chipText}>{m}</Text>
                        <TouchableOpacity onPress={() => removerMateria(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close" size={13} color="#2d6a4f" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Input + botão Adicionar */}
                <View style={reg.addRow}>
                  <View style={[r.inlineInput, { flex: 1, marginBottom: 0 }]}>
                    <View style={r.inlineIconLabel}>
                      <Ionicons name="book-outline" size={18} color="#888" style={r.inlineIcon} />
                      <TextInput
                        style={[r.inlineTextInput, { flex: 1 }]}
                        placeholder="Ex: Matemática, Português..."
                        placeholderTextColor="#bbbcc8"
                        value={materiaInput}
                        onChangeText={setMateriaInput}
                        autoCapitalize="words"
                        onSubmitEditing={adicionarMateria}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={reg.addBtn} onPress={adicionarMateria} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={reg.materiaHint}>
                  Adicione uma de cada vez. Toque + ou pressione "concluir".
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btnEntrar, (carregando) && { opacity: 0.7 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={carregando}
            >
              {carregando ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={s.btnEntrarText}>Criar conta</Text>
                  <Text style={s.btnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={[s.createAccountRow, { marginTop: 16 }]}>
              <Text style={s.createAccountText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={s.createAccountLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const reg = StyleSheet.create({
  erro: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: -8,
    marginBottom: 4,
    marginLeft: 2,
  },
  materiaBlock: {
    marginBottom: 12,
  },
  materiaLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e8f5ea",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#52b788",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d6a4f",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    backgroundColor: "#3a7d44",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  materiaHint: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 6,
  },
});
