import { styles as s } from "@/styles/Cronogramasstyles";
import { useRouter } from "expo-router";
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
import api from "../src/services/api";
import { useAuth } from "../context/AuthContext";

type TurnoId = "matutino" | "vespertino" | "noturno" | "integral";

type AulaProfessor = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  diaSemana: string | null;
  salaNome: string | null;
  salaTurma: string | null;
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
  { id: "matutino",   label: "Matutino",   ionicon: "sunny-outline",       time: "07:00 - 12:00" },
  { id: "vespertino", label: "Vespertino", ionicon: "partly-sunny-outline", time: "13:00 - 18:00" },
  { id: "noturno",    label: "Noturno",    ionicon: "moon-outline",         time: "18:30 - 23:00" },
  { id: "integral",   label: "Integral",   ionicon: "book-outline",         time: "07:00 - 18:00" },
];

const TURNO_COLORS: Record<TurnoId, string> = {
  matutino:   "#F59E0B",
  vespertino: "#3B82F6",
  noturno:    "#6366F1",
  integral:   "#10B981",
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const TABS = [
  { id: "home",          ionicon: "home-outline" as const,    label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

// ─── Grade semanal (visão do professor) ──────────────────────────────────────
const COL_W = 115;
const TIME_W = 46;

function CalendarioSemanalProf({
  aulas,
  turno,
}: {
  aulas: AulaProfessor[];
  turno: TurnoId;
}) {
  const cor = TURNO_COLORS[turno] || "#3a7d44";

  const normais = aulas.filter(a => !!a.diaSemana);
  const semDia  = aulas.filter(a => !a.diaSemana);

  const horarios = [...new Set(normais.map(a => a.timeStart))].sort();

  const lookup: Record<string, AulaProfessor> = {};
  normais.forEach(a => {
    const k = `${a.diaSemana}_${a.timeStart}`;
    if (!lookup[k]) lookup[k] = a;
  });

  if (normais.length === 0 && semDia.length === 0) {
    return (
      <View style={cal.empty}>
        <Ionicons name="calendar-outline" size={48} color="#ccc" />
        <Text style={cal.emptyText}>Nenhuma aula atribuída neste turno.</Text>
      </View>
    );
  }

  return (
    <View>
      {/* ── Grade semanal ── */}
      {normais.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <View>
            {/* Cabeçalho dos dias */}
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              <View style={{ width: TIME_W }} />
              {DIAS_SEMANA.map(dia => (
                <View key={dia} style={[cal.dayHeader, { width: COL_W }]}>
                  <Text style={cal.dayHeaderText}>{dia.slice(0, 3).toUpperCase()}</Text>
                </View>
              ))}
            </View>

            {/* Linhas por horário */}
            {horarios.map(h => (
              <View key={h} style={{ flexDirection: "row", marginBottom: 6, alignItems: "stretch" }}>
                {/* Rótulo de horário */}
                <View style={[cal.timeCol, { width: TIME_W }]}>
                  <Text style={cal.timeText}>{h}</Text>
                </View>

                {/* Células dos dias */}
                {DIAS_SEMANA.map(dia => {
                  const aula = lookup[`${dia}_${h}`];
                  return (
                    <View key={dia} style={{ width: COL_W, paddingHorizontal: 3 }}>
                      {aula ? (
                        <View style={[cal.aulaCard, { borderLeftColor: cor }]}>
                          <Text style={[cal.aulaTime, { color: cor }]}>
                            {aula.timeStart} – {aula.timeEnd}
                          </Text>
                          <Text style={cal.aulaSubject} numberOfLines={2}>
                            {aula.subject}
                          </Text>
                          {aula.salaNome ? (
                            <View style={cal.detail}>
                              <Ionicons name="business-outline" size={10} color="#888" />
                              <Text style={cal.detailText} numberOfLines={1}>
                                {aula.salaNome}{aula.salaTurma ? ` — ${aula.salaTurma}` : ""}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View style={cal.emptyCell} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Aulas sem dia específico ── */}
      {semDia.length > 0 && (
        <View style={{ marginTop: normais.length > 0 ? 20 : 0 }}>
          <View style={cal.sectionHeader}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={cal.sectionHeaderText}>Sem dia específico</Text>
          </View>
          {semDia.map(a => (
            <View key={a.id} style={cal.rowCard}>
              <View style={cal.rowTimeBox}>
                <Text style={cal.rowTimeStart}>{a.timeStart}</Text>
                <Text style={cal.rowTimeEnd}>{a.timeEnd}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={cal.rowSubject}>{a.subject}</Text>
                {a.salaNome ? (
                  <View style={cal.detail}>
                    <Ionicons name="business-outline" size={11} color="#aaa" />
                    <Text style={[cal.detailText, { fontSize: 11 }]} numberOfLines={1}>
                      {a.salaNome}{a.salaTurma ? ` — ${a.salaTurma}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CronogramasProfessorScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [minhasAulas, setMinhasAulas] = useState<Record<TurnoId, AulaProfessor[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/cronogramas");
      const dados: Record<TurnoId, AulaProfessor[]> = {
        matutino: [], vespertino: [], noturno: [], integral: [],
      };
      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (!(turno in dados)) return;
        c.aulas
          .filter((a) => !a.isInterval && a.professor?.id === usuario?.id)
          .forEach((a) => {
            dados[turno].push({
              id: a.id,
              timeStart: a.timeStart,
              timeEnd: a.timeEnd,
              subject: a.subject,
              diaSemana: a.diaSemana ?? null,
              salaNome: a.sala?.nome ?? null,
              salaTurma: a.sala?.turma ?? null,
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

  useEffect(() => { carregar(); }, [carregar]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/home-professor");
    else if (tabId === "configuracoes") router.push("/configuracoes");
  };

  const totalAulas = Object.values(minhasAulas).reduce((sum, list) => sum + list.length, 0);

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
        <ScrollView contentContainerStyle={s.scrollContent}>
          {/* Resumo */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={rs.card}>
              <Ionicons name="book-outline" size={32} color="#2d6a4f" />
              <View>
                <Text style={rs.total}>
                  {totalAulas} aula{totalAulas !== 1 ? "s" : ""} atribuída{totalAulas !== 1 ? "s" : ""}
                </Text>
                <Text style={rs.subtotal}>
                  Olá, {usuario?.nome?.split(" ")[0]}! Veja suas aulas abaixo.
                </Text>
              </View>
            </View>
          </View>

          {/* Seletor de turno */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecione o Turno</Text>
            <View style={s.turnoGrid}>
              {TURNOS.map((turno) => (
                <TouchableOpacity
                  key={turno.id}
                  style={[s.turnoCard, selectedTurno === turno.id && s.turnoCardSelected]}
                  onPress={() => setSelectedTurno(turno.id)}
                >
                  <Ionicons
                    name={turno.ionicon}
                    size={24}
                    color={selectedTurno === turno.id ? TURNO_COLORS[turno.id] : "#1a1a2e"}
                  />
                  <Text style={s.turnoLabel}>{turno.label}</Text>
                  <Text style={s.turnoTime}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calendário */}
          <View style={s.section}>
            <View style={act.calHeader}>
              <Ionicons
                name={TURNOS.find(t => t.id === selectedTurno)?.ionicon ?? "calendar-outline"}
                size={16}
                color={TURNO_COLORS[selectedTurno]}
              />
              <Text style={[s.sectionTitle, { marginBottom: 0 }]}>
                {TURNOS.find(t => t.id === selectedTurno)?.label} — Minhas Aulas
              </Text>
            </View>
            <CalendarioSemanalProf
              aulas={minhasAulas[selectedTurno]}
              turno={selectedTurno}
            />
          </View>
        </ScrollView>
      )}

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
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const cal = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#aaa", textAlign: "center" },

  dayHeader: {
    backgroundColor: "#1a1a2e",
    marginHorizontal: 3,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayHeaderText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },

  timeCol: { justifyContent: "flex-start", paddingTop: 10, alignItems: "center" },
  timeText: { fontSize: 10, fontWeight: "700", color: "#999" },

  aulaCard: {
    backgroundColor: "#FAFFFE",
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 9,
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aulaTime: { fontSize: 9, fontWeight: "700", marginBottom: 4 },
  aulaSubject: { fontSize: 12, fontWeight: "700", color: "#1a1a2e", marginBottom: 5, lineHeight: 16 },
  detail: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  detailText: { fontSize: 10, color: "#666", flex: 1 },

  emptyCell: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 10,
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowTimeBox: { alignItems: "center", width: 44, gap: 2 },
  rowTimeStart: { fontSize: 12, fontWeight: "800", color: "#1a1a2e" },
  rowTimeEnd: { fontSize: 11, color: "#aaa" },
  rowSubject: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginBottom: 3 },
});

const rs = StyleSheet.create({
  card: {
    backgroundColor: "#e8f5ea",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  total: { fontSize: 16, fontWeight: "700", color: "#2d6a4f" },
  subtotal: { fontSize: 12, color: "#52b788", marginTop: 2 },
});

const act = StyleSheet.create({
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
});
