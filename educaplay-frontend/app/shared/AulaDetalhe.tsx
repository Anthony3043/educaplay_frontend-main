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
    subject: string; teacher: string; turno: string;
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
      const rp = await api.get("/professores");
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
          <ScrollView contentContainerStyle={es.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Banner de horário (somente leitura) */}
            <View style={adEd.horarioBanner}>
              <View style={adEd.horarioIconBox}>
                <Ionicons name="time-outline" size={22} color="#3a7d44" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={adEd.horarioLabel}>Horário (não editável)</Text>
                <Text style={adEd.horarioValue}>{params.timeStart} – {params.timeEnd}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={16} color="#aaa" />
            </View>

            <View style={es.section}>
              <Text style={es.sectionTitle}>Matéria</Text>
              <TextInput style={es.inputCard} value={subject} onChangeText={setSubject} placeholder="Ex: Matemática" placeholderTextColor="#AAAAAA" />
            </View>

            <View style={es.section}>
              <Text style={es.sectionTitle}>Professor</Text>
              {professores.map((prof, idx) => {
                const sel = professorSelecionado?.id === prof.id;
                const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2"];
                const cor = CORES[idx % CORES.length];
                const inicial = prof.nome.trim()[0]?.toUpperCase() ?? "P";
                return (
                  <TouchableOpacity
                    key={prof.id}
                    style={[es.professorCard, sel && es.professorCardSelected]}
                    onPress={() => setProfessorSelecionado(sel ? null : prof)}
                    activeOpacity={0.75}
                  >
                    <View style={[es.professorAvatar, { backgroundColor: cor + "20" }]}>
                      {prof.foto ? (
                        <Image source={{ uri: prof.foto }} style={{ width: 44, height: 44, borderRadius: 14 }} resizeMode="cover" />
                      ) : (
                        <Text style={[es.professorAvatarText, { color: cor, fontSize: 18, fontWeight: "800" }]}>{inicial}</Text>
                      )}
                    </View>
                    <View style={es.professorInfo}>
                      <Text style={es.professorNome}>{prof.nome}</Text>
                      {prof.cargo ? <Text style={es.professorMaterias}>{prof.cargo}</Text> : null}
                    </View>
                    {sel && (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={handleExcluir} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 0, padding: 15, backgroundColor: "#FEF2F2", borderRadius: 16, borderWidth: 1.5, borderColor: "#FECACA" }} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={17} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 15 }}>Excluir este horário</Text>
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
                router.push({
                  pathname: "/supervisao/EditarHorario",
                  params: {
                    id: params.id,
                    timeStart: params.timeStart,
                    timeEnd: params.timeEnd,
                    subject: params.subject,
                    turno: params.turno,
                    isInterval: "true",
                    diaSemana: params.diaSemana ?? "",
                  },
                });
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

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {ehIntervalo ? (
          <View style={adInt.banner}>
            <View style={adInt.iconBox}>
              <Ionicons name="cafe-outline" size={32} color="#92400e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={adInt.title}>Intervalo</Text>
              <Text style={adInt.sub}>
                {params.timeStart} – {params.timeEnd}
                {params.diaSemana ? `  ·  ${params.diaSemana}` : "  ·  Todos os dias"}
              </Text>
            </View>
          </View>
        ) : (
          /* Banner hero da matéria */
          <View style={[adHero.banner]}>
            <View style={[adHero.accent, { backgroundColor: turnoInfo.color }]} />
            <View style={[adHero.iconWrap, { backgroundColor: turnoInfo.color + "18" }]}>
              <Ionicons name="book-outline" size={28} color={turnoInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={adHero.label}>Matéria</Text>
              <Text style={adHero.subject} numberOfLines={2}>{params.subject}</Text>
            </View>
          </View>
        )}

        {/* Grid de info */}
        <View style={s.infoGrid}>
          <View style={s.infoCard}>
            <View style={[adHero.smallIcon, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="time-outline" size={18} color="#3a7d44" />
            </View>
            <Text style={s.infoCardLabel}>Horário</Text>
            <Text style={s.infoCardValue}>{params.timeStart}</Text>
            <Text style={s.infoCardSub}>até {params.timeEnd}</Text>
          </View>
          <View style={s.infoCard}>
            <View style={[adHero.smallIcon, { backgroundColor: turnoInfo.color + "18" }]}>
              <Ionicons name={turnoInfo.ionicon} size={18} color={turnoInfo.color} />
            </View>
            <Text style={s.infoCardLabel}>Turno</Text>
            <Text style={[s.infoCardValue, { color: turnoInfo.color, fontSize: 15 }]}>{turnoInfo.label}</Text>
          </View>
          {params.diaSemana ? (
            <View style={[s.infoCard, { flex: 2 }]}>
              <View style={[adHero.smallIcon, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="calendar-outline" size={18} color="#3a7d44" />
              </View>
              <Text style={s.infoCardLabel}>Dia</Text>
              <Text style={[s.infoCardValue, { color: "#3a7d44", fontSize: 15 }]}>{params.diaSemana}</Text>
            </View>
          ) : null}
        </View>

        {/* Duração */}
        <View style={adHero.durationBar}>
          <View style={adHero.durationIcon}>
            <Ionicons name="timer-outline" size={16} color="#3a7d44" />
          </View>
          <Text style={adHero.durationLabel}>Duração</Text>
          <Text style={adHero.durationValue}>{calcDuration(params.timeStart, params.timeEnd)}</Text>
        </View>

        {/* Sala */}
        {!ehIntervalo && params.salaNome ? (
          <View style={s.teacherCard}>
            <View style={[s.teacherAvatar, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
            </View>
            <View style={s.teacherInfo}>
              <Text style={s.teacherLabel}>Sala</Text>
              <Text style={s.teacherName}>
                {params.salaNome}{params.salaTurma ? ` — ${params.salaTurma}` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Professor */}
        {!ehIntervalo && (
          <View style={s.teacherCard}>
            <View style={s.teacherAvatar}>
              {params.teacher ? (
                <View style={adHero.profInitial}>
                  <Text style={adHero.profInitialText}>{params.teacher.trim()[0]?.toUpperCase() ?? "P"}</Text>
                </View>
              ) : (
                <Ionicons name="person-outline" size={24} color="#3a7d44" />
              )}
            </View>
            <View style={s.teacherInfo}>
              <Text style={s.teacherLabel}>Professor(a)</Text>
              <Text style={[s.teacherName, !params.teacher && { color: "#9CA3AF", fontStyle: "italic" }]}>
                {params.teacher || "Não atribuído"}
              </Text>
            </View>
            {params.teacher && (
              <View style={adHero.profStatusDot} />
            )}
          </View>
        )}

        {/* Excluir */}
        {!ehIntervalo && !ehReadOnly && (
          <TouchableOpacity onPress={handleExcluir} style={s.deleteBtn} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={17} color="#ef4444" />
            <Text style={s.deleteBtnText}>Excluir este horário</Text>
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

const adHero = StyleSheet.create({
  banner: {
    backgroundColor: "#fff", borderRadius: 20, overflow: "hidden",
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 18, paddingRight: 18, paddingLeft: 0,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  accent: { width: 5, alignSelf: "stretch" },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    marginLeft: 14,
  },
  label: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  subject: { fontSize: 20, fontWeight: "800", color: "#111827", lineHeight: 26 },
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
