import { styles as s } from "../styles/perfilstyles";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "cronograma", icon: "📅", label: "Cronograma" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações" },
];

export default function PerfilScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const [foto, setFoto] = useState("https://via.placeholder.com/120?text=Foto");
  const [nome, setNome] = useState("Anthony Silva");
  const [email, setEmail] = useState("anthony@educaplay.com.br");
  const [telefone, setTelefone] = useState("(11) 99999-9999");
  const [escola, setEscola] = useState("Escola Municipal de Educação");
  const [cargo, setCargo] = useState("Professor de Matemática");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.push("/home");
    } else if (tabId === "cronograma") {
      router.push("/cronogramas");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à sua galeria.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simula salvamento
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setIsEditing(false);
    Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          activeOpacity={0.7}
        >
          <Text style={s.editBtn}>{isEditing ? "✕" : "✏️"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Foto de Perfil */}
        <View style={s.perfilCard}>
          <TouchableOpacity
            style={s.fotoContainer}
            onPress={isEditing ? pickImage : undefined}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            <Image source={{ uri: foto }} style={s.foto} resizeMode="cover" />
            {isEditing && (
              <View style={s.fotoOverlay}>
                <Text style={s.fotoOverlayText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.perfilNome}>{nome}</Text>
          <Text style={s.perfilCargo}>{cargo}</Text>
        </View>

        {/* Seção de Informações */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Pessoais</Text>

          {/* Nome */}
          <View style={s.infoGroup}>
            <Text style={s.label}>Nome Completo</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                placeholderTextColor="#bbb"
              />
            ) : (
              <Text style={s.infoValue}>{nome}</Text>
            )}
          </View>

          {/* Email */}
          <View style={s.infoGroup}>
            <Text style={s.label}>E-mail</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#bbb"
                keyboardType="email-address"
              />
            ) : (
              <Text style={s.infoValue}>{email}</Text>
            )}
          </View>

          {/* Telefone */}
          <View style={s.infoGroup}>
            <Text style={s.label}>Telefone</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(XX) XXXXX-XXXX"
                placeholderTextColor="#bbb"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={s.infoValue}>{telefone}</Text>
            )}
          </View>
        </View>

        {/* Seção Profissional */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Informações Profissionais</Text>

          {/* Escola */}
          <View style={s.infoGroup}>
            <Text style={s.label}>Escola</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={escola}
                onChangeText={setEscola}
                placeholder="Digite o nome da escola"
                placeholderTextColor="#bbb"
              />
            ) : (
              <Text style={s.infoValue}>{escola}</Text>
            )}
          </View>

          {/* Cargo */}
          <View style={s.infoGroup}>
            <Text style={s.label}>Cargo</Text>
            {isEditing ? (
              <TextInput
                style={s.input}
                value={cargo}
                onChangeText={setCargo}
                placeholder="Digite seu cargo"
                placeholderTextColor="#bbb"
              />
            ) : (
              <Text style={s.infoValue}>{cargo}</Text>
            )}
          </View>
        </View>

        {/* Botão Salvar */}
        {isEditing && (
          <TouchableOpacity
            style={[s.btnSalvar, isLoading && s.btnSalvarLoading]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={s.btnSalvarText}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabIcon, isActive && s.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
