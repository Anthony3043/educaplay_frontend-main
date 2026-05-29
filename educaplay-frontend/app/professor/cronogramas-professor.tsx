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
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

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
      showInfo("Erro", "Não foi possível carregar o cronograma.", "erro");
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id, showInfo]);

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
        showInfo("Permissão negada", "Precisamos de acesso à sua localização para registrar o ponto.", "aviso");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      await api.post("/ponto", { aulaId: aula.id, diaSemana: selectedDia, latitude, longitude });
      setPontosBatidos((prev) => ({ ...prev, [aula.id]: true }));
      showInfo("Ponto registrado!", `Presença confirmada na aula de ${aula.subject}.`, "sucesso");
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.fora) {
        setModalPontoErro({ distancia: data.distancia, raio: data.raio });
      } else if (err?.response?.status === 409) {
        showInfo("Já registrado", "Você já bateu o ponto nesta aula hoje.", "aviso");
        setPontosBatidos((prev) => ({ ...prev, [aula.id]: true }));
      } else {
        showInfo("Erro", data?.error || "Não foi possível registrar o ponto.", "erro");
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
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Cronograma</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: 80 }]}>

          {/* Resumo */}
          <View style={rs.card}>
            <Ionicons name="school-outline" size={110} color="rgba(255,255,255,0.07)" style={{ position: "absolute", top: -14, right: -14 }} />
            <View style={rs.decoCircle1} />
            <View style={rs.decoCircle2} />
            <View style={rs.cardContent}>
              <View style={rs.badgeRow}>
                <View style={rs.badge}>
                  <Ionicons name="person-outline" size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={rs.badgeText}>Olá, {usuario?.nome?.split(" ")[0]}!</Text>
                </View>
              </View>
              <View style={rs.countRow}>
                <Text style={rs.countNum}>{totalAulas}</Text>
                <Text style={rs.countLabel}>aula{totalAulas !== 1 ? "s" : ""}{"\n"}atribuída{totalAulas !== 1 ? "s" : ""}</Text>
              </View>
            </View>
            <View style={rs.statsCol}>
              <View style={[rs.statPill, { backgroundColor: "rgba(245,158,11,0.22)" }]}>
                <Ionicons name="sunny-outline" size={13} color="#FCD34D" />
                <Text style={[rs.statNum, { color: "#FCD34D" }]}>{minhasAulas.filter(a => a.turno === "matutino").length}</Text>
                <Text style={rs.statLabel}>mat.</Text>
              </View>
              <View style={[rs.statPill, { backgroundColor: "rgba(59,130,246,0.22)" }]}>
                <Ionicons name="partly-sunny-outline" size={13} color="#93C5FD" />
                <Text style={[rs.statNum, { color: "#93C5FD" }]}>{minhasAulas.filter(a => a.turno === "vespertino").length}</Text>
                <Text style={rs.statLabel}>vesp.</Text>
              </View>
            </View>
          </View>

          {/* Seletor de turno */}
          <View style={s.section}>
            <View style={pv.secHeader}>
              <Ionicons name="time-outline" size={16} color="#3a7d44" />
              <Text style={[s.sectionTitle, { marginBottom: 0 }]}>Turno</Text>
            </View>
            <View style={[s.turnoGrid, { justifyContent: "flex-start" }]}>
              {TURNOS.map((turno) => {
                const ativo = selectedTurno === turno.id;
                const cor = TURNO_COLORS[turno.id];
                return (
                  <TouchableOpacity
                    key={turno.id}
                    style={[
                      pv.turnoCard,
                      ativo && { borderColor: cor, backgroundColor: "#fff", shadowColor: cor, shadowOpacity: 0.22, elevation: 6 },
                    ]}
                    onPress={() => { setSelectedTurno(turno.id); setSelectedDia(null); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={turno.ionicon} size={80} color={ativo ? cor + "20" : "#00000009"} style={pv.turnoGhostIcon} />
                    <View style={pv.turnoGlint} />
                    <View style={[pv.turnoIconWrap, { backgroundColor: ativo ? cor + "20" : "#F0F0F0" }]}>
                      <Ionicons name={turno.ionicon} size={22} color={ativo ? cor : "#888"} />
                    </View>
                    <Text style={[s.turnoLabel, ativo && { color: cor, fontWeight: "800" }]} numberOfLines={1}>{turno.label}</Text>
                    <Text style={s.turnoTime} numberOfLines={1}>{turno.time}</Text>
                    {ativo && <View style={[pv.turnoDot, { backgroundColor: cor }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Seletor de dia — calendário horizontal */}
          <View style={s.section}>
            <View style={pv.secHeader}>
              <Ionicons name="calendar-outline" size={16} color="#3a7d44" />
              <Text style={[s.sectionTitle, { marginBottom: 0 }]}>Selecione o dia</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={cr.diasScroll}
            >
              {DIAS_SEMANA.map((dia) => {
                const count = minhasAulas.filter(a => a.turno === selectedTurno && a.diaSemana === dia).length;
                const ativo = selectedDia === dia;
                const cor = TURNO_COLORS[selectedTurno];
                return (
                  <TouchableOpacity
                    key={dia}
                    style={[cr.diaBtn, ativo && { backgroundColor: cor, borderColor: cor, shadowColor: cor, shadowOpacity: 0.35, elevation: 6 }]}
                    onPress={() => setSelectedDia(ativo ? null : dia)}
                    activeOpacity={0.75}
                  >
                    <Text style={[cr.diaNome, ativo && { color: "#fff" }]}>{dia.slice(0, 3).toUpperCase()}</Text>
                    {count > 0 ? (
                      <View style={[cr.diaBadge, { backgroundColor: ativo ? "rgba(255,255,255,0.25)" : cor + "20" }]}>
                        <Text style={[cr.diaBadgeText, { color: ativo ? "#fff" : cor }]}>{count}</Text>
                      </View>
                    ) : (
                      <View style={cr.diaVazioLine} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Grade de horários — timeline */}
          {!selectedDia ? (
            <View style={cr.promptWrap}>
              <View style={cr.promptIconWrap}>
                <Ionicons name="calendar-outline" size={36} color="#3a7d44" />
              </View>
              <Text style={cr.promptTitle}>Selecione um dia acima</Text>
              <Text style={cr.promptSub}>Seus horários e aulas aparecem aqui</Text>
            </View>
          ) : (
            <View style={cr.timelineWrap}>
              {/* Cabeçalho da grade */}
              <View style={cr.gradeHeader}>
                <View style={[cr.gradeHeaderDot, { backgroundColor: TURNO_COLORS[selectedTurno] }]} />
                <Text style={cr.gradeHeaderTitle}>{selectedDia}</Text>
                <View style={[cr.gradePill, { backgroundColor: TURNO_COLORS[selectedTurno] + "18", borderColor: TURNO_COLORS[selectedTurno] + "40" }]}>
                  <Text style={[cr.gradePillText, { color: TURNO_COLORS[selectedTurno] }]}>
                    {TURNOS.find(t => t.id === selectedTurno)?.label}
                  </Text>
                </View>
              </View>

              {slotEntries.map(({ slot, aula }, idx) => {
                const isLast = idx === slotEntries.length - 1;
                const cor = TURNO_COLORS[selectedTurno];
                return aula ? (
                  <View key={slot.start} style={cr.slotRow}>
                    {/* Timeline */}
                    <View style={cr.timelineCol}>
                      <View style={[cr.timelineDot, { backgroundColor: cor }]} />
                      {!isLast && <View style={[cr.timelineLine, { backgroundColor: cor + "30" }]} />}
                    </View>

                    {/* Card da aula */}
                    <View style={[cr.aulaCard, { borderLeftColor: cor }]}>
                      {/* Linha de tempo */}
                      <TouchableOpacity style={cr.aulaCardTop} onPress={() => handleAulaPress(aula)} activeOpacity={0.82}>
                        <View style={cr.aulaTimeCol}>
                          <Text style={[cr.aulaHoraStart, { color: cor }]}>{slot.start}</Text>
                          <Text style={cr.aulaHoraEnd}>{slot.end}</Text>
                        </View>
                        <View style={cr.aulaInfoCol}>
                          <Text style={cr.aulaSubject} numberOfLines={2}>{aula.subject}</Text>
                          {aula.salaNome && (
                            <View style={cr.aulaMetaRow}>
                              <Ionicons name="business-outline" size={11} color="#9CA3AF" />
                              <Text style={cr.aulaMetaText} numberOfLines={1}>
                                {aula.salaNome}{aula.salaTurma ? ` · ${aula.salaTurma}` : ""}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={15} color="#D1D5DB" />
                      </TouchableOpacity>

                      {/* Ponto */}
                      <View style={cr.pontoDivider} />
                      {pontosBatidos[aula.id] ? (
                        <View style={cr.pontoBatido}>
                          <View style={cr.pontoBatidoIconWrap}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                          <Text style={cr.pontoBatidoText}>Presença confirmada</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[cr.btnPonto, batendoPonto === aula.id && { opacity: 0.6 }]}
                          onPress={() => handleBaterPonto(aula)}
                          disabled={batendoPonto === aula.id}
                          activeOpacity={0.82}
                        >
                          {batendoPonto === aula.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="finger-print-outline" size={16} color="#fff" />
                              <Text style={cr.btnPontoText}>Bater Ponto</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <View key={slot.start} style={cr.slotRow}>
                    <View style={cr.timelineCol}>
                      <View style={cr.vagoTimelineDot} />
                      {!isLast && <View style={cr.timelineLineVago} />}
                    </View>
                    <View style={cr.vagoContent}>
                      <Text style={cr.vagoHora}>{slot.start}</Text>
                      <View style={cr.vagoDash} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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

const inf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 3 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const rs = StyleSheet.create({
  card: {
    backgroundColor: "#3a7d44",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    shadowColor: "#3a7d44",
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  decoCircle1: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)", top: -55, right: 36,
  },
  decoCircle2: {
    position: "absolute", width: 70, height: 70, borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -28, left: -16,
  },
  cardContent: { flex: 1, gap: 10 },
  badgeRow: { flexDirection: "row" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" as const,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
  countRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  countNum: { fontSize: 52, fontWeight: "800", color: "#fff", lineHeight: 56 },
  countLabel: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.72)", lineHeight: 19 },
  statsCol: { gap: 8 },
  statPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, minWidth: 78,
  },
  statNum: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.68)" },
});

const pv = StyleSheet.create({
  secHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  turnoCard: {
    flex: 1, backgroundColor: "#F8F9FA", borderRadius: 18,
    paddingTop: 20, paddingBottom: 14, paddingHorizontal: 10,
    alignItems: "center", gap: 6, borderWidth: 2, borderColor: "transparent",
    overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  turnoGhostIcon: { position: "absolute", top: -16, right: -16 },
  turnoGlint: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 36,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  turnoDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  turnoIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
});

const pt = StyleSheet.create({
  btnPonto: {},
  btnPontoText: {},
  pontoBatido: {},
  pontoBatidoText: {},
});

const cr = StyleSheet.create({
  // Seletor de dia
  diasScroll: { paddingBottom: 4, paddingRight: 4 },
  diaBtn: {
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 16, backgroundColor: "#F8F9FA",
    borderWidth: 1.5, borderColor: "#F0F0F0",
    marginRight: 8, gap: 6, minWidth: 58,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  diaNome: { fontSize: 12, fontWeight: "800", color: "#6B7280", letterSpacing: 0.5 },
  diaBadge: {
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 20, alignItems: "center",
  },
  diaBadgeText: { fontSize: 11, fontWeight: "800" },
  diaVazioLine: { width: 16, height: 2, backgroundColor: "#E5E7EB", borderRadius: 1 },

  // Empty state
  promptWrap: {
    alignItems: "center", paddingVertical: 44, gap: 10,
    marginHorizontal: 16,
  },
  promptIconWrap: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
    marginBottom: 6, borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  promptTitle: { fontSize: 17, fontWeight: "700", color: "#374151" },
  promptSub: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

  // Timeline
  timelineWrap: { marginHorizontal: 16, marginBottom: 16 },
  gradeHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 20,
  },
  gradeHeaderDot: { width: 10, height: 10, borderRadius: 5 },
  gradeHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#111827", flex: 1 },
  gradePill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1.5,
  },
  gradePillText: { fontSize: 12, fontWeight: "700" },

  slotRow: { flexDirection: "row", marginBottom: 4 },
  timelineCol: { width: 28, alignItems: "center", paddingTop: 4 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
  timelineLine: { flex: 1, width: 2, marginTop: 4, minHeight: 32 },
  vagoTimelineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#E5E7EB", borderWidth: 1.5, borderColor: "#D1D5DB",
    zIndex: 2,
  },
  timelineLineVago: { flex: 1, width: 1, marginTop: 4, minHeight: 24, backgroundColor: "#F1F5F9" },

  // Aula card
  aulaCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16,
    borderLeftWidth: 4, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    overflow: "hidden",
  },
  aulaCardTop: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12,
  },
  aulaTimeCol: { alignItems: "flex-end", minWidth: 44 },
  aulaHoraStart: { fontSize: 14, fontWeight: "800", lineHeight: 16 },
  aulaHoraEnd: { fontSize: 10, fontWeight: "600", color: "#9CA3AF", marginTop: 2 },
  aulaInfoCol: { flex: 1 },
  aulaSubject: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4, lineHeight: 20 },
  aulaMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  aulaMetaText: { fontSize: 11, color: "#9CA3AF", flex: 1 },

  pontoDivider: { height: 1, backgroundColor: "#F9FAFB", marginHorizontal: 14 },

  // Ponto batido
  pontoBatido: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  pontoBatidoIconWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center",
  },
  pontoBatidoText: { fontSize: 12, fontWeight: "600", color: "#3a7d44" },

  // Botão bater ponto
  btnPonto: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", margin: 10, borderRadius: 12,
    paddingVertical: 11,
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnPontoText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Slot vago
  vagoContent: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 12,
    paddingLeft: 4, paddingVertical: 8, marginBottom: 4,
  },
  vagoHora: { fontSize: 12, fontWeight: "600", color: "#D1D5DB", width: 38 },
  vagoDash: {
    flex: 1, height: 1, backgroundColor: "#F1F5F9",
    borderRadius: 1, marginRight: 8,
  },
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
