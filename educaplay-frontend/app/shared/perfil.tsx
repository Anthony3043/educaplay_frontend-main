import { styles as s } from "../../styles/PerfilStyles";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
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
    if (status !== "granted") { Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria."); return; }
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
      Alert.alert("Erro", "Não foi possível atualizar a foto.");
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
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Perfil</Text>
        {isProfessor ? (
          <View style={{ width: 40 }} />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7} style={{ width: 40, alignItems: "flex-end" }}>
            {isEditing
              ? <Ionicons name="close" size={20} color="#1a1a2e" />
              : <Ionicons name="pencil-outline" size={20} color="#1a1a2e" />}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={s.perfilCard}>
          <TouchableOpacity style={s.fotoContainer} onPress={(isProfessor || isEditing) && !isLoading ? pickImage : undefined} activeOpacity={(isProfessor || isEditing) ? 0.7 : 1}>
            {fotoExibir ? (
              <Image source={{ uri: fotoExibir }} style={s.foto} resizeMode="cover" />
            ) : (
              <View style={[s.foto, { backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="person-circle-outline" size={48} color="#bbb" />
              </View>
            )}
            {(isProfessor || isEditing) && (
              <View style={s.fotoOverlay}>
                {isLoading && isProfessor
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera-outline" size={28} color="#fff" />}
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.perfilNome}>{nome}</Text>
          <Text style={s.perfilCargo}>{usuario?.papel === "Supervisao" ? "Supervisão" : usuario?.papel}</Text>
          {isProfessor && (
            <Text style={pf.fotoDica}>Toque na foto para alterá-la</Text>
          )}

          {/* Chips de matérias no card de perfil (somente professor) */}
          {isProfessor && (usuario?.materias ?? []).length > 0 && (
            <View style={pf.chipsRow}>
              {(usuario?.materias ?? []).map((m, idx) => (
                <View key={idx} style={pf.chip}>
                  <Ionicons name="book-outline" size={11} color="#2d6a4f" />
                  <Text style={pf.chipText}>{m}</Text>
                </View>
              ))}
            </View>
          )}
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
    </SafeAreaView>
  );
}

const pf = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e8f5ea",
    borderRadius: 20,
    paddingHorizontal: 11,
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
    marginTop: 8,
  },
  addBtn: {
    backgroundColor: "#3a7d44",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 6,
  },
  fotoDica: {
    fontSize: 11,
    color: "#3a7d44",
    marginTop: 4,
    fontWeight: "600",
  },
});
