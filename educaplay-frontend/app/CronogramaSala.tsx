import { styles as s } from "@/styles/Cronogramasstyles";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
  { id: "matutino",   label: "Matutino",   ionicon: "sunny-outline",        time: "07:00 - 12:00" },
  { id: "vespertino", label: "Vespertino", ionicon: "partly-sunny-outline",  time: "13:00 - 18:00" },
  { id: "noturno",    label: "Noturno",    ionicon: "moon-outline",          time: "18:30 - 23:00" },
  { id: "integral",   label: "Integral",   ionicon: "book-outline",          time: "07:00 - 18:00" },
];

const TURNO_COLORS: Record<TurnoId, string> = {
  matutino:   "#F59E0B",
  vespertino: "#3B82F6",
  noturno:    "#6366F1",
  integral:   "#10B981",
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Calendário semanal ───────────────────────────────────────────────────────
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

  const sortTime = (a: Aula, b: Aula) => a.timeStart.localeCompare(b.timeStart);

  const normais          = aulas.filter(a => !a.isInterval && !!a.diaSemana);
  const semDia           = aulas.filter(a => !a.isInterval && !a.diaSemana).sort(sortTime);
  const intervalos       = aulas.filter(a => !!a.isInterval).sort(sortTime);
  const intervalosSemDia = intervalos.filter(a => !a.diaSemana);
  const intervalosComDia = intervalos.filter(a => !!a.diaSemana);

  const horarios = [...new Set([
    ...normais.map(a => a.timeStart),
    ...intervalos.map(a => a.timeStart),
  ])].sort();

  const lookup: Record<string, Aula> = {};
  normais.forEach(a => { const k = `${a.diaSemana}_${a.timeStart}`; if (!lookup[k]) lookup[k] = a; });

  const intervaloLookup: Record<string, Aula> = {};
  intervalosComDia.forEach(a => { const k = `${a.diaSemana}_${a.timeStart}`; if (!intervaloLookup[k]) intervaloLookup[k] = a; });

  const timeEnds: Record<string, string> = {};
  normais.forEach(a => { if (!timeEnds[a.timeStart]) timeEnds[a.timeStart] = a.timeEnd; });
  intervalos.forEach(a => { if (!timeEnds[a.timeStart]) timeEnds[a.timeStart] = a.timeEnd; });

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
      {(normais.length > 0 || intervalos.length > 0) && (
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
                <View key={dia} style={{ width: COL_W, paddingHorizontal: 3 }}>
                  <View style={cal.dayHeader}>
                    <Text style={cal.dayHeaderText}>{dia.slice(0, 3).toUpperCase()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {horarios.map(h => {
              const faixa = intervalosSemDia.find(a => a.timeStart === h);
              if (faixa) {
                return (
                  <View key={h} style={{ flexDirection: "row", marginBottom: 6, alignItems: "center" }}>
                    <View style={[cal.timeCol, { width: TIME_W }]}>
                      <Text style={cal.timeText}>{h}</Text>
                      <Text style={cal.timeTextEnd}>{faixa.timeEnd}</Text>
                    </View>
                    <TouchableOpacity
                      style={[cal.intervaloFaixa, { width: COL_W * DIAS_SEMANA.length }]}
                      onPress={() => onPress(faixa)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="cafe-outline" size={14} color="#92400e" />
                      <Text style={cal.intervaloFaixaText}>
                        Intervalo · {h} – {faixa.timeEnd}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#b45309" />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View key={h} style={{ flexDirection: "row", marginBottom: 6, alignItems: "stretch" }}>
                  <View style={[cal.timeCol, { width: TIME_W }]}>
                    <Text style={cal.timeText}>{h}</Text>
                    {timeEnds[h] ? <Text style={cal.timeTextEnd}>{timeEnds[h]}</Text> : null}
                  </View>
                  {DIAS_SEMANA.map(dia => {
                    const aula = lookup[`${dia}_${h}`];
                    const intervalo = intervaloLookup[`${dia}_${h}`];
                    return (
                      <View key={dia} style={{ width: COL_W, paddingHorizontal: 3 }}>
                        {aula ? (
                          <TouchableOpacity
                            style={[cal.aulaCard, { borderLeftColor: cor }]}
                            onPress={() => onPress(aula)}
                            activeOpacity={0.82}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 4 }}>
                              <Text style={[cal.aulaTime, { color: cor }]}>{aula.timeStart}</Text>
                              <Text style={{ fontSize: 8, color: cor, opacity: 0.7 }}>–</Text>
                              <Text style={[cal.aulaTime, { color: cor }]}>{aula.timeEnd}</Text>
                            </View>
                            <Text style={cal.aulaSubject} numberOfLines={2}>{aula.subject}</Text>
                            {aula.teacher ? (
                              <View style={cal.detail}>
                                <Ionicons name="person-outline" size={10} color="#888" />
                                <Text style={cal.detailText} numberOfLines={1}>{aula.teacher}</Text>
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        ) : intervalo ? (
                          <TouchableOpacity
                            style={cal.intervaloCelula}
                            onPress={() => onPress(intervalo)}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="cafe-outline" size={12} color="#92400e" />
                            <Text style={cal.intervaloCelulaText}>Intervalo</Text>
                            <Text style={cal.intervaloCelulaHora}>{h} – {intervalo.timeEnd}</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={cal.emptyCell} />
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {semDia.length > 0 && (
        <View style={{ marginTop: (normais.length > 0 || intervalos.length > 0) ? 20 : 0 }}>
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
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CronogramaSalaScreen() {
  const router = useRouter();
  const { salaId, salaNome, salaTurma } = useLocalSearchParams<{
    salaId: string;
    salaNome: string;
    salaTurma?: string;
  }>();

  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [cronogramas, setCronogramas] = useState<Record<TurnoId, Aula[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [cronogramaIds, setCronogramaIds] = useState<Record<TurnoId, string | null>>({
    matutino: null, vespertino: null, noturno: null, integral: null,
  });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get("/cronogramas");
      const ids: Record<TurnoId, string | null> = { matutino: null, vespertino: null, noturno: null, integral: null };
      const dados: Record<TurnoId, Aula[]> = { matutino: [], vespertino: [], noturno: [], integral: [] };

      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (turno in dados) {
          ids[turno] = c.id;
          // Filtra apenas aulas desta sala ou intervalos
          const aulasFiltradas = c.aulas
            .filter(a => a.isInterval || a.sala?.id === salaId)
            .map((a) => ({
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
            }))
            .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

          dados[turno] = aulasFiltradas;
          if (ids[turno] === null) ids[turno] = c.id;
        }
      });

      setCronogramaIds(ids);
      setCronogramas(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os cronogramas.");
    } finally {
      setCarregando(false);
    }
  }, [salaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

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
    router.push({
      pathname: "/CriarHorario",
      params: { cronogramaId, turno: selectedTurno, salaIdPre: salaId },
    });
  };

  const handleAulaPress = (aula: Aula) => {
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
        isInterval: aula.isInterval ? "true" : "false",
      },
    });
  };

  const tituloSala = salaTurma ? `${salaNome} — ${salaTurma}` : salaNome;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{tituloSala}</Text>
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

          {/* Botões de ação */}
          <View style={act.botoesRow}>
            <TouchableOpacity
              style={act.btnSecondary}
              onPress={() => router.push({ pathname: "/HorarioAulas", params: { turno: selectedTurno, salaId } })}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={17} color="#3a7d44" />
              <Text style={act.btnSecondaryText}>Horário das Aulas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={act.btn} onPress={handleCriarHorario} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={17} color="#fff" />
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

    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const cal = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#aaa", textAlign: "center" },
  emptyHint: { fontSize: 13, color: "#ccc", textAlign: "center" },

  dayHeader: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayHeaderText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },

  timeCol: { justifyContent: "flex-start", paddingTop: 10, alignItems: "center", gap: 1 },
  timeText: { fontSize: 10, fontWeight: "800", color: "#555" },
  timeTextEnd: { fontSize: 9, fontWeight: "800", color: "#555" },

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
  aulaTime: { fontSize: 10, fontWeight: "800" },
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

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionHeaderText: {
    fontSize: 11, fontWeight: "700", color: "#999",
    textTransform: "uppercase", letterSpacing: 0.6,
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

  intervaloFaixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8F0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  intervaloFaixaText: { fontSize: 12, color: "#92400e", fontWeight: "600", flex: 1 },

  intervaloCelula: {
    flex: 1,
    minHeight: 54,
    backgroundColor: "#FFF8F0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: 6,
  },
  intervaloCelulaText: { fontSize: 10, color: "#92400e", fontWeight: "700" },
  intervaloCelulaHora: { fontSize: 9, color: "#b45309" },
});

const act = StyleSheet.create({
  botoesRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#3a7d44",
  },
  btnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  btnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#3a7d44",
  },
  btnSecondaryText: { fontSize: 13, fontWeight: "700", color: "#3a7d44" },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
});
