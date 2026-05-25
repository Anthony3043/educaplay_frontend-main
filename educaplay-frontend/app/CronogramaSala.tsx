import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles as s } from "@/styles/Cronogramasstyles";
import {
  computeSchedule,
  intervalStorageKey,
  DEFAULT_INT1_GAP,
  DEFAULT_INT2_GAP,
  SLOT_H,
} from "@/src/constants/slots";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  UIManager,
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SNAP = Math.round((SLOT_H + 8) / 2);

export type TurnoId = "matutino" | "vespertino";

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
  { id: "matutino",   label: "Matutino",   ionicon: "sunny-outline",       time: "07:00 - 12:45" },
  { id: "vespertino", label: "Vespertino", ionicon: "partly-sunny-outline", time: "13:00 - 18:45" },
];

const TURNO_COLORS: Record<TurnoId, string> = {
  matutino:   "#F59E0B",
  vespertino: "#3B82F6",
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const COL_W = 115;
const TIME_W = 46;

// ─── CalendarioSemanal ────────────────────────────────────────────────────────
function CalendarioSemanal({
  aulas,
  turno,
  onPress,
  onPressEmpty,
  onDragging,
}: {
  aulas: Aula[];
  turno: TurnoId;
  onPress: (a: Aula) => void;
  onPressEmpty: (dia: string, timeStart: string, timeEnd: string) => void;
  onDragging?: (d: boolean) => void;
}) {
  const cor = TURNO_COLORS[turno] || "#3a7d44";

  const [int1Gap, setInt1Gap] = useState(DEFAULT_INT1_GAP);
  const [int2Gap, setInt2Gap] = useState(DEFAULT_INT2_GAP);

  const i1Ref  = useRef(DEFAULT_INT1_GAP);
  const i2Ref  = useRef(DEFAULT_INT2_GAP);
  const base1  = useRef(0);
  const base2  = useRef(0);
  const anim1  = useRef(new Animated.Value(0)).current;
  const anim2  = useRef(new Animated.Value(0)).current;

  const storageKey = intervalStorageKey(turno);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!raw) return;
      try {
        const { g1, g2 } = JSON.parse(raw) as { g1: number; g2: number };
        if (Number.isInteger(g1) && Number.isInteger(g2) && g1 >= 0 && g2 <= 7 && g1 < g2) {
          i1Ref.current = g1; i2Ref.current = g2;
          setInt1Gap(g1); setInt2Gap(g2);
        }
      } catch {}
    });
  }, [storageKey]);

  const save = () =>
    AsyncStorage.setItem(storageKey, JSON.stringify({ g1: i1Ref.current, g2: i2Ref.current }));

  const pr1 = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (_, gs) => { base1.current = gs.dy; onDragging?.(true); },
    onPanResponderMove: (_, gs) => {
      const rel = gs.dy - base1.current;
      anim1.setValue(rel);
      if (rel > SNAP && i1Ref.current + 1 < i2Ref.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        base1.current = gs.dy; anim1.setValue(0);
        i1Ref.current++; setInt1Gap(i1Ref.current);
      } else if (rel < -SNAP && i1Ref.current > 0) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        base1.current = gs.dy; anim1.setValue(0);
        i1Ref.current--; setInt1Gap(i1Ref.current);
      }
    },
    onPanResponderRelease:   () => { anim1.setValue(0); onDragging?.(false); save(); },
    onPanResponderTerminate: () => { anim1.setValue(0); onDragging?.(false); },
  })).current;

  const pr2 = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (_, gs) => { base2.current = gs.dy; onDragging?.(true); },
    onPanResponderMove: (_, gs) => {
      const rel = gs.dy - base2.current;
      anim2.setValue(rel);
      if (rel > SNAP && i2Ref.current < 7) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        base2.current = gs.dy; anim2.setValue(0);
        i2Ref.current++; setInt2Gap(i2Ref.current);
      } else if (rel < -SNAP && i2Ref.current - 1 > i1Ref.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        base2.current = gs.dy; anim2.setValue(0);
        i2Ref.current--; setInt2Gap(i2Ref.current);
      }
    },
    onPanResponderRelease:   () => { anim2.setValue(0); onDragging?.(false); save(); },
    onPanResponderTerminate: () => { anim2.setValue(0); onDragging?.(false); },
  })).current;

  const schedule = computeSchedule(turno, int1Gap, int2Gap);

  // Fast lookup: dia_timeStart → Aula
  const lookup: Record<string, Aula> = {};
  aulas
    .filter(a => !a.isInterval && !!a.diaSemana)
    .forEach(a => { const k = `${a.diaSemana}_${a.timeStart}`; if (!lookup[k]) lookup[k] = a; });

  const semDia = aulas
    .filter(a => !a.isInterval && !a.diaSemana)
    .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  return (
    <View>
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

          {/* Linhas da grade */}
          {schedule.map(item => {
            if (item.type === "intervalo") {
              const isI1 = item.intervalId === "i1";
              const anim = isI1 ? anim1 : anim2;
              const panHandlers = isI1 ? pr1.panHandlers : pr2.panHandlers;

              return (
                <Animated.View
                  key={item.key}
                  style={[
                    { flexDirection: "row", marginBottom: 6, alignItems: "center", zIndex: 5 },
                    { transform: [{ translateY: anim }] },
                  ]}
                >
                  <View style={[cal.timeCol, { width: TIME_W }]}>
                    <Text style={cal.timeText}>{item.start}</Text>
                    <Text style={cal.timeTextEnd}>{item.end}</Text>
                  </View>
                  <View
                    style={[cal.intervaloFaixa, { width: COL_W * DIAS_SEMANA.length }]}
                    {...panHandlers}
                  >
                    <Ionicons name="cafe-outline" size={14} color="#92400e" />
                    <Text style={cal.intervaloFaixaText} numberOfLines={1}>
                      {item.label} · {item.start} – {item.end}
                    </Text>
                    <Ionicons name="reorder-three-outline" size={20} color="#b45309" />
                  </View>
                </Animated.View>
              );
            }

            // Linha de aula: células por dia
            return (
              <View key={item.key} style={{ flexDirection: "row", marginBottom: 6, alignItems: "stretch" }}>
                <View style={[cal.timeCol, { width: TIME_W }]}>
                  <Text style={cal.timeText}>{item.start}</Text>
                  <Text style={cal.timeTextEnd}>{item.end}</Text>
                </View>
                {DIAS_SEMANA.map(dia => {
                  const aula = lookup[`${dia}_${item.start}`];
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
                      ) : (
                        <TouchableOpacity
                          style={cal.emptyCell}
                          onPress={() => onPressEmpty(dia, item.start, item.end)}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="add-circle-outline" size={20} color="#ddd" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Aulas sem dia específico */}
      {semDia.length > 0 && (
        <View style={{ marginTop: 20 }}>
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
    matutino: [], vespertino: [],
  });
  const [cronogramaIds, setCronogramaIds] = useState<Record<TurnoId, string | null>>({
    matutino: null, vespertino: null,
  });
  const [carregando, setCarregando] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get("/cronogramas");
      const ids: Record<TurnoId, string | null> = { matutino: null, vespertino: null };
      const dados: Record<TurnoId, Aula[]> = { matutino: [], vespertino: [] };

      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (!["matutino", "vespertino"].includes(turno)) return;
        ids[turno] = c.id;
        dados[turno] = c.aulas
          .filter(a => a.sala?.id === salaId)
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

  const handleEmptySlotPress = async (dia: string, timeStart: string, timeEnd: string) => {
    let cronogramaId = cronogramaIds[selectedTurno];
    if (!cronogramaId) {
      try {
        const res = await api.post("/cronogramas", { turno: selectedTurno });
        cronogramaId = res.data.id;
        setCronogramaIds(prev => ({ ...prev, [selectedTurno]: cronogramaId! }));
      } catch {
        Alert.alert("Erro", "Não foi possível iniciar o cronograma.");
        return;
      }
    }
    router.push({
      pathname: "/CriarHorario",
      params: {
        cronogramaId,
        turno: selectedTurno,
        salaIdPre: salaId,
        timeStart,
        timeEnd,
        diaSemana: dia,
      },
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
        <ScrollView
          scrollEnabled={!isDragging}
          contentContainerStyle={s.scrollContent}
        >
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
                  <Text style={s.turnoLabel} numberOfLines={1}>{turno.label}</Text>
                  <Text style={s.turnoTime} numberOfLines={1}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dica de uso */}
          <View style={act.dicaBanner}>
            <Ionicons name="hand-left-outline" size={15} color="#1d4ed8" />
            <Text style={act.dicaText}>
              Toque numa célula vazia para criar um horário. Arraste os intervalos para reposicioná-los.
            </Text>
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
              onPressEmpty={handleEmptySlotPress}
              onDragging={setIsDragging}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const cal = StyleSheet.create({
  dayHeader: { backgroundColor: "#1a1a2e", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  dayHeaderText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },

  timeCol: { justifyContent: "flex-start", paddingTop: 10, alignItems: "center", gap: 1 },
  timeText: { fontSize: 10, fontWeight: "800", color: "#555" },
  timeTextEnd: { fontSize: 9, fontWeight: "800", color: "#555" },

  aulaCard: {
    backgroundColor: "#FAFFFE", borderRadius: 10, borderLeftWidth: 3, padding: 9, flex: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  aulaTime: { fontSize: 10, fontWeight: "800" },
  aulaSubject: { fontSize: 12, fontWeight: "700", color: "#1a1a2e", marginBottom: 5, lineHeight: 16 },
  detail: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  detailText: { fontSize: 10, color: "#666", flex: 1 },

  emptyCell: {
    flex: 1, minHeight: 76, borderWidth: 1, borderColor: "#EBEBEB",
    borderRadius: 10, borderStyle: "dashed", backgroundColor: "#FAFAFA",
    alignItems: "center", justifyContent: "center",
  },

  intervaloFaixa: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFF8F0", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: "#FED7AA",
  },
  intervaloFaixaText: { fontSize: 12, color: "#92400e", fontWeight: "600", flex: 1 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionHeaderText: { fontSize: 11, fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: 0.6 },

  rowCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#F0F0F0", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  rowTimeBox: { alignItems: "center", width: 44, gap: 2 },
  rowTimeStart: { fontSize: 12, fontWeight: "800", color: "#1a1a2e" },
  rowTimeEnd: { fontSize: 11, color: "#aaa" },
  rowSubject: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginBottom: 3 },
});

const act = StyleSheet.create({
  calHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  dicaBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  dicaText: { fontSize: 12, color: "#1d4ed8", flex: 1, lineHeight: 17 },
});
