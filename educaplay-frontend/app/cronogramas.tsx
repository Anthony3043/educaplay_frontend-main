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

export type TurnoId = "matutino" | "vespertino" | "noturno" | "integral";

export type Aula = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  teacher: string;
  isInterval?: boolean;
  diaSemana?: string | null;
  professorId?: string | null;
  salaId?: string | null;
  salaNome?: string | null;
  salaTurma?: string | null;
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
  { id: "home",          ionicon: "home-outline" as const,     label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline" as const,  label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const,  label: "Configurações" },
];

// ─── Componente do calendário semanal ────────────────────────────────────────
const COL_W = 115;
const TIME_W = 46;

function CalendarioSemanal({
  aulas,
  turno,
  onPress,
}: {
  aulas: Aula[];
  turno: TurnoId;
  onPress: (a: Aula) => void;
}) {
  const cor = TURNO_COLORS[turno] || "#3a7d44";

  const normais   = aulas.filter(a => !a.isInterval && !!a.diaSemana);
  const semDia    = aulas.filter(a => !a.isInterval && !a.diaSemana);
  const intervalos = aulas.filter(a => !!a.isInterval);

  // Linhas do grid = horários únicos ordenados
  const horarios = [...new Set(normais.map(a => a.timeStart))].sort();

  // Mapa rápido dia+horário → Aula
  const lookup: Record<string, Aula> = {};
  normais.forEach(a => {
    const k = `${a.diaSemana}_${a.timeStart}`;
    if (!lookup[k]) lookup[k] = a;
  });

  const vazio = normais.length === 0 && semDia.length === 0 && intervalos.length === 0;

  if (vazio) {
    return (
      <View style={cal.empty}>
        <Ionicons name="calendar-outline" size={48} color="#ccc" />
        <Text style={cal.emptyText}>Nenhum horário cadastrado para este turno.</Text>
        <Text style={cal.emptyHint}>Toque em "Criar Horário" para começar.</Text>
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

            {/* Linha por horário */}
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
                        <TouchableOpacity
                          style={[cal.aulaCard, { borderLeftColor: cor }]}
                          onPress={() => onPress(aula)}
                          activeOpacity={0.82}
                        >
                          <Text style={[cal.aulaTime, { color: cor }]}>
                            {aula.timeStart} – {aula.timeEnd}
                          </Text>
                          <Text style={cal.aulaSubject} numberOfLines={2}>
                            {aula.subject}
                          </Text>
                          {aula.teacher ? (
                            <View style={cal.detail}>
                              <Ionicons name="person-outline" size={10} color="#888" />
                              <Text style={cal.detailText} numberOfLines={1}>{aula.teacher}</Text>
                            </View>
                          ) : null}
                          {aula.salaNome ? (
                            <View style={cal.detail}>
                              <Ionicons name="business-outline" size={10} color="#888" />
                              <Text style={cal.detailText} numberOfLines={1}>
                                {aula.salaNome}{aula.salaTurma ? ` — ${aula.salaTurma}` : ""}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
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
            <TouchableOpacity
              key={a.id}
              style={cal.rowCard}
              onPress={() => onPress(a)}
              activeOpacity={0.8}
            >
              <View style={cal.rowTimeBox}>
                <Text style={cal.rowTimeStart}>{a.timeStart}</Text>
                <Text style={cal.rowTimeEnd}>{a.timeEnd}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={cal.rowSubject}>{a.subject}</Text>
                {a.teacher ? (
                  <View style={cal.detail}>
                    <Ionicons name="person-outline" size={11} color="#aaa" />
                    <Text style={[cal.detailText, { fontSize: 11 }]} numberOfLines={1}>{a.teacher}</Text>
                  </View>
                ) : null}
                {a.salaNome ? (
                  <View style={cal.detail}>
                    <Ionicons name="business-outline" size={11} color="#aaa" />
                    <Text style={[cal.detailText, { fontSize: 11 }]} numberOfLines={1}>{a.salaNome}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Intervalos ── */}
      {intervalos.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <View style={cal.sectionHeader}>
            <Ionicons name="cafe-outline" size={13} color="#92400e" />
            <Text style={[cal.sectionHeaderText, { color: "#92400e" }]}>Intervalos</Text>
          </View>
          {intervalos.map(a => (
            <View key={a.id} style={cal.intervaloCard}>
              <Ionicons name="cafe-outline" size={14} color="#92400e" />
              <Text style={cal.intervaloText}>{a.subject} · {a.timeStart} – {a.timeEnd}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CronogramasScreen() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [cronogramas, setCronogramas] = useState<Record<TurnoId, Aula[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [cronogramaIds, setCronogramaIds] = useState<Record<TurnoId, string | null>>({
    matutino: null, vespertino: null, noturno: null, integral: null,
  });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/cronogramas");
      const ids: Record<TurnoId, string | null> = { matutino: null, vespertino: null, noturno: null, integral: null };
      const dados: Record<TurnoId, Aula[]> = { matutino: [], vespertino: [], noturno: [], integral: [] };
      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (turno in dados) {
          ids[turno] = c.id;
          dados[turno] = c.aulas.map((a) => ({
            id: a.id,
            timeStart: a.timeStart,
            timeEnd: a.timeEnd,
            subject: a.subject,
            teacher: a.professor?.nome ?? "",
            isInterval: a.isInterval,
            diaSemana: a.diaSemana ?? null,
            professorId: a.professor?.id ?? null,
            salaId: a.sala?.id ?? null,
            salaNome: a.sala?.nome ?? null,
            salaTurma: a.sala?.turma ?? null,
          }));
        }
      });
      setCronogramaIds(ids);
      setCronogramas(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os cronogramas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriarHorario = async () => {
    let cronogramaId = cronogramaIds[selectedTurno];
    if (!cronogramaId) {
      try {
        const res = await api.post("/cronogramas", { turno: selectedTurno });
        cronogramaId = res.data.id;
        setCronogramaIds((prev) => ({ ...prev, [selectedTurno]: cronogramaId }));
      } catch {
        Alert.alert("Erro", "Não foi possível iniciar o cronograma.");
        return;
      }
    }
    router.push({ pathname: "/CriarHorario", params: { cronogramaId, turno: selectedTurno } });
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/home");
    else if (tabId === "configuracoes") router.push("/configuracoes");
  };

  const handleAulaPress = (aula: Aula) => {
    if (aula.isInterval) return;
    router.push({
      pathname: "/AulaDetalhe",
      params: {
        id: aula.id,
        timeStart: aula.timeStart,
        timeEnd: aula.timeEnd,
        subject: aula.subject,
        teacher: aula.teacher,
        diaSemana: aula.diaSemana ?? "",
        professorId: aula.professorId ?? "",
        salaId: aula.salaId ?? "",
        salaNome: aula.salaNome ?? "",
        salaTurma: aula.salaTurma ?? "",
        turno: selectedTurno,
      },
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent}>
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

          {/* Botão criar */}
          <View style={act.row}>
            <TouchableOpacity style={act.btn} onPress={handleCriarHorario} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={act.btnText}>Criar Horário</Text>
            </TouchableOpacity>
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
                {TURNOS.find(t => t.id === selectedTurno)?.label} — Horários
              </Text>
            </View>
            <CalendarioSemanal
              aulas={cronogramas[selectedTurno]}
              turno={selectedTurno}
              onPress={handleAulaPress}
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

// ─── Estilos do calendário ────────────────────────────────────────────────────
const cal = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#aaa", textAlign: "center" },
  emptyHint: { fontSize: 13, color: "#ccc", textAlign: "center" },

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

  intervaloCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  intervaloText: { fontSize: 12, color: "#92400e", fontWeight: "600" },
});

const act = StyleSheet.create({
  row: { paddingHorizontal: 20, marginBottom: 4 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#3a7d44",
  },
  btnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
});
