import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [localNome, setLocalNome] = useState<string | null>(null);

  const configurado = config.latitude !== 0 || config.longitude !== 0;
  const [modal, setModal] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "sucesso" | "erro" | "aviso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const mostrar = (titulo: string, mensagem: string, tipo: "sucesso" | "erro" | "aviso" = "aviso") => setModal({ visivel: true, titulo, mensagem, tipo });

  useEffect(() => {
    api.get("/configuracao-escola")
      .then((res) => { const c: Config = res.data; setConfig(c); setRaioStr(String(c.raio ?? 200)); })
      .catch(() => mostrar("Erro", "Não foi possível carregar as configurações.", "erro"))
      .finally(() => setCarregando(false));
  }, []);

  const obterLocalizacaoAtual = async () => {
    setObtendoLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { mostrar("Permissão negada", "Habilite a localização nas configurações do dispositivo."); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setConfig((prev) => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
      setLocalNome("Localização atual do dispositivo");
    } catch {
      mostrar("Erro", "Não foi possível obter sua localização.", "erro");
    } finally {
      setObtendoLoc(false);
    }
  };

  const handleSalvar = async () => {
    if (!configurado) { mostrar("Atenção", "Captura a localização da escola antes de salvar."); return; }
    const raio = parseFloat(raioStr.replace(",", "."));
    if (isNaN(raio) || raio < 10) { mostrar("Atenção", "O raio deve ser de no mínimo 10 metros."); return; }
    setSalvando(true);
    try {
      await api.put("/configuracao-escola", { latitude: config.latitude, longitude: config.longitude, raio });
      mostrar("Salvo!", "Localização da escola atualizada com sucesso.", "sucesso");
    } catch {
      mostrar("Erro", "Não foi possível salvar as configurações.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Localização da Escola</Text>
        <View style={st.headerBadge}>
          <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.85)" />
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

          {/* Status card */}
          <View style={[st.statusCard, configurado ? st.statusOk : st.statusPendente]}>
            <View style={[st.statusIconWrap, { backgroundColor: configurado ? "#3a7d44" : "#f97316" }]}>
              <Ionicons name={configurado ? "location" : "location-outline"} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[st.statusTitulo, { color: configurado ? "#3a7d44" : "#f97316" }]}>
                {configurado ? "Localização configurada" : "Localização não configurada"}
              </Text>
              {configurado ? (
                <View style={st.coordsBadge}>
                  <Ionicons name="navigate-circle-outline" size={12} color="#3a7d44" />
                  <Text style={st.coordsText}>
                    {localNome || `${config.latitude.toFixed(5)}, ${config.longitude.toFixed(5)}`}
                  </Text>
                </View>
              ) : (
                <Text style={st.statusDescricao}>Vá até a escola e toque no botão abaixo.</Text>
              )}
            </View>
          </View>

          {/* Dica */}
          <View style={st.dicaCard}>
            <Ionicons name="bulb-outline" size={16} color="#3a7d44" />
            <Text style={st.dicaText}>
              Abra o app dentro da escola e toque em "Capturar localização". O GPS registra o ponto exato automaticamente.
            </Text>
          </View>

          {/* Botão GPS */}
          <TouchableOpacity
            style={[st.btnGPS, obtendoLoc && { opacity: 0.75 }]}
            onPress={obterLocalizacaoAtual}
            disabled={obtendoLoc}
            activeOpacity={0.85}
          >
            {obtendoLoc ? (
              <><ActivityIndicator size="small" color="#fff" /><Text style={st.btnGPSText}>Obtendo localização...</Text></>
            ) : (
              <>
                <View style={st.gpsPulse}><Ionicons name="navigate" size={20} color="#fff" /></View>
                <Text style={st.btnGPSText}>Capturar localização da escola</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Raio */}
          <View style={st.raioCard}>
            <View style={st.raioHeader}>
              <View style={st.raioIconWrap}><Ionicons name="radio-outline" size={18} color="#3a7d44" /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.inputLabel}>Raio de tolerância</Text>
                <Text style={st.inputHint}>Mínimo 10m · Recomendado 100–300m</Text>
              </View>
            </View>
            <View style={st.inputRow}>
              <TextInput
                style={st.input}
                placeholder="200"
                placeholderTextColor="#9CA3AF"
                value={raioStr}
                onChangeText={setRaioStr}
                keyboardType="number-pad"
              />
              <View style={st.metersLabel}><Text style={st.metersText}>metros</Text></View>
            </View>
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

      <Modal visible={modal.visivel} transparent animationType="fade" onRequestClose={() => setModal(p => ({ ...p, visivel: false }))}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={[st.modalIconWrap, { backgroundColor: modal.tipo === "erro" ? "#FEE2E2" : modal.tipo === "sucesso" ? "#e8f5ea" : "#FEF3C7" }]}>
              <Ionicons name={modal.tipo === "erro" ? "alert-circle" : modal.tipo === "sucesso" ? "checkmark-circle" : "information-circle"} size={32} color={modal.tipo === "erro" ? "#ef4444" : modal.tipo === "sucesso" ? "#3a7d44" : "#f59e0b"} />
            </View>
            <Text style={st.modalTitulo}>{modal.titulo}</Text>
            <Text style={st.modalMensagem}>{modal.mensagem}</Text>
            <TouchableOpacity style={[st.modalBtn, { backgroundColor: modal.tipo === "erro" ? "#ef4444" : "#3a7d44" }]} onPress={() => setModal(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={st.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#3a7d44",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center" },
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },

  statusCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderRadius: 20, padding: 16, borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statusIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  statusOk: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  statusPendente: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  statusTitulo: { fontSize: 14, fontWeight: "800" },
  statusDescricao: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  coordsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#D1FAE5", alignSelf: "flex-start",
  },
  coordsText: { fontSize: 11, fontFamily: "monospace" as any, color: "#065F46", fontWeight: "600" },

  dicaCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  dicaText: { flex: 1, fontSize: 12, color: "#166534", lineHeight: 18 },

  btnGPS: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    backgroundColor: "#3a7d44", borderRadius: 18, paddingVertical: 18,
    shadowColor: "#3a7d44", shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  gpsPulse: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  btnGPSText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  raioCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  raioHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  raioIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
  },
  inputLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8F9FA", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingHorizontal: 16, paddingVertical: 4,
  },
  input: { flex: 1, fontSize: 28, fontWeight: "800", color: "#111827", padding: 8 },
  inputHint: { fontSize: 11, color: "#9CA3AF" },
  metersLabel: {
    backgroundColor: "#F0FDF4", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  metersText: { fontSize: 13, fontWeight: "700", color: "#3a7d44" },

  btnSalvar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 16, paddingVertical: 16,
    shadowColor: "#3a7d44", shadowOpacity: 0.32, shadowRadius: 10, elevation: 5,
  },
  btnSalvarText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  modalBox: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  modalTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  modalMensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21, marginBottom: 4 },
  modalBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  modalBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
