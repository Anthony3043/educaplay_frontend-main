import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles as s } from "@/styles/Cronogramasstyles";
import {
  computeAulaSlots, intervalStorageKey,
  DEFAULT_INT1_GAP, DEFAULT_INT2_GAP,
} from "@/src/constants/slots";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/supervisao/cronogramas");
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

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/professor/home-professor");
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
  };

  const handleAulaPress = (aula: AulaProfessor) => {
    router.push({
      pathname: "/shared/AulaDetalhe",
      params: {
        id: aula.id,
        timeStart: aula.timeStart,
        timeEnd: aula.timeEnd,
        subject: aula.subject,
        teacher: usuario?.nome ?? "",
        diaSemana: aula.diaSemana ?? "",
        professorId: usuario?.id ?? "",
        salaId: aula.salaId ?? "",
        salaNome: aula.salaNome ?? "",
        salaTurma: aula.salaTurma ?? "",
        turno: aula.turno,
        isInterval: "false",
        readOnly: "true",
      },
    });
  };

  const todosSlots = computeAulaSlots(selectedTurno, int1Gap, int2Gap);

  // Aulas do professor no turno+dia selecionados
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
                  <Ionicons
                    name={turno.ionicon}
                    size={24}
                    color={selectedTurno === turno.id ? TURNO_COLORS[turno.id] : "#1a1a2e"}
                  />
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
                    <TouchableOpacity
                      key={slot.start}
                      style={[pv.aulaCard, { borderLeftColor: TURNO_COLORS[selectedTurno] }]}
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
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]} numberOfLines={1}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const rs = StyleSheet.create({
  card: {
    backgroundColor: "#e8f5ea", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4,
  },
  total: { fontSize: 16, fontWeight: "700", color: "#2d6a4f" },
  subtotal: { fontSize: 12, color: "#52b788", marginTop: 2 },
});

const pv = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  diaChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent",
  },
  diaChipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  diaChipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  diaChipTextActive: { color: "#3a7d44" },

  promptBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  promptTitle: { fontSize: 16, fontWeight: "700", color: "#aaa" },
  promptSub: { fontSize: 13, color: "#ccc" },

  aulaCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, padding: 14, borderLeftWidth: 4, gap: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  aulaTimeBox: {
    alignItems: "center", width: 52, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 4, gap: 2,
  },
  aulaTime: { fontSize: 13, fontWeight: "800" },
  aulaTimeEnd: { fontSize: 10, fontWeight: "600" },
  aulaSubject: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  aulaDetail: { flexDirection: "row", alignItems: "center", gap: 4 },
  aulaDetailText: { fontSize: 11, color: "#888", flex: 1 },

  vagoCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFA",
    borderRadius: 14, padding: 14, borderWidth: 1.5,
    borderColor: "#EBEBEB", borderStyle: "dashed", gap: 12,
  },
  vagoTimeBox: { alignItems: "center", width: 52, gap: 2 },
  vagoTime: { fontSize: 13, fontWeight: "700", color: "#ccc" },
  vagoTimeEnd: { fontSize: 10, color: "#ddd" },
  vagoText: { fontSize: 13, fontWeight: "600", color: "#ccc", fontStyle: "italic" },
});
