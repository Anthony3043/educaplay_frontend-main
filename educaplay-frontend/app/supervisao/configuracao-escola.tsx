import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import api from "../../src/services/api";

type Config = {
  id?: string;
  latitude: number;
  longitude: number;
  raio: number;
};

export default function ConfiguracaoEscolaScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({ latitude: 0, longitude: 0, raio: 200 });
  const [latStr, setLatStr] = useState("");
  const [lonStr, setLonStr] = useState("");
  const [raioStr, setRaioStr] = useState("200");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [obtendoLoc, setObtendoLoc] = useState(false);

  useEffect(() => {
    api.get("/configuracao-escola")
      .then((res) => {
        const c: Config = res.data;
        setConfig(c);
        setLatStr(c.latitude !== 0 ? String(c.latitude) : "");
        setLonStr(c.longitude !== 0 ? String(c.longitude) : "");
        setRaioStr(String(c.raio ?? 200));
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar as configurações."))
      .finally(() => setCarregando(false));
  }, []);

  const obterLocalizacaoAtual = async () => {
    setObtendoLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Habilite a localização nas configurações do dispositivo.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatStr(String(loc.coords.latitude));
      setLonStr(String(loc.coords.longitude));
    } catch {
      Alert.alert("Erro", "Não foi possível obter sua localização.");
    } finally {
      setObtendoLoc(false);
    }
  };

  const handleSalvar = async () => {
    const lat = parseFloat(latStr.replace(",", "."));
    const lon = parseFloat(lonStr.replace(",", "."));
    const raio = parseFloat(raioStr.replace(",", "."));

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert("Atenção", "Informe latitude e longitude válidas.");
      return;
    }
    if (lat < -90 || lat > 90) {
      Alert.alert("Atenção", "Latitude deve estar entre -90 e 90.");
      return;
    }
    if (lon < -180 || lon > 180) {
      Alert.alert("Atenção", "Longitude deve estar entre -180 e 180.");
      return;
    }
    if (isNaN(raio) || raio < 10) {
      Alert.alert("Atenção", "O raio deve ser de no mínimo 10 metros.");
      return;
    }

    setSalvando(true);
    try {
      await api.put("/configuracao-escola", { latitude: lat, longitude: lon, raio });
      Alert.alert("Salvo!", "Localização da escola atualizada com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  };

  const configurado = latStr !== "" && lonStr !== "" &&
    parseFloat(latStr.replace(",", ".")) !== 0 &&
    parseFloat(lonStr.replace(",", ".")) !== 0;

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="dark-content" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Localização da Escola</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={[st.statusCard, configurado ? st.statusOk : st.statusPendente]}>
            <Ionicons
              name={configurado ? "location" : "location-outline"}
              size={22}
              color={configurado ? "#3a7d44" : "#f97316"}
            />
            <View style={{ flex: 1 }}>
              <Text style={[st.statusTitulo, { color: configurado ? "#3a7d44" : "#f97316" }]}>
                {configurado ? "Localização configurada" : "Localização não configurada"}
              </Text>
              <Text style={st.statusDescricao}>
                {configurado
                  ? "Os professores precisam estar dentro do raio definido para bater ponto."
                  : "Configure a localização para habilitar o registro de ponto por GPS."}
              </Text>
            </View>
          </View>

          {/* Obter localização atual */}
          <TouchableOpacity style={st.btnGPS} onPress={obterLocalizacaoAtual} disabled={obtendoLoc} activeOpacity={0.8}>
            {obtendoLoc ? (
              <ActivityIndicator size="small" color="#3a7d44" />
            ) : (
              <Ionicons name="navigate-outline" size={18} color="#3a7d44" />
            )}
            <Text style={st.btnGPSText}>
              {obtendoLoc ? "Obtendo localização..." : "Usar minha localização atual"}
            </Text>
          </TouchableOpacity>

          {/* Latitude */}
          <View style={st.inputGrupo}>
            <Text style={st.inputLabel}>Latitude *</Text>
            <View style={st.inputRow}>
              <Ionicons name="compass-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={st.input}
                placeholder="-23.550520"
                placeholderTextColor="#ccc"
                value={latStr}
                onChangeText={setLatStr}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Longitude */}
          <View style={st.inputGrupo}>
            <Text style={st.inputLabel}>Longitude *</Text>
            <View style={st.inputRow}>
              <Ionicons name="compass-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={st.input}
                placeholder="-46.633309"
                placeholderTextColor="#ccc"
                value={lonStr}
                onChangeText={setLonStr}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Raio */}
          <View style={st.inputGrupo}>
            <Text style={st.inputLabel}>Raio de tolerância (metros)</Text>
            <View style={st.inputRow}>
              <Ionicons name="radio-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={st.input}
                placeholder="200"
                placeholderTextColor="#ccc"
                value={raioStr}
                onChangeText={setRaioStr}
                keyboardType="number-pad"
              />
            </View>
            <Text style={st.inputHint}>
              Distância máxima permitida da escola para o professor bater ponto (mínimo 10m)
            </Text>
          </View>

          {/* Dica */}
          <View style={st.dicaCard}>
            <Ionicons name="information-circle-outline" size={16} color="#3a7d44" />
            <Text style={st.dicaText}>
              Para obter as coordenadas da escola, use o botão "Usar minha localização" ou busque o endereço no Google Maps e copie as coordenadas.
            </Text>
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[st.btnSalvar, salvando && { opacity: 0.7 }]}
            onPress={handleSalvar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={st.btnSalvarText}>Salvar Localização</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  statusCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1.5,
  },
  statusOk: { backgroundColor: "#e8f5ea", borderColor: "#86efac" },
  statusPendente: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  statusTitulo: { fontSize: 14, fontWeight: "700" },
  statusDescricao: { fontSize: 12, color: "#666", marginTop: 2, lineHeight: 17 },
  btnGPS: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: "#86efac",
  },
  btnGPSText: { fontSize: 14, fontWeight: "600", color: "#3a7d44" },
  inputGrupo: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F7F8FA", borderRadius: 12,
    borderWidth: 1, borderColor: "#E8E8F0",
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, color: "#1a1a2e", padding: 0 },
  inputHint: { fontSize: 11, color: "#aaa" },
  dicaCard: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  dicaText: { flex: 1, fontSize: 12, color: "#3a7d44", lineHeight: 17 },
  btnSalvar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 15,
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnSalvarText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
