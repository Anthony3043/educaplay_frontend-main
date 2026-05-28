import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles as s } from "@/styles/Cronogramasstyles";
import {
  computeAulaSlots, intervalStorageKey,
  DEFAULT_INT1_GAP, DEFAULT_INT2_GAP,
} from "@/src/constants/slots";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/services/api";
import { useAuth } from "../../context/AuthContext";
import * as Location from "expo-location";

type TurnoId = "matutino" | "vespertino";

type AulaProfessor = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  diaSemana: string | null;
  salaNome: string | null;
  salaTurma: string | null;
  salaId: string | null;
  turno: TurnoId;
};

type CronogramaAPI = {
  id: string;
  turno: string;
  aulas: {
    id: string;
    timeStart: string;
    timeEnd: string;
    subject: string;
    diaSemana?: string | null;
    isInterval: boolean;
    professor: { id: string; nome: string } | null;
    sala: { id: string; nome: string; turma?: string | null } | null;
  }[];
};

const TURNOS: { id: TurnoId; label: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; time: string }[] = [
  { id: "matutino",   label: "Matutino",   ionicon: "sunny-outline",       time: "07:00 - 12:15" },
  { id: "vespertino", label: "Vespertino", ionicon: "partly-sunny-outline", time: "13:00 - 18:15" },
];

const TURNO_COLORS: Record<TurnoId, string> = {
  matutino:   "#F59E0B",
  vespertino: "#3B82F6",
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const TABS = [
  { id: "home",          ionicon: "home-outline" as const,    label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Config." },
];

export default function CronogramasProfessorScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [selectedDia, setSelectedDia]     = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState("cronograma");
  const [minhasAulas, setMinhasAulas]     = useState<AulaProfessor[]>([]);
  const [carregando, setCarregando]       = useState(true);
  const [int1Gap, setInt1Gap]             = useState(DEFAULT_INT1_GAP);
  const [int2Gap, setInt2Gap]             = useState(DEFAULT_INT2_GAP);

  // Ponto
  const [batendoPonto, setBatendoPonto]   = useState<string | null>(null);
  const [pontosBatidos, setPontosBatidos] = useState<Record<string, boolean>>({});
  const [modalPontoErro, setModalPontoErro] = useState<{ distancia: number; raio: number } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/cronogramas");
      const dados: AulaProfessor[] = [];
      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (!["matutino", "vespertino"].includes(turno)) return;
        c.aulas
          .filter((a) => !a.isInterval && a.professor?.id === usuario?.id)
          .forEach((a) => {
            dados.push({
              id: a.id,
              timeStart: a.timeStart,
              timeEnd: a.timeEnd,
              subject: a.subject,
              diaSemana: a.diaSemana ?? null,
              salaNome: a.sala?.nome ?? null,
              salaTurma: a.sala?.turma ?? null,
              salaId: a.sala?.id ?? null,
              turno,
            });
          });
      });
      setMinhasAulas(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o cronograma.");
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  useEffect(() => {
    setInt1Gap(DEFAULT_INT1_GAP);
    setInt2Gap(DEFAULT_INT2_GAP);
    AsyncStorage.getItem(intervalStorageKey(selectedTurno)).then(raw => {
      if (!raw) return;
      try {
        const { g1, g2 } = JSON.parse(raw) as { g1: number; g2: number };
        if (Number.isInteger(g1) && Number.isInteger(g2) && g1 >= 0 && g2 <= 7 && g1 < g2) {
          setInt1Gap(g1);
          setInt2Gap(g2);
        }
      } catch {}
    });
  }, [selectedTurno]);

  // Verifica pontos batidos quando muda de dia
  useEffect(() => {
    if (!selectedDia || !usuario?.id) return;
    const aulasNoDia = minhasAulas.filter(a => a.turno === selectedTurno && a.diaSemana === selectedDia);
    const map: Record<string, boolean> = {};
    Promise.allSettled(
      aulasNoDia.map(async (aula) => {
        try {
          const res = await api.get(`/ponto/aula/${aula.id}`, { params: { diaSemana: selectedDia } });
          map[aula.id] = !!res.data;
        } catch {
          map[aula.id] = false;
        }
      })
    ).then(() => setPontosBatidos(map));
  }, [selectedDia, selectedTurno, minhasAulas, usuario?.id]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/professor/home-professor");
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
  };

  const handleAulaPress = (aula: AulaProfessor) => {
    router.push({
      pathname: "/shared/AulaDetalhe",
      params: {
        id: aula.id, timeStart: aula.timeStart, timeEnd: aula.timeEnd, subject: aula.subject,
        teacher: usuario?.nome ?? "", diaSemana: aula.diaSemana ?? "",
        professorId: usuario?.id ?? "", salaId: aula.salaId ?? "",
        salaNome: aula.salaNome ?? "", salaTurma: aula.salaTurma ?? "",
        turno: aula.turno, isInterval: "false", readOnly: "true",
      },
    });
  };

  const handleBaterPonto = async (aula: AulaProfessor) => {
    if (!selectedDia) return;
    setBatendoPonto(aula.id);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Precisamos de acesso à sua localização para registrar o ponto.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      await api.post("/ponto", { aulaId: aula.id, diaSemana: selectedDia, latitude, longitude });
      setPontosBatidos((prev) => ({ ...prev, [aula.id]: true }));
      Alert.alert("✅ Ponto registrado!", `Presença confirmada na aula de ${aula.subject}.`);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.fora) {
        setModalPontoErro({ distancia: data.distancia, raio: data.raio });
      } else if (err?.response?.status === 409) {
        Alert.alert("Já registrado", "Você já bateu o ponto nesta aula hoje.");
        setPontosBatidos((prev) => ({ ...prev, [aula.id]: true }));
      } else {
        Alert.alert("Erro", data?.error || "Não foi possível registrar o ponto.");
      }
    } finally {
      setBatendoPonto(null);
    }
  };

  const todosSlots = computeAulaSlots(selectedTurno, int1Gap, int2Gap);

  const aulasNoDia = selectedDia
    ? minhasAulas.filter(a => a.turno === selectedTurno && a.diaSemana === selectedDia)
    : [];

  const slotEntries = todosSlots.map(s => ({
    slot: s,
    aula: aulasNoDia.find(a => a.timeStart === s.start) ?? null,
  }));

  const totalAulas = minhasAulas.length;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Cronograma</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: 80 }]}>
          {/* Resumo */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={rs.card}>
              <Ionicons name="book-outline" size={32} color="#2d6a4f" />
              <View>
                <Text style={rs.total}>
                  {totalAulas} aula{totalAulas !== 1 ? "s" : ""} atribuída{totalAulas !== 1 ? "s" : ""}
                </Text>
                <Text style={rs.subtotal}>
                  Olá, {usuario?.nome?.split(" ")[0]}! Veja seus horários abaixo.
                </Text>
              </View>
            </View>
          </View>

          {/* Seletor de turno */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Turno</Text>
            <View style={[s.turnoGrid, { justifyContent: "flex-start" }]}>
              {TURNOS.map((turno) => (
                <TouchableOpacity
                  key={turno.id}
                  style={[s.turnoCard, selectedTurno === turno.id && s.turnoCardSelected]}
                  onPress={() => { setSelectedTurno(turno.id); setSelectedDia(null); }}
                >
                  <Ionicons name={turno.ionicon} size={24} color={selectedTurno === turno.id ? TURNO_COLORS[turno.id] : "#1a1a2e"} />
                  <Text style={s.turnoLabel} numberOfLines={1}>{turno.label}</Text>
                  <Text style={s.turnoTime} numberOfLines={1}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seletor de dia */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Dia da semana</Text>
            <View style={pv.diasRow}>
              {DIAS_SEMANA.map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[pv.diaChip, selectedDia === dia && pv.diaChipActive]}
                  onPress={() => setSelectedDia(selectedDia === dia ? null : dia)}
                  activeOpacity={0.7}
                >
                  <Text style={[pv.diaChipText, selectedDia === dia && pv.diaChipTextActive]}>
                    {dia.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Grade de horários */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { marginBottom: 14 }]}>
              {selectedDia ? `${selectedDia} · ${TURNOS.find(t => t.id === selectedTurno)?.label}` : "Selecione um dia"}
            </Text>

            {!selectedDia ? (
              <View style={pv.promptBox}>
                <Ionicons name="calendar-outline" size={44} color="#ccc" />
                <Text style={pv.promptTitle}>Selecione um dia acima</Text>
                <Text style={pv.promptSub}>Seus horários aparecerão aqui</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {slotEntries.map(({ slot, aula }) =>
                  aula ? (
                    <View key={slot.start} style={[pv.aulaCard, { borderLeftColor: TURNO_COLORS[selectedTurno] }]}>
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
                        onPress={() => handleAulaPress(aula)}
                        activeOpacity={0.82}
                      >
                        <View style={[pv.aulaTimeBox, { backgroundColor: TURNO_COLORS[selectedTurno] + "18" }]}>
                          <Text style={[pv.aulaTime, { color: TURNO_COLORS[selectedTurno] }]}>{slot.start}</Text>
                          <Text style={[pv.aulaTimeEnd, { color: TURNO_COLORS[selectedTurno] + "AA" }]}>{slot.end}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={pv.aulaSubject} numberOfLines={2}>{aula.subject}</Text>
                          {aula.salaNome ? (
                            <View style={pv.aulaDetail}>
                              <Ionicons name="business-outline" size={11} color="#888" />
                              <Text style={pv.aulaDetailText} numberOfLines={1}>
                                {aula.salaNome}{aula.salaTurma ? ` — ${aula.salaTurma}` : ""}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#ccc" />
                      </TouchableOpacity>

                      {/* Botão bater ponto */}
                      {pontosBatidos[aula.id] ? (
                        <View style={pt.pontoBatido}>
                          <Ionicons name="checkmark-circle" size={15} color="#3a7d44" />
                          <Text style={pt.pontoBatidoText}>Ponto registrado</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[pt.btnPonto, batendoPonto === aula.id && { opacity: 0.7 }]}
                          onPress={() => handleBaterPonto(aula)}
                          disabled={batendoPonto === aula.id}
                          activeOpacity={0.8}
                        >
                          {batendoPonto === aula.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="location-outline" size={13} color="#fff" />
                              <Text style={pt.btnPontoText}>Bater Ponto</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View key={slot.start} style={pv.vagoCard}>
                      <View style={pv.vagoTimeBox}>
                        <Text style={pv.vagoTime}>{slot.start}</Text>
                        <Text style={pv.vagoTimeEnd}>{slot.end}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={pv.vagoText}>Horário vago</Text>
                      </View>
                      <Ionicons name="time-outline" size={18} color="#ddd" />
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={s.tabItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]} numberOfLines={1}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal de erro de localização */}
      <Modal visible={!!modalPontoErro} transparent animationType="fade" onRequestClose={() => setModalPontoErro(null)}>
        <View style={erroLoc.overlay}>
          <View style={erroLoc.box}>
            <View style={erroLoc.iconWrap}>
              <Ionicons name="location-outline" size={32} color="#ef4444" />
            </View>
            <Text style={erroLoc.titulo}>Fora da escola</Text>
            <Text style={erroLoc.descricao}>
              Você está a <Text style={erroLoc.destaque}>{modalPontoErro?.distancia}m</Text> da escola.{"\n"}
              É necessário estar dentro do raio de <Text style={erroLoc.destaque}>{modalPontoErro?.raio}m</Text> para bater o ponto.
            </Text>
            <TouchableOpacity style={erroLoc.btn} onPress={() => setModalPontoErro(null)} activeOpacity={0.85}>
              <Text style={erroLoc.btnText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const rs = StyleSheet.create({
  card: { backgroundColor: "#e8f5ea", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  total: { fontSize: 16, fontWeight: "700", color: "#2d6a4f" },
  subtotal: { fontSize: 12, color: "#52b788", marginTop: 2 },
});

const pv = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  diaChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent" },
  diaChipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  diaChipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  diaChipTextActive: { color: "#3a7d44" },
  promptBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  promptTitle: { fontSize: 16, fontWeight: "700", color: "#aaa" },
  promptSub: { fontSize: 13, color: "#ccc" },
  aulaCard: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderLeftWidth: 4, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    gap: 8,
  },
  aulaTimeBox: { alignItems: "center", width: 52, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4, gap: 2 },
  aulaTime: { fontSize: 13, fontWeight: "800" },
  aulaTimeEnd: { fontSize: 10, fontWeight: "600" },
  aulaSubject: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  aulaDetail: { flexDirection: "row", alignItems: "center", gap: 4 },
  aulaDetailText: { fontSize: 11, color: "#888", flex: 1 },
  vagoCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFA",
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "#EBEBEB", borderStyle: "dashed", gap: 12,
  },
  vagoTimeBox: { alignItems: "center", width: 52, gap: 2 },
  vagoTime: { fontSize: 13, fontWeight: "700", color: "#ccc" },
  vagoTimeEnd: { fontSize: 10, color: "#ddd" },
  vagoText: { fontSize: 13, fontWeight: "600", color: "#ccc", fontStyle: "italic" },
});

const pt = StyleSheet.create({
  btnPonto: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#3a7d44", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-end",
  },
  btnPontoText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  pontoBatido: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-end",
    backgroundColor: "#e8f5ea", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  pontoBatidoText: { fontSize: 12, fontWeight: "600", color: "#3a7d44" },
});

const erroLoc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: "700", color: "#ef4444", marginBottom: 8 },
  descricao: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  destaque: { fontWeight: "700", color: "#1a1a2e" },
  btn: { width: "100%", backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
