import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
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
  latitude: number;
  longitude: number;
  raio: number;
};

type ResultadoBusca = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export default function ConfiguracaoEscolaScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({ latitude: 0, longitude: 0, raio: 200 });
  const [raioStr, setRaioStr] = useState("200");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [obtendoLoc, setObtendoLoc] = useState(false);

  // Busca por endereço
  const [buscaTexto, setBuscaTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [localSelecionado, setLocalSelecionado] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configurado = config.latitude !== 0 || config.longitude !== 0;

  useEffect(() => {
    api.get("/configuracao-escola")
      .then((res) => {
        const c: Config = res.data;
        setConfig(c);
        setRaioStr(String(c.raio ?? 200));
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar as configurações."))
      .finally(() => setCarregando(false));
  }, []);

  const buscarEndereco = async (texto: string) => {
    if (texto.trim().length < 4) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "EducaPlay/1.0" },
      });
      const data: ResultadoBusca[] = await res.json();
      setResultados(data);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscaChange = (texto: string) => {
    setBuscaTexto(texto);
    setLocalSelecionado(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarEndereco(texto), 600);
  };

  const selecionarResultado = (item: ResultadoBusca) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setConfig((prev) => ({ ...prev, latitude: lat, longitude: lon }));
    setLocalSelecionado(item.display_name);
    setBuscaTexto(item.display_name.split(",")[0]);
    setResultados([]);
    Keyboard.dismiss();
  };

  const obterLocalizacaoAtual = async () => {
    setObtendoLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Habilite a localização nas configurações do dispositivo.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setConfig((prev) => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));

      // Geocodificação reversa para mostrar o endereço
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json`;
      fetch(url, { headers: { "User-Agent": "EducaPlay/1.0" } })
        .then((r) => r.json())
        .then((d) => setLocalSelecionado(d.display_name ?? "Localização atual"))
        .catch(() => setLocalSelecionado("Localização atual"));

      setBuscaTexto("");
      setResultados([]);
    } catch {
      Alert.alert("Erro", "Não foi possível obter sua localização.");
    } finally {
      setObtendoLoc(false);
    }
  };

  const handleSalvar = async () => {
    if (!configurado) {
      Alert.alert("Atenção", "Selecione a localização da escola antes de salvar.");
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
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Status da configuração */}
          <View style={[st.statusCard, configurado ? st.statusOk : st.statusPendente]}>
            <Ionicons name={configurado ? "location" : "location-outline"} size={22} color={configurado ? "#3a7d44" : "#f97316"} />
            <View style={{ flex: 1 }}>
              <Text style={[st.statusTitulo, { color: configurado ? "#3a7d44" : "#f97316" }]}>
                {configurado ? "Localização configurada" : "Localização não configurada"}
              </Text>
              {localSelecionado ? (
                <Text style={st.statusDescricao} numberOfLines={2}>{localSelecionado}</Text>
              ) : configurado ? (
                <Text style={st.statusDescricao}>
                  {config.latitude.toFixed(6)}, {config.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={st.statusDescricao}>
                  Busque o endereço da escola ou use sua localização atual.
                </Text>
              )}
            </View>
          </View>

          {/* Campo de busca */}
          <View>
            <Text style={st.inputLabel}>Buscar endereço da escola</Text>
            <View style={st.buscaRow}>
              <View style={[st.inputRow, { flex: 1 }]}>
                <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                  style={st.input}
                  placeholder="Ex: Escola Estadual João Silva, São Paulo"
                  placeholderTextColor="#bbb"
                  value={buscaTexto}
                  onChangeText={handleBuscaChange}
                  returnKeyType="search"
                  onSubmitEditing={() => buscarEndereco(buscaTexto)}
                />
                {buscando && <ActivityIndicator size="small" color="#3a7d44" style={{ marginLeft: 6 }} />}
                {buscaTexto.length > 0 && !buscando && (
                  <TouchableOpacity onPress={() => { setBuscaTexto(""); setResultados([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Lista de resultados */}
            {resultados.length > 0 && (
              <View style={st.resultadosBox}>
                {resultados.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={st.resultadoItem}
                    onPress={() => selecionarResultado(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color="#3a7d44" style={{ marginTop: 1 }} />
                    <Text style={st.resultadoTexto} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {resultados.length === 0 && buscaTexto.length >= 4 && !buscando && (
              <Text style={st.semResultados}>Nenhum endereço encontrado. Tente ser mais específico.</Text>
            )}
          </View>

          {/* Divisor */}
          <View style={st.divisorRow}>
            <View style={st.divisorLinha} />
            <Text style={st.divisorTexto}>ou</Text>
            <View style={st.divisorLinha} />
          </View>

          {/* Botão usar localização atual */}
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

          {/* Dica */}
          <View style={st.dicaCard}>
            <Ionicons name="information-circle-outline" size={16} color="#3a7d44" />
            <Text style={st.dicaText}>
              Digite o nome ou endereço da escola na busca acima. Quanto mais específico, melhores os resultados.
            </Text>
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[st.btnSalvar, (!configurado || salvando) && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={!configurado || salvando}
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
  scroll: { padding: 20, gap: 18, paddingBottom: 48 },

  statusCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1.5,
  },
  statusOk: { backgroundColor: "#e8f5ea", borderColor: "#86efac" },
  statusPendente: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  statusTitulo: { fontSize: 14, fontWeight: "700" },
  statusDescricao: { fontSize: 12, color: "#666", marginTop: 2, lineHeight: 17 },

  inputGrupo: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  buscaRow: { flexDirection: "row", gap: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F7F8FA", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E8E8F0",
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 14, color: "#1a1a2e", padding: 0 },
  inputHint: { fontSize: 11, color: "#aaa", marginTop: 4 },

  resultadosBox: {
    marginTop: 6, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB",
    backgroundColor: "#fff", overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  resultadoItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  resultadoTexto: { flex: 1, fontSize: 13, color: "#1a1a2e", lineHeight: 18 },
  semResultados: { fontSize: 12, color: "#bbb", marginTop: 6, textAlign: "center" },

  divisorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divisorLinha: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  divisorTexto: { fontSize: 12, color: "#aaa", fontWeight: "600" },

  btnGPS: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: "#86efac",
  },
  btnGPSText: { fontSize: 14, fontWeight: "600", color: "#3a7d44" },

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
