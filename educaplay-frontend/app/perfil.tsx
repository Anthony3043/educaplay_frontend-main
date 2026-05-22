import { styles as s } from "../styles/PerfilStyles";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../src/services/api";

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
  const [cargo, setCargo] = useState(usuario?.cargo || "");
  const [escola, setEscola] = useState(usuario?.instituicao || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || "");
      setCargo(usuario.cargo || "");
      setEscola(usuario.instituicao || "");
    }
  }, [usuario]);

  const fotoExibir = fotoPreview || usuario?.foto || "";

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push(isProfessor ? "/home-professor" : "/home");
    else if (tabId === "cronograma") router.push(isProfessor ? "/cronogramas-professor" : "/cronogramas");
    else if (tabId === "configuracoes") router.push("/configuracoes");
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
        setFotoPreview(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload: any = { nome, cargo, instituicao: escola };
      if (fotoPreview) payload.foto = fotoPreview;
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
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7}>
          {isEditing
            ? <Ionicons name="close" size={20} color="#1a1a2e" />
            : <Ionicons name="pencil-outline" size={20} color="#1a1a2e" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.perfilCard}>
          <TouchableOpacity style={s.fotoContainer} onPress={isEditing ? pickImage : undefined} activeOpacity={isEditing ? 0.7 : 1}>
            {fotoExibir ? (
              <Image source={{ uri: fotoExibir }} style={s.foto} resizeMode="cover" />
            ) : (
              <View style={[s.foto, { backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="person-circle-outline" size={48} color="#bbb" />
              </View>
            )}
            {isEditing && <View style={s.fotoOverlay}><Ionicons name="camera-outline" size={28} color="#fff" /></View>}
          </TouchableOpacity>
          <Text style={s.perfilNome}>{nome}</Text>
          {isProfessor
            ? (cargo ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Ionicons name="book-outline" size={13} color="#3a7d44" />
                  <Text style={[s.perfilCargo, { color: "#3a7d44", fontWeight: "600" }]}>{cargo}</Text>
                </View>
              ) : null)
            : <Text style={s.perfilCargo}>{cargo}</Text>
          }
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Pessoais</Text>
          <View style={s.infoGroup}>
            <Text style={s.label}>Nome Completo</Text>
            {isEditing ? <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Digite seu nome" placeholderTextColor="#bbb" />
              : <Text style={s.infoValue}>{nome}</Text>}
          </View>
          <View style={s.infoGroup}>
            <Text style={s.label}>E-mail</Text>
            <Text style={s.infoValue}>{usuario?.email}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Profissionais</Text>
          <View style={s.infoGroup}>
            <Text style={s.label}>Escola</Text>
            {isEditing ? <TextInput style={s.input} value={escola} onChangeText={setEscola} placeholder="Nome da escola" placeholderTextColor="#bbb" />
              : <Text style={s.infoValue}>{escola || "—"}</Text>}
          </View>
          <View style={s.infoGroup}>
            <Text style={s.label}>{isProfessor ? "Matéria" : "Cargo"}</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={cargo}
                onChangeText={setCargo}
                placeholder={isProfessor ? "Ex: Matemática, Português..." : "Seu cargo"}
                placeholderTextColor="#bbb"
              />
            ) : (
              <Text style={s.infoValue}>{cargo || "—"}</Text>
            )}
          </View>
          <View style={s.infoGroup}>
            <Text style={s.label}>Papel</Text>
            <Text style={s.infoValue}>{usuario?.papel === "Supervisao" ? "Supervisão" : usuario?.papel}</Text>
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity style={[s.btnSalvar, isLoading && s.btnSalvarLoading]} onPress={handleSave} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnSalvarText}>Salvar Alterações</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>

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
