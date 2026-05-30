import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { styles as s } from "@/styles/Cronogramasstyles";
import { Colors } from "@/src/constants/colors";
import {
  computeSchedule,
  intervalStorageKey,
  intervalStorageKeyPerDay,
  timeToSlotIndex,
  DEFAULT_INT1_GAP,
  DEFAULT_INT2_GAP,
  SLOT_H,
  INT_H,
} from "@/src/constants/slots";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  LayoutAnimation,
  PanResponder,
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

  const [dayGaps, setDayGaps] = useState<Record<string, { g1: number; g2: number }>>(
    () => Object.fromEntries(DIAS_SEMANA.map(d => [d, { g1: DEFAULT_INT1_GAP, g2: DEFAULT_INT2_GAP }]))
  );

  const gapRefs = useRef<Record<string, { g1: number; g2: number }>>(
    Object.fromEntries(DIAS_SEMANA.map(d => [d, { g1: DEFAULT_INT1_GAP, g2: DEFAULT_INT2_GAP }]))
  );
  const baseRefs = useRef<Record<string, number>>(
    Object.fromEntries(DIAS_SEMANA.flatMap(d => [`${d}_i1`, `${d}_i2`].map(k => [k, 0])))
  );
  const animRefs = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(DIAS_SEMANA.flatMap(d => [`${d}_i1`, `${d}_i2`].map(k => [k, new Animated.Value(0)])))
  );

  useEffect(() => {
    DIAS_SEMANA.forEach(async (dia) => {
      try {
        let raw = await AsyncStorage.getItem(intervalStorageKeyPerDay(turno, dia));
        if (!raw) raw = await AsyncStorage.getItem(intervalStorageKey(turno));
        if (!raw) return;
        const { g1, g2 } = JSON.parse(raw) as { g1: number; g2: number };
        if (Number.isInteger(g1) && Number.isInteger(g2) && g1 >= 0 && g2 <= 7 && g1 < g2) {
          gapRefs.current[dia] = { g1, g2 };
          setDayGaps(prev => ({ ...prev, [dia]: { g1, g2 } }));
        }
      } catch {}
    });
  }, [turno]);

  // 12 PanResponders (6 days × 2 intervals), created once via IIFE in useRef
  const pansRef = useRef((() => {
    const pans: Record<string, ReturnType<typeof PanResponder.create>> = {};
    DIAS_SEMANA.forEach(dia => {
      (["i1", "i2"] as const).forEach(iKey => {
        const panKey = `${dia}_${iKey}`;
        pans[panKey] = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (_, gs) => {
            baseRefs.current[panKey] = gs.dy;
            onDragging?.(true);
          },
          onPanResponderMove: (_, gs) => {
            const rel = gs.dy - baseRefs.current[panKey];
            animRefs.current[panKey].setValue(rel);
            const dg = gapRefs.current[dia];
            if (iKey === "i1") {
              if (rel > SNAP && dg.g1 + 1 < dg.g2) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                baseRefs.current[panKey] = gs.dy; animRefs.current[panKey].setValue(0);
                dg.g1++;
                setDayGaps(prev => ({ ...prev, [dia]: { g1: dg.g1, g2: dg.g2 } }));
                AsyncStorage.setItem(intervalStorageKeyPerDay(turno, dia), JSON.stringify({ g1: dg.g1, g2: dg.g2 }));
              } else if (rel < -SNAP && dg.g1 > 0) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                baseRefs.current[panKey] = gs.dy; animRefs.current[panKey].setValue(0);
                dg.g1--;
                setDayGaps(prev => ({ ...prev, [dia]: { g1: dg.g1, g2: dg.g2 } }));
                AsyncStorage.setItem(intervalStorageKeyPerDay(turno, dia), JSON.stringify({ g1: dg.g1, g2: dg.g2 }));
              }
            } else {
              if (rel > SNAP && dg.g2 < 7) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                baseRefs.current[panKey] = gs.dy; animRefs.current[panKey].setValue(0);
                dg.g2++;
                setDayGaps(prev => ({ ...prev, [dia]: { g1: dg.g1, g2: dg.g2 } }));
                AsyncStorage.setItem(intervalStorageKeyPerDay(turno, dia), JSON.stringify({ g1: dg.g1, g2: dg.g2 }));
              } else if (rel < -SNAP && dg.g2 - 1 > dg.g1) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                baseRefs.current[panKey] = gs.dy; animRefs.current[panKey].setValue(0);
                dg.g2--;
                setDayGaps(prev => ({ ...prev, [dia]: { g1: dg.g1, g2: dg.g2 } }));
                AsyncStorage.setItem(intervalStorageKeyPerDay(turno, dia), JSON.stringify({ g1: dg.g1, g2: dg.g2 }));
              }
            }
          },
          onPanResponderRelease: () => {
            animRefs.current[panKey].setValue(0);
            onDragging?.(false);
          },
          onPanResponderTerminate: () => {
            animRefs.current[panKey].setValue(0);
            onDragging?.(false);
          },
        });
      });
    });
    return pans;
  })());

  // Lookup by slotIndex (1-7) so dragging intervals never breaks existing aulas
  const lookup: Record<string, Aula> = {};
  aulas
    .filter(a => !a.isInterval && !!a.diaSemana)
    .forEach(a => {
      const si = timeToSlotIndex(turno, a.timeStart);
      if (si !== null) {
        const k = `${a.diaSemana}_${si}`;
        if (!lookup[k]) lookup[k] = a;
      }
    });

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
            {DIAS_SEMANA.map(dia => (
              <View key={dia} style={{ width: COL_W, paddingHorizontal: 3 }}>
                <View style={cal.dayHeader}>
                  <Text style={cal.dayHeaderText}>{dia.slice(0, 3).toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Colunas por dia — cada uma com seu próprio schedule */}
          <View style={{ flexDirection: "row" }}>
            {DIAS_SEMANA.map(dia => {
              const dg = dayGaps[dia];
              const daySchedule = computeSchedule(turno, dg.g1, dg.g2);
              return (
                <View key={dia} style={{ width: COL_W, paddingHorizontal: 3 }}>
                  {daySchedule.map(item => {
                    if (item.type === "intervalo") {
                      const iKey = item.intervalId!;
                      const panKey = `${dia}_${iKey}`;
                      return (
                        <Animated.View
                          key={item.key}
                          style={[
                            cal.intervaloCelula,
                            {
                              marginBottom: 6,
                              zIndex: 5,
                              elevation: 5,
                              transform: [{ translateY: animRefs.current[panKey] }],
                            },
                          ]}
                          {...pansRef.current[panKey].panHandlers}
                        >
                          <Text style={cal.intervaloCelulaText} numberOfLines={1}>
                            {item.start}–{item.end}
                          </Text>
                          <Ionicons name="reorder-three-outline" size={18} color={Colors.warningText} />
                        </Animated.View>
                      );
                    }
                    // Lookup by slot index so moving intervals doesn't break existing aulas
                    const aula = item.slotIndex !== undefined ? lookup[`${dia}_${item.slotIndex}`] : undefined;
                    return (
                      <View key={item.key} style={{ marginBottom: 6, height: SLOT_H, overflow: "hidden" }}>
                        {aula ? (
                          <TouchableOpacity
                            style={[cal.aulaCard, { borderLeftColor: cor }]}
                            onPress={() => onPress(aula)}
                            activeOpacity={0.82}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 4 }}>
                              <Text style={[cal.aulaTime, { color: cor }]}>{item.start}</Text>
                              <Text style={{ fontSize: 8, color: cor, opacity: 0.7 }}>–</Text>
                              <Text style={[cal.aulaTime, { color: cor }]}>{item.end}</Text>
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
  const { usuario } = useAuth();
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
  const [exportando, setExportando] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

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
      showInfo("Erro", "Não foi possível carregar os cronogramas.", "erro");
    } finally {
      setCarregando(false);
    }
  }, [salaId, showInfo]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const handleEmptySlotPress = async (dia: string, timeStart: string, timeEnd: string) => {
    let cronogramaId = cronogramaIds[selectedTurno];
    if (!cronogramaId) {
      try {
        const res = await api.post("/cronogramas", { turno: selectedTurno });
        cronogramaId = res.data.id;
        setCronogramaIds(prev => ({ ...prev, [selectedTurno]: cronogramaId! }));
      } catch {
        showInfo("Erro", "Não foi possível iniciar o cronograma.", "erro");
        return;
      }
    }
    router.push({
      pathname: "/supervisao/CriarHorario",
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
      pathname: "/shared/AulaDetalhe",
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

  const gerarPDF = async () => {
    setExportando(true);
    try {
      const turno = selectedTurno;
      const aulasTurno = cronogramas[turno];
      const turnoLabel = turno === "matutino" ? "Matutino" : "Vespertino";
      const dataStr = new Date().toLocaleDateString("pt-BR");
      const instituicao = (usuario as any)?.instituicao || "";

      // Lookup de aulas por índice de slot
      const lookup: Record<string, Aula> = {};
      aulasTurno
        .filter(a => !a.isInterval && !!a.diaSemana)
        .forEach(a => {
          const si = timeToSlotIndex(turno, a.timeStart);
          if (si !== null) {
            const k = `${a.diaSemana}_${si}`;
            if (!lookup[k]) lookup[k] = a;
          }
        });

      // Carrega gaps reais de cada dia do AsyncStorage
      const dayGapValues: Record<string, { g1: number; g2: number }> = {};
      for (const dia of DIAS_SEMANA) {
        try {
          let raw = await AsyncStorage.getItem(intervalStorageKeyPerDay(turno, dia));
          if (!raw) raw = await AsyncStorage.getItem(intervalStorageKey(turno));
          if (raw) {
            const { g1, g2 } = JSON.parse(raw);
            if (Number.isInteger(g1) && Number.isInteger(g2) && g1 >= 0 && g2 <= 7 && g1 < g2) {
              dayGapValues[dia] = { g1, g2 };
              continue;
            }
          }
        } catch {}
        dayGapValues[dia] = { g1: DEFAULT_INT1_GAP, g2: DEFAULT_INT2_GAP };
      }

      // Gera colunas independentes por dia (mesma ordem do app)
      const dayCols = DIAS_SEMANA.map(dia => {
        const sched = computeSchedule(turno, dayGapValues[dia].g1, dayGapValues[dia].g2);
        const items = sched.map(item => {
          if (item.type === "intervalo") {
            return `<div class="cell intervalo">
              <div class="t-int">☕ ${item.start}–${item.end}</div>
              <div class="int-lbl">Intervalo</div>
            </div>`;
          }
          const aula = item.slotIndex !== undefined ? lookup[`${dia}_${item.slotIndex}`] : undefined;
          return aula
            ? `<div class="cell filled">
                <div class="t-aula">${item.start}–${item.end}</div>
                <div class="subj">${aula.subject}</div>
              </div>`
            : `<div class="cell empty">
                <div class="t-empty">${item.start}–${item.end}</div>
                <span class="dash">—</span>
              </div>`;
        }).join("");
        return `<div class="col">
          <div class="day-hdr">${dia.slice(0, 3).toUpperCase()}</div>
          ${items}
        </div>`;
      }).join("");

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;padding:26px;background:#fff;color:#1a1a2e}
.header{padding-bottom:12px;margin-bottom:16px;border-bottom:2px solid #e2e8f0}
.inst{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}
h1{font-size:20px;font-weight:800;color:#0f172a}
.sub{font-size:11px;color:#64748b;margin-top:4px}
.grid{display:flex;gap:5px}
.col{flex:1}
.day-hdr{background:#f1f5f9;color:#334155;text-align:center;padding:8px 2px;font-size:10px;font-weight:800;border-radius:6px;margin-bottom:4px;letter-spacing:.7px;border:1px solid #e2e8f0}
.cell{border-radius:6px;padding:7px 5px;margin-bottom:4px;height:68px;display:flex;flex-direction:column;justify-content:center;border:1px solid #e2e8f0}
.filled{background:#fff;border-left:3px solid #3b82f6}
.empty{background:#f8fafc;border-style:dashed;align-items:center}
.intervalo{background:#fffbeb;border:1px solid #fde68a;border-left:3px solid #f59e0b;align-items:center}
.t-aula{font-size:8.5px;font-weight:700;color:#3b82f6;margin-bottom:3px}
.t-empty{font-size:8.5px;color:#94a3b8;margin-bottom:3px}
.t-int{font-size:9px;font-weight:700;color:#d97706;margin-bottom:2px}
.subj{font-size:10.5px;font-weight:700;color:#0f172a;line-height:1.3}
.dash{color:#cbd5e1;font-size:13px}
.int-lbl{font-size:8px;color:#92400e;font-weight:600;letter-spacing:.3px}
.footer{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="header">
  ${instituicao ? `<div class="inst">${instituicao}</div>` : ""}
  <h1>${tituloSala}</h1>
  <div class="sub">Turno ${turnoLabel} &nbsp;·&nbsp; ${dataStr}</div>
</div>
<div class="grid">${dayCols}</div>
<div class="footer">EducaPlay · Cronograma gerado em ${dataStr}</div>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // Monta nome do arquivo: "horario_da_Sala_Turma_Turno_DD-MM-AAAA.pdf"
      const dataNome = dataStr.replace(/\//g, "-");
      const turmaPart = salaTurma ? `_${salaTurma}` : "";
      const nomeBruto = `horario_da_${salaNome}${turmaPart}_${turnoLabel}_${dataNome}`;
      const nomeArquivo = nomeBruto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")   // remove acentos
        .replace(/[^a-zA-Z0-9_\-]/g, "_")  // substitui caracteres inválidos
        .replace(/_+/g, "_")               // colapsa underscores duplos
        .replace(/^_|_$/g, "")             // remove underscores nas bordas
        + ".pdf";
      const destFile = new File(Paths.cache, nomeArquivo);
      if (destFile.exists) destFile.delete();
      new File(uri).copy(destFile);
      const novoUri = destFile.uri;

      await Sharing.shareAsync(novoUri, { mimeType: "application/pdf", dialogTitle: "Exportar Cronograma" });
    } catch {
      showInfo("Erro", "Não foi possível gerar o PDF.", "erro");
    } finally {
      setExportando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}>
          <Text
            style={[s.headerTitle, { fontSize: 16, lineHeight: 20 }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontSize={12}
          >
            {tituloSala}
          </Text>
        </View>
        <TouchableOpacity
          style={pdfSt.btn}
          onPress={gerarPDF}
          disabled={exportando}
          activeOpacity={0.7}
        >
          {exportando
            ? <ActivityIndicator size={16} color="#fff" />
            : <Ionicons name="document-text-outline" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
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
                    color={selectedTurno === turno.id ? TURNO_COLORS[turno.id] : Colors.textPrimary}
                  />
                  <Text style={s.turnoLabel} numberOfLines={1}>{turno.label}</Text>
                  <Text style={s.turnoTime} numberOfLines={1}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dica de uso */}
          <View style={act.dicaBanner}>
            <Ionicons name="hand-left-outline" size={15} color={Colors.primary} />
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
              key={selectedTurno}
              aulas={cronogramas[selectedTurno]}
              turno={selectedTurno}
              onPress={handleAulaPress}
              onPressEmpty={handleEmptySlotPress}
              onDragging={setIsDragging}
            />
          </View>
        </ScrollView>
      )}

      {/* Modal de feedback */}
      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={inf.overlay}>
          <View style={inf.box}>
            <View style={[inf.iconCircle, { backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : modalInfo.tipo === "sucesso" ? "#dcfce7" : "#FFF7ED" }]}>
              <Ionicons name={modalInfo.tipo === "erro" ? "close-circle-outline" : modalInfo.tipo === "sucesso" ? "checkmark-circle-outline" : "warning-outline"} size={32} color={modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316"} />
            </View>
            <Text style={[inf.titulo, { color: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]}>{modalInfo.titulo}</Text>
            <Text style={inf.msg}>{modalInfo.mensagem}</Text>
            <TouchableOpacity style={[inf.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]} onPress={() => setModalInfo(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={inf.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const inf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 3 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const cal = StyleSheet.create({
  dayHeader: {
    backgroundColor: "#1C2B3A", borderRadius: 12, paddingVertical: 10, alignItems: "center",
    marginBottom: 2,
  },
  dayHeaderText: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: 1.2 },

  aulaCard: {
    backgroundColor: "#fff", borderRadius: 12, borderLeftWidth: 3, padding: 9, flex: 1,
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  aulaTime: { fontSize: 10, fontWeight: "800" },
  aulaSubject: { fontSize: 11, fontWeight: "700", color: "#111827", marginBottom: 4, lineHeight: 15 },
  detail: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  detailText: { fontSize: 9, color: "#9CA3AF", flex: 1 },

  emptyCell: {
    flex: 1, borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 12, borderStyle: "dashed", backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center",
  },

  intervaloCelula: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: INT_H,
    backgroundColor: "#FFFBEB", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8,
    borderWidth: 1.5, borderColor: "#FDE68A",
    shadowColor: "#F59E0B", shadowOpacity: 0.12, shadowRadius: 4, elevation: 1,
  },
  intervaloCelulaText: { fontSize: 10, color: "#92400e", fontWeight: "700", flex: 1, marginRight: 2 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 8 },
  sectionHeaderText: { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.6 },

  rowCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#F1F5F9", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  rowTimeBox: { alignItems: "center", width: 50, gap: 2 },
  rowTimeStart: { fontSize: 14, fontWeight: "800", color: "#111827" },
  rowTimeEnd: { fontSize: 11, color: "#9CA3AF" },
  rowSubject: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 3 },
});

const act = StyleSheet.create({
  calHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  dicaBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 4, marginTop: 8,
    backgroundColor: Colors.primaryPale, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  dicaText: { fontSize: 12, color: Colors.primary, flex: 1, lineHeight: 18 },
});

const pdfSt = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
