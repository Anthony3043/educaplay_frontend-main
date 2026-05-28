import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  Modal,
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

type Config = { latitude: number; longitude: number; raio: number };

export default function ConfiguracaoEscolaScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({ latitude: 0, longitude: 0, raio: 200 });
  const [raioStr, setRaioStr] = useState("200");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [obtendoLoc, setObtendoLoc] = useState(false);

  // Manual input
  const [latStr, setLatStr] = useState("");
  const [lonStr, setLonStr] = useState("");
  const [modalManualVisivel, setModalManualVisivel] = useState(false);
  const [localNome, setLocalNome] = useState<string | null>(null);

  const configurado = config.latitude !== 0 || config.longitude !== 0;

  useEffect(() => {
    api.get("/configuracao-escola")
      .then((res) => {
        const c: Config = res.data;
        setConfig(c);
        setRaioStr(String(c.raio ?? 200));
        if (c.latitude !== 0 || c.longitude !== 0) {
          setLatStr(String(c.latitude));
          setLonStr(String(c.longitude));
        }
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
      const { latitude, longitude } = loc.coords;
      setConfig((prev) => ({ ...prev, latitude, longitude }));
      setLatStr(String(latitude));
      setLonStr(String(longitude));
      setLocalNome("Localização atual do dispositivo");
    } catch {
      Alert.alert("Erro", "Não foi possível obter sua localização.");
    } finally {
      setObtendoLoc(false);
    }
  };

  const confirmarManual = () => {
    const lat = parseFloat(latStr.replace(",", ".").trim());
    const lon = parseFloat(lonStr.replace(",", ".").trim());
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      Alert.alert("Coordenadas inválidas", "Verifique a latitude e longitude informadas.");
      return;
    }
    setConfig((prev) => ({ ...prev, latitude: lat, longitude: lon }));
    setLocalNome(null);
    setModalManualVisivel(false);
  };

  const handleSalvar = async () => {
    if (!configurado) {
      Alert.alert("Atenção", "Defina a localização da escola antes de salvar.");
      return;
    }
    const raio = parseFloat(raioStr.replace(",", "."));
    if (isNaN(raio) || raio < 10) {
      Alert.alert("Atenção", "O raio deve ser de no mínimo 10 metros.");
      return;
    }
    setSalvando(true);
    try {
      await api.put("/configuracao-escola", { latitude: config.latitude, longitude: config.longitude, raio });
      Alert.alert("Salvo!", "Localização da escola atualizada com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  };

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
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

          {/* Status */}
          <View style={[st.statusCard, configurado ? st.statusOk : st.statusPendente]}>
            <Ionicons name={configurado ? "location" : "location-outline"} size={22} color={configurado ? "#3a7d44" : "#f97316"} />
            <View style={{ flex: 1 }}>
              <Text style={[st.statusTitulo, { color: configurado ? "#3a7d44" : "#f97316" }]}>
                {configurado ? "Localização configurada" : "Localização não configurada"}
              </Text>
              <Text style={st.statusDescricao} numberOfLines={2}>
                {localNome
                  ? localNome
                  : configurado
                  ? `${config.latitude.toFixed(6)}, ${config.longitude.toFixed(6)}`
                  : "Defina o local da escola para habilitar o registro de ponto."}
              </Text>
            </View>
          </View>

          {/* Opção 1: GPS */}
          <View style={st.opcaoCard}>
            <View style={st.opcaoHeader}>
              <View style={[st.opcaoIcone, { backgroundColor: "#e8f5ea" }]}>
                <Ionicons name="navigate" size={20} color="#3a7d44" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.opcaoTitulo}>Usar localização atual</Text>
                <Text style={st.opcaoDesc}>Vá até a escola e toque no botão abaixo</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[st.btnGPS, obtendoLoc && { opacity: 0.7 }]}
              onPress={obterLocalizacaoAtual}
              disabled={obtendoLoc}
              activeOpacity={0.85}
            >
              {obtendoLoc
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="navigate-outline" size={18} color="#fff" />}
              <Text style={st.btnGPSText}>
                {obtendoLoc ? "Obtendo localização..." : "Capturar minha localização agora"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={st.separador}>
            <View style={st.separadorLinha} />
            <Text style={st.separadorTexto}>ou</Text>
            <View style={st.separadorLinha} />
          </View>

          {/* Opção 2: Coordenadas manuais */}
          <View style={st.opcaoCard}>
            <View style={st.opcaoHeader}>
              <View style={[st.opcaoIcone, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="pencil" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.opcaoTitulo}>Inserir coordenadas</Text>
                <Text style={st.opcaoDesc}>Cole as coordenadas copiadas do Google Maps</Text>
              </View>
            </View>
            <TouchableOpacity style={st.btnManual} onPress={() => setModalManualVisivel(true)} activeOpacity={0.85}>
              <Ionicons name="location-outline" size={18} color="#3b82f6" />
              <Text style={st.btnManualText}>Inserir latitude e longitude</Text>
            </TouchableOpacity>
            <View style={st.dicaMapsCard}>
              <Ionicons name="logo-google" size={14} color="#888" />
              <Text style={st.dicaMapsText}>
                No Google Maps: toque e segure no local da escola → copie as coordenadas que aparecem na parte de baixo da tela
              </Text>
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
                placeholderTextColor="#bbb"
                value={raioStr}
                onChangeText={setRaioStr}
                keyboardType="number-pad"
              />
            </View>
            <Text style={st.inputHint}>
              Distância máxima da escola para o professor conseguir bater o ponto (mínimo 10m)
            </Text>
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[st.btnSalvar, (!configurado || salvando) && { opacity: 0.5 }]}
            onPress={handleSalvar}
            disabled={!configurado || salvando}
            activeOpacity={0.85}
          >
            {salvando ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={st.btnSalvarText}>Salvar Localização</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal coordenadas manuais */}
      <Modal visible={modalManualVisivel} animationType="slide" transparent onRequestClose={() => setModalManualVisivel(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitulo}>Inserir Coordenadas</Text>
            <Text style={st.modalDesc}>
              Cole as coordenadas obtidas do Google Maps ou outro aplicativo de mapas.
            </Text>

            <Text style={st.modalLabel}>Latitude</Text>
            <TextInput
              style={st.modalInput}
              placeholder="-23.550520"
              placeholderTextColor="#bbb"
              value={latStr}
              onChangeText={setLatStr}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />

            <Text style={st.modalLabel}>Longitude</Text>
            <TextInput
              style={st.modalInput}
              placeholder="-46.633308"
              placeholderTextColor="#bbb"
              value={lonStr}
              onChangeText={setLonStr}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />

            <View style={st.modalBtns}>
              <TouchableOpacity style={st.modalBtnCancelar} onPress={() => setModalManualVisivel(false)}>
                <Text style={st.modalBtnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.modalBtnConfirmar} onPress={confirmarManual}>
                <Text style={st.modalBtnConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },

  statusCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1.5,
  },
  statusOk: { backgroundColor: "#e8f5ea", borderColor: "#86efac" },
  statusPendente: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  statusTitulo: { fontSize: 14, fontWeight: "700" },
  statusDescricao: { fontSize: 12, color: "#666", marginTop: 2, lineHeight: 17 },

  opcaoCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: "#E8E8F0",
    backgroundColor: "#fff", padding: 14, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  opcaoHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  opcaoIcone: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  opcaoTitulo: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  opcaoDesc: { fontSize: 12, color: "#888", marginTop: 2 },

  btnGPS: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 12, paddingVertical: 13,
  },
  btnGPSText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  btnManual: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#eff6ff", borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: "#bfdbfe",
  },
  btnManualText: { fontSize: 14, fontWeight: "700", color: "#3b82f6" },

  dicaMapsCard: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "#f9fafb", borderRadius: 10, padding: 10,
  },
  dicaMapsText: { flex: 1, fontSize: 11, color: "#666", lineHeight: 16 },

  separador: { flexDirection: "row", alignItems: "center", gap: 10 },
  separadorLinha: { flex: 1, height: 1, backgroundColor: "#E8E8F0" },
  separadorTexto: { fontSize: 13, color: "#aaa", fontWeight: "600" },

  inputGrupo: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F7F8FA", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E8E8F0",
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, color: "#1a1a2e", padding: 0 },
  inputHint: { fontSize: 11, color: "#aaa", marginTop: 2 },

  btnSalvar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 15,
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnSalvarText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Modal manual
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, gap: 10,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  modalDesc: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 4 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginTop: 4 },
  modalInput: {
    backgroundColor: "#F7F8FA", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E8E8F0",
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a2e",
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtnCancelar: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: "#E8E8F0",
    alignItems: "center",
  },
  modalBtnCancelarText: { fontSize: 14, fontWeight: "700", color: "#888" },
  modalBtnConfirmar: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    backgroundColor: "#3a7d44", alignItems: "center",
  },
  modalBtnConfirmarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
