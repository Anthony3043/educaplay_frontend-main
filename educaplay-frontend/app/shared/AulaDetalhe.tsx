import { styles as s } from "@/styles/aulaDetalheStyles";
import { styles as es } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import api from "../../src/services/api";

type Professor = { id: string; nome: string; cargo?: string | null; foto?: string | null };

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const adDs = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "#3a7d44" },
});

const TURNO_LABELS: Record<string, { label: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; color: string }> = {
  matutino:   { label: "Matutino",   ionicon: "sunny-outline",        color: "#F59E0B" },
  vespertino: { label: "Vespertino", ionicon: "partly-sunny-outline",  color: "#3B82F6" },
  noturno:    { label: "Noturno",    ionicon: "moon-outline",          color: "#6366F1" },
  integral:   { label: "Integral",   ionicon: "book-outline",          color: "#10B981" },
};

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin <= 0) return "—";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

export default function AulaDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string; timeStart: string; timeEnd: string;
    subject: string; teacher: string; teacherFoto?: string; turno: string;
    diaSemana: string;
    professorId: string; salaId: string; salaNome: string; salaTurma: string;
    isInterval?: string;
    readOnly?: string;
  }>();

  const ehIntervalo = params.isInterval === "true";
  const ehReadOnly = params.readOnly === "true";

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [profFoto, setProfFoto] = useState<string | null>(
    params.teacherFoto && params.teacherFoto.length > 0 ? params.teacherFoto : null
  );

  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const [modalConfirmar, setModalConfirmar] = useState(false);

  const mostrarInfo = (titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  };

  const [subject, setSubject] = useState(params.subject);
  const [diaSemana, setDiaSemana] = useState<string | null>(params.diaSemana || null);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);

  const turnoInfo = TURNO_LABELS[params.turno] ?? { label: params.turno, ionicon: "calendar-outline" as const, color: "#6366F1" };

  const carregarOpcoes = useCallback(async () => {
    setCarregando(true);
    try {
      const rp = await api.get("/professores?apenasAtivos=true");
      setProfessores(rp.data);
      if (params.professorId) {
        const p = rp.data.find((x: Professor) => x.id === params.professorId);
        if (p) setProfessorSelecionado(p);
      }
    } catch {
      mostrarInfo("Erro", "Não foi possível carregar os professores.", "erro");
    } finally {
      setCarregando(false);
    }
  }, [params.professorId]);

  useEffect(() => {
    if (editando) carregarOpcoes();
  }, [editando, carregarOpcoes]);

  // Busca foto do professor via lista /professores
  useEffect(() => {
    if (!profFoto && params.professorId) {
      api.get("/professores?apenasAtivos=true")
        .then((res) => {
          const prof = (res.data as any[]).find((p) => p.id === params.professorId);
          if (prof?.foto) setProfFoto(prof.foto);
        })
        .catch(() => {});
    }
  }, [params.professorId]);

  const handleSalvar = async () => {
    if (!subject.trim()) {
      mostrarInfo("Atenção", "Informe o nome da matéria.");
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/aulas/${params.id}`, {
        timeStart: params.timeStart,
        timeEnd: params.timeEnd,
        subject: subject.trim(),
        diaSemana: diaSemana || null,
        professorId: professorSelecionado?.id ?? null,
        salaId: params.salaId || null,
      });
      router.back();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 409) {
        mostrarInfo("Conflito de horário", msg || "Conflito detectado.", "erro");
      } else {
        mostrarInfo("Erro", msg || "Não foi possível salvar.", "erro");
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = () => setModalConfirmar(true);

  const confirmarExclusao = async () => {
    setModalConfirmar(false);
    try {
      await api.delete(`/aulas/${params.id}`);
      router.back();
    } catch {
      mostrarInfo("Erro", "Não foi possível excluir a aula.", "erro");
    }
  };

  if (editando) {
    return (
      <SafeAreaView style={es.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />
        <View style={es.header}>
          <TouchableOpacity style={es.backBtn} onPress={() => setEditando(false)} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={es.headerTitle}>Editar Horário</Text>
          <TouchableOpacity style={es.saveBtn} onPress={handleSalvar} disabled={salvando} activeOpacity={0.7}>
            {salvando ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {carregando ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView contentContainerStyle={adNew.scroll} keyboardShouldPersistTaps="handled">
            {/* ── Horário imutável ── */}
            <View style={adNew.timeChip}>
              <View style={adNew.timeChipLeft}>
                <Ionicons name="time-outline" size={16} color="#3a7d44" />
                <Text style={adNew.timeChipText}>{params.timeStart} – {params.timeEnd}</Text>
              </View>
              <View style={adNew.timeChipLock}>
                <Ionicons name="lock-closed-outline" size={11} color="#9CA3AF" />
                <Text style={adNew.timeChipLockText}>Não editável</Text>
              </View>
            </View>

            {/* ── Matéria ── */}
            <View style={adNew.card}>
              <Text style={adNew.cardLabel}>Matéria</Text>
              <TextInput
                style={adNew.materiaInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Nome da matéria..."
                placeholderTextColor="#D1D5DB"
                autoCapitalize="words"
              />
            </View>

            {/* ── Professor ── */}
            <View style={adNew.card}>
              <Text style={adNew.cardLabel}>Professor responsável</Text>
              {professores.length === 0 ? (
                <View style={adNew.emptyProf}>
                  <Ionicons name="people-outline" size={28} color="#D1D5DB" />
                  <Text style={adNew.emptyProfText}>Nenhum professor cadastrado</Text>
                </View>
              ) : (
                <View style={adNew.profList}>
                  {professores.map((prof, idx) => {
                    const sel = professorSelecionado?.id === prof.id;
                    const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2"];
                    const cor = CORES[idx % CORES.length];
                    const inicial = prof.nome.trim()[0]?.toUpperCase() ?? "P";
                    return (
                      <TouchableOpacity
                        key={prof.id}
                        style={[adNew.profRow, sel && { backgroundColor: "#F0FDF4" }, idx < professores.length - 1 && adNew.profRowBorder]}
                        onPress={() => setProfessorSelecionado(sel ? null : prof)}
                        activeOpacity={0.75}
                      >
                        <View style={[adNew.profAvatar, { backgroundColor: cor + "20" }]}>
                          {prof.foto ? (
                            <Image source={{ uri: prof.foto }} style={{ width: 44, height: 44, borderRadius: 14 }} resizeMode="cover" />
                          ) : (
                            <Text style={[adNew.profInitial, { color: cor }]}>{inicial}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[adNew.profNome, sel && { color: "#3a7d44" }]}>{prof.nome}</Text>
                          {prof.cargo ? <Text style={adNew.profMaterias}>{prof.cargo}</Text> : null}
                        </View>
                        <View style={[adNew.profCheck, sel ? { backgroundColor: "#3a7d44" } : { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]}>
                          {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Excluir ── */}
            <TouchableOpacity onPress={handleExcluir} style={adNew.deleteBtn} activeOpacity={0.8}>
              <View style={adNew.deleteIcon}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </View>
              <Text style={adNew.deleteBtnText}>Excluir este horário</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{ehIntervalo ? "Detalhe do Intervalo" : "Detalhe da Aula"}</Text>
        {ehReadOnly ? (
          <View style={{ width: 40 }} />
        ) : (
          <TouchableOpacity
            style={s.headerRightBtn}
            onPress={() => {
              if (ehIntervalo) {
                router.push({ pathname: "/supervisao/EditarHorario", params: { id: params.id, timeStart: params.timeStart, timeEnd: params.timeEnd, subject: params.subject, turno: params.turno, isInterval: "true", diaSemana: params.diaSemana ?? "" } });
              } else {
                setEditando(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={ad.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        {ehIntervalo ? (
          <View style={ad.intervaloHero}>
            <View style={ad.intervaloIconWrap}>
              <Ionicons name="cafe-outline" size={36} color="#92400e" />
            </View>
            <Text style={ad.intervaloTitle}>Intervalo</Text>
            <Text style={ad.intervaloTime}>{params.timeStart} – {params.timeEnd}</Text>
            <Text style={ad.intervaloDia}>{params.diaSemana || "Todos os dias"}</Text>
          </View>
        ) : (
          <View style={ad.heroWrap}>
            {/* Faixa escura neutra — não conflita com header verde */}
            <View style={ad.heroStripe}>
              <Ionicons name={turnoInfo.ionicon} size={120} color="rgba(255,255,255,0.06)" style={{ position: "absolute", right: -16, top: -16 }} />
              <View style={ad.heroStripeRow}>
                <View style={ad.heroTurnoPill}>
                  <Ionicons name={turnoInfo.ionicon} size={11} color="#fff" />
                  <Text style={ad.heroTurnoText}>{turnoInfo.label}</Text>
                </View>
                {params.diaSemana ? (
                  <View style={ad.heroDiaPill}>
                    <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.75)" />
                    <Text style={ad.heroDiaText}>{params.diaSemana}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={ad.heroSubject} numberOfLines={2}>{params.subject}</Text>
            </View>

            {/* Ticket perfurado */}
            <View style={ad.ticketDivider}>
              <View style={[ad.ticketCircle, { left: -14, backgroundColor: "#F1F5F9" }]} />
              <View style={ad.ticketDashedLine} />
              <View style={[ad.ticketCircle, { right: -14, backgroundColor: "#F1F5F9" }]} />
            </View>

            {/* Parte branca: horários */}
            <View style={ad.ticketBody}>
              <View style={ad.ticketTimeCol}>
                <Text style={ad.ticketTimeLabel}>INÍCIO</Text>
                <Text style={ad.ticketTimeBig}>{params.timeStart}</Text>
              </View>
              <View style={ad.ticketMid}>
                <View style={ad.ticketDot} />
                <View style={ad.ticketLine} />
                <View style={ad.ticketDurBadge}>
                  <Ionicons name="timer-outline" size={11} color="#3a7d44" />
                  <Text style={ad.ticketDurText}>{calcDuration(params.timeStart, params.timeEnd)}</Text>
                </View>
                <View style={ad.ticketLine} />
                <View style={ad.ticketDot} />
              </View>
              <View style={[ad.ticketTimeCol, { alignItems: "flex-end" }]}>
                <Text style={ad.ticketTimeLabel}>FIM</Text>
                <Text style={ad.ticketTimeBig}>{params.timeEnd}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── PROFESSOR ────────────────────────────────────────── */}
        {!ehIntervalo && (
          <View style={ad.profCard}>
            {/* Avatar grande */}
            <View style={ad.profAvatarWrap}>
              {profFoto ? (
                <Image source={{ uri: profFoto }} style={ad.profAvatar} resizeMode="cover" />
              ) : params.teacher ? (
                <View style={[ad.profInitial, { backgroundColor: "#3a7d44" }]}>
                  <Text style={ad.profInitialText}>{params.teacher.trim()[0]?.toUpperCase()}</Text>
                </View>
              ) : (
                <View style={[ad.profInitial, { backgroundColor: "#F3F4F6" }]}>
                  <Ionicons name="person-outline" size={28} color="#9CA3AF" />
                </View>
              )}
              {params.teacher && <View style={[ad.profDot, { backgroundColor: "#22C55E" }]} />}
            </View>

            {/* Info */}
            <View style={ad.profInfo}>
              <Text style={ad.profRole}>Professor(a)</Text>
              <Text style={[ad.profName, !params.teacher && { color: "#9CA3AF", fontStyle: "italic" }]}>
                {params.teacher || "Não atribuído"}
              </Text>
              {params.teacher && (
                <View style={ad.profChip}>
                  <Text style={ad.profChipText}>Responsável pela aula</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── SALA ─────────────────────────────────────────────── */}
        {!ehIntervalo && params.salaNome && (
          <View style={ad.metaCard}>
            <View style={ad.metaRow}>
              <View style={[ad.metaIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="business-outline" size={18} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ad.metaLabel}>Sala</Text>
                <Text style={ad.metaValue}>{params.salaNome}{params.salaTurma ? ` · ${params.salaTurma}` : ""}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── EXCLUIR ──────────────────────────────────────────── */}
        {!ehIntervalo && !ehReadOnly && (
          <TouchableOpacity onPress={handleExcluir} style={ad.deleteBtn} activeOpacity={0.8}>
            <View style={ad.deleteIconWrap}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </View>
            <Text style={ad.deleteBtnText}>Excluir este horário</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal informação */}
      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={adModal.overlay}>
          <View style={adModal.box}>
            <View style={[adModal.iconWrap, { backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : modalInfo.tipo === "sucesso" ? "#e8f5ea" : "#FEF3C7" }]}>
              <Ionicons name={modalInfo.tipo === "erro" ? "alert-circle" : modalInfo.tipo === "sucesso" ? "checkmark-circle" : "information-circle"} size={32} color={modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f59e0b"} />
            </View>
            <Text style={adModal.titulo}>{modalInfo.titulo}</Text>
            <Text style={adModal.mensagem}>{modalInfo.mensagem}</Text>
            <TouchableOpacity style={[adModal.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : "#3a7d44" }]} onPress={() => setModalInfo(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={adModal.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmação exclusão */}
      <Modal visible={modalConfirmar} transparent animationType="fade" onRequestClose={() => setModalConfirmar(false)}>
        <View style={adModal.overlay}>
          <View style={adModal.box}>
            <View style={[adModal.iconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={adModal.titulo}>Excluir horário</Text>
            <Text style={adModal.mensagem}>Tem certeza? Esta ação não pode ser desfeita.</Text>
            <View style={adModal.botoesRow}>
              <TouchableOpacity style={adModal.btnCancelar} onPress={() => setModalConfirmar(false)} activeOpacity={0.8}>
                <Text style={adModal.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adModal.btn, { backgroundColor: "#ef4444", flex: 1 }]} onPress={confirmarExclusao} activeOpacity={0.85}>
                <Text style={adModal.btnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ad = StyleSheet.create({
  scroll: { paddingBottom: 56, paddingTop: 16, gap: 16 },

  // ── Intervalo ─────────────────────────────────────────────
  intervaloHero: {
    backgroundColor: "#FFF8F0", marginHorizontal: 16, borderRadius: 24, padding: 32,
    alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: "#FDE68A",
    shadowColor: "#F59E0B", shadowOpacity: 0.15, shadowRadius: 14, elevation: 4,
  },
  intervaloIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center",
    marginBottom: 6, borderWidth: 2, borderColor: "#FDE68A",
  },
  intervaloTitle: { fontSize: 26, fontWeight: "800", color: "#92400e" },
  intervaloTime: { fontSize: 18, fontWeight: "700", color: "#B45309" },
  intervaloDia: { fontSize: 13, color: "#D97706", fontWeight: "600" },

  // ── Hero ticket ───────────────────────────────────────────
  heroWrap: {
    marginHorizontal: 16, borderRadius: 24, overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 18, elevation: 8,
  },
  heroStripe: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24, overflow: "hidden", gap: 14, backgroundColor: "#1C2B3A" },
  heroStripeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroTurnoPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#3a7d44", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  heroTurnoText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  heroDiaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.14)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  heroDiaText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
  heroSubject: { fontSize: 28, fontWeight: "800", color: "#fff", lineHeight: 34, letterSpacing: -0.5 },

  // Perfuração ticket
  ticketDivider: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 0, height: 24, overflow: "visible",
  },
  ticketCircle: {
    position: "absolute", width: 26, height: 26, borderRadius: 13,
    zIndex: 2,
  },
  ticketDashedLine: {
    flex: 1, height: 1.5, marginHorizontal: 14,
    borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed",
  },

  // Corpo branco
  ticketBody: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 22, paddingVertical: 20, gap: 0,
  },
  ticketTimeCol: { alignItems: "flex-start", minWidth: 68 },
  ticketTimeLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4, color: "#6B7280" },
  ticketTimeBig: { fontSize: 26, fontWeight: "800", lineHeight: 30, color: "#111827" },
  ticketMid: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 },
  ticketLine: { flex: 1, height: 1.5, borderRadius: 1, backgroundColor: "#E5E7EB" },
  ticketDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D1D5DB" },
  ticketDurBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#BBF7D0",
    paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#F0FDF4",
  },
  ticketDurText: { fontSize: 11, fontWeight: "700", color: "#3a7d44" },

  // ── Professor ─────────────────────────────────────────────
  profCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 22,
    padding: 20,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14, elevation: 5,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  profAvatarWrap: { position: "relative" },
  profAvatar: { width: 66, height: 66, borderRadius: 22 },
  profInitial: {
    width: 66, height: 66, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  profInitialText: { fontSize: 26, fontWeight: "800", color: "#fff" },
  profDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 15, height: 15, borderRadius: 8, borderWidth: 2.5, borderColor: "#fff",
  },
  profInfo: { flex: 1, gap: 5 },
  profRole: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.7 },
  profName: { fontSize: 18, fontWeight: "800", color: "#111827", lineHeight: 22 },
  profChip: {
    alignSelf: "flex-start", borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 3, marginTop: 2,
    backgroundColor: "#F0FDF4",
  },
  profChipText: { fontSize: 11, fontWeight: "600", color: "#3a7d44" },

  // ── Meta (sala) ───────────────────────────────────────────
  metaCard: {
    backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  metaRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16,
  },
  metaIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  metaLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: "700", color: "#111827" },

  // ── Delete ────────────────────────────────────────────────
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16,
    backgroundColor: "#FEF2F2", borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  deleteIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});

const adHero = StyleSheet.create({
  // Hero banner
  heroBg: {
    width: 120, paddingVertical: 28, paddingHorizontal: 14,
    alignItems: "center", justifyContent: "center", gap: 14, overflow: "hidden",
  },
  heroTimeBox: { alignItems: "center", gap: 6 },
  heroTimeStart: { fontSize: 26, fontWeight: "800", color: "#fff", lineHeight: 30 },
  heroTimeSep: { width: 24, height: 2, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 1 },
  heroTimeEnd: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  heroTurnoPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  heroTurnoText: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
  heroContent: { flex: 1, paddingVertical: 22, paddingRight: 18, paddingLeft: 14, justifyContent: "center", gap: 10 },
  heroLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8 },
  heroSubject: { fontSize: 20, fontWeight: "800", color: "#111827", lineHeight: 27, marginTop: 2 },
  heroDiaPill: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#E5E7EB", marginTop: 2,
  },
  heroDiaText: { fontSize: 12, fontWeight: "700" },

  smallIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  durationBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  durationIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  durationLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600", flex: 1 },
  durationValue: { fontSize: 14, fontWeight: "800", color: "#111827" },
  profInitial: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: "#3a7d44",
    alignItems: "center", justifyContent: "center",
  },
  profInitialText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  profStatusDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E",
    borderWidth: 2, borderColor: "#fff",
  },
});

const adNew = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  timeChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#F0FDF4", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  timeChipLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeChipText: { fontSize: 16, fontWeight: "800", color: "#166534" },
  timeChipLock: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#E5E7EB" },
  timeChipLockText: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.7 },
  materiaInput: {
    fontSize: 22, fontWeight: "700", color: "#111827",
    borderBottomWidth: 2, borderBottomColor: "#F1F5F9", paddingBottom: 10, padding: 0,
  },
  profList: { gap: 0 },
  profRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 2 },
  profRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  profAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profInitial: { fontSize: 18, fontWeight: "800" },
  profNome: { fontSize: 14, fontWeight: "700", color: "#111827" },
  profMaterias: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  profCheck: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  emptyProf: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyProfText: { fontSize: 13, color: "#9CA3AF" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FEF2F2", borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: "#FECACA" },
  deleteIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});

const adEd = StyleSheet.create({
  horarioBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
  },
  horarioIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  horarioLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  horarioValue: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", marginTop: 2 },
});

const adInt = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    marginBottom: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#92400e" },
  sub: { fontSize: 13, color: "#b45309", marginTop: 4, fontWeight: "500" },
});

const adModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  titulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  mensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21, marginBottom: 4 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  botoesRow: { flexDirection: "row", gap: 10, width: "100%" },
  btnCancelar: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  cancelarText: { fontSize: 15, fontWeight: "600", color: "#555" },
});
