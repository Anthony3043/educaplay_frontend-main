import { styles as s } from "../../styles/PerfilStyles";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../src/services/api";

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "cronograma", ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, atualizarUsuario } = useAuth();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const isProfessor = usuario?.papel === "Professor";

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [escola, setEscola] = useState(usuario?.instituicao || "");
  const [materias, setMaterias] = useState<string[]>(usuario?.materias ?? []);
  const [materiaInput, setMateriaInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || "");
      setEscola(usuario.instituicao || "");
      setMaterias(usuario.materias ?? []);
    }
  }, [usuario]);

  const fotoExibir = fotoPreview || usuario?.foto || "";

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push(isProfessor ? "/professor/home-professor" : "/supervisao/home");
    else if (tabId === "cronograma") router.push(isProfessor ? "/professor/cronogramas-professor" : "/supervisao/cronogramas");
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showInfo("Permissão necessária", "Precisamos de acesso à sua galeria.", "aviso"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const fotoData = `data:image/jpeg;base64,${asset.base64}`;
        setFotoPreview(fotoData);
        if (isProfessor) await salvarFoto(fotoData);
      }
    }
  };

  const salvarFoto = async (fotoData: string) => {
    setIsLoading(true);
    try {
      const res = await api.put("/auth/perfil", { foto: fotoData });
      atualizarUsuario(res.data);
      setFotoPreview(null);
    } catch {
      showInfo("Erro", "Não foi possível atualizar a foto.", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Matérias ──────────────────────────────────────────────────────────────
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload: any = { nome, instituicao: escola };
      if (fotoPreview) payload.foto = fotoPreview;
      if (isProfessor) payload.materias = materias;
      const res = await api.put("/auth/perfil", payload);
      atualizarUsuario(res.data);
      setFotoPreview(null);
      setIsEditing(false);
      showInfo("Sucesso", "Perfil atualizado com sucesso!", "sucesso");
    } catch {
      showInfo("Erro", "Não foi possível salvar o perfil.", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Perfil</Text>
        {isProfessor ? (
          <View style={{ width: 40 }} />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7} style={s.backBtn}>
            {isEditing
              ? <Ionicons name="close" size={20} color="#fff" />
              : <Ionicons name="pencil-outline" size={20} color="#fff" />}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Hero card do perfil */}
        <View style={pf.heroCard}>
          {/* Fundo verde */}
          <View style={pf.heroBg}>
            <View style={pf.heroDeco1} />
            <View style={pf.heroDeco2} />
            <View style={pf.heroBadgeRow}>
              <View style={pf.heroBadge}>
                <Ionicons name={isProfessor ? "school-outline" : "ribbon-outline"} size={12} color="rgba(255,255,255,0.9)" />
                <Text style={pf.heroBadgeText}>{isProfessor ? "Professor" : "Supervisão"}</Text>
              </View>
            </View>
          </View>

          {/* Avatar flutuando */}
          <View style={pf.avatarWrap}>
            <TouchableOpacity
              style={pf.avatarRing}
              onPress={(isProfessor || isEditing) && !isLoading ? pickImage : undefined}
              activeOpacity={(isProfessor || isEditing) ? 0.8 : 1}
            >
              {fotoExibir ? (
                <Image source={{ uri: fotoExibir }} style={pf.avatarImg} resizeMode="cover" />
              ) : (
                <View style={pf.avatarPlaceholder}>
                  <Text style={pf.avatarInitial}>{nome.trim()[0]?.toUpperCase() ?? "?"}</Text>
                </View>
              )}
              {(isProfessor || isEditing) && (
                <View style={pf.cameraOverlay}>
                  {isLoading && isProfessor
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="camera-outline" size={18} color="#fff" />}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={pf.heroInfo}>
            <Text style={pf.heroNome}>{nome}</Text>
            {usuario?.email ? <Text style={pf.heroEmail}>{usuario.email}</Text> : null}
            {isProfessor && (usuario?.materias ?? []).length > 0 && (
              <View style={pf.chipsRow}>
                {(usuario?.materias ?? []).map((m, idx) => (
                  <View key={idx} style={pf.chip}>
                    <Ionicons name="book-outline" size={10} color="#2d6a4f" />
                    <Text style={pf.chipText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
            {isProfessor && <Text style={pf.fotoDica}>Toque na foto para alterá-la</Text>}
          </View>
        </View>

        {/* Informações pessoais */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Pessoais</Text>
          <View style={s.infoGroup}>
            <Text style={s.label}>Nome Completo</Text>
            {isEditing && !isProfessor
              ? <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Digite seu nome" placeholderTextColor="#bbb" />
              : <Text style={s.infoValue}>{nome}</Text>}
          </View>
          <View style={s.infoGroup}>
            <Text style={s.label}>E-mail</Text>
            <Text style={s.infoValue}>{usuario?.email}</Text>
          </View>
        </View>

        {/* Informações profissionais */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Profissionais</Text>
          <View style={s.infoGroup}>
            <Text style={s.label}>Escola</Text>
            {isEditing && !isProfessor
              ? <TextInput style={s.input} value={escola} onChangeText={setEscola} placeholder="Nome da escola" placeholderTextColor="#bbb" />
              : <Text style={s.infoValue}>{escola || "—"}</Text>}
          </View>
          <View style={s.infoGroup}>
            <Text style={s.label}>Cargo</Text>
            <Text style={s.infoValue}>{usuario?.papel === "Supervisao" ? "Supervisão" : usuario?.papel}</Text>
          </View>
        </View>

        {/* Seção de matérias — somente professor */}
        {isProfessor && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Matérias que leciono</Text>

            {/* View mode: chips somente leitura */}
            {!isEditing && (
              materias.length > 0 ? (
                <View style={pf.chipsRow}>
                  {materias.map((m, idx) => (
                    <View key={idx} style={pf.chip}>
                      <Ionicons name="book-outline" size={12} color="#2d6a4f" />
                      <Text style={pf.chipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.infoValue}>Nenhuma matéria adicionada.</Text>
              )
            )}

            {/* Edit mode: chips removíveis + input */}
            {isEditing && (
              <View>
                {materias.length > 0 && (
                  <View style={pf.chipsRow}>
                    {materias.map((m, idx) => (
                      <View key={idx} style={pf.chip}>
                        <Ionicons name="book-outline" size={12} color="#2d6a4f" />
                        <Text style={pf.chipText}>{m}</Text>
                        <TouchableOpacity onPress={() => removerMateria(idx)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}>
                          <Ionicons name="close" size={13} color="#2d6a4f" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={pf.addRow}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={materiaInput}
                    onChangeText={setMateriaInput}
                    placeholder="Ex: Matemática, Física..."
                    placeholderTextColor="#bbb"
                    autoCapitalize="words"
                    onSubmitEditing={adicionarMateria}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={pf.addBtn} onPress={adicionarMateria} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={pf.hint}>Adicione uma matéria de cada vez. Toque + ou "concluir" no teclado.</Text>
              </View>
            )}
          </View>
        )}

        {isEditing && !isProfessor && (
          <TouchableOpacity
            style={[s.btnSalvar, isLoading && s.btnSalvarLoading]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnSalvarText}>Salvar Alterações</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={s.tabItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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

const pf = StyleSheet.create({
  // Hero
  heroCard: {
    marginHorizontal: 0, marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
  },
  heroBg: {
    backgroundColor: "#3a7d44", height: 110,
    overflow: "hidden", paddingHorizontal: 20, paddingTop: 16,
  },
  heroDeco1: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: 40,
  },
  heroDeco2: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -20,
  },
  heroBadgeRow: { flexDirection: "row" },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  avatarWrap: { alignItems: "center", marginTop: -44 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 4, borderColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    overflow: "hidden",
  },
  avatarImg: { width: 80, height: 80 },
  avatarPlaceholder: {
    width: 80, height: 80,
    backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "800", color: "#fff" },
  cameraOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 28,
    backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center",
  },
  heroInfo: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, gap: 4 },
  heroNome: { fontSize: 20, fontWeight: "800", color: "#111827" },
  heroEmail: { fontSize: 13, color: "#6B7280" },

  // Chips
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, justifyContent: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#e8f5ea", borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: "#52b788",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#2d6a4f" },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  addBtn: {
    backgroundColor: "#3a7d44", borderRadius: 10,
    padding: 12, alignItems: "center", justifyContent: "center",
  },
  hint: { fontSize: 11, color: "#aaa", marginTop: 6 },
  fotoDica: { fontSize: 11, color: "rgba(58,125,68,0.7)", fontWeight: "600", marginTop: 4 },
});
