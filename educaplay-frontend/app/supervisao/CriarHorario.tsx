import { styles as s } from "@/styles/EditarHorarioStyles";
import { Colors } from "@/src/constants/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type Professor = { id: string; nome: string; cargo?: string | null; foto?: string | null; materias?: string[] };
type ProfIndisponivel = { professor: Professor; motivo: string; tipo: "em_aula" | "bloqueado" };

const TURNO_LABELS: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
};
const TURNO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  matutino:   "sunny-outline",
  vespertino: "partly-sunny-outline",
};

const normalizar = (str: string) =>
  str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// HH:MM string comparison (lexicographic = chronological for this format)
const timeOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && aEnd > bStart;

export default function CriarHorarioScreen() {
  const router = useRouter();
  const { cronogramaId, turno, salaIdPre, timeStart, timeEnd, diaSemana } =
    useLocalSearchParams<{
      cronogramaId: string;
      turno: string;
      salaIdPre?: string;
      timeStart: string;
      timeEnd: string;
      diaSemana: string;
    }>();

  const voltar = () => {
    try { router.back(); } catch { router.replace("/supervisao/cronogramas" as any); }
  };

  const [sucesso, setSucesso]                                     = useState(false);
  const [conflictMsg, setConflictMsg]                             = useState<string | null>(null);
  const [materia, setMateria]                                     = useState("");
  const [professorSelecionado, setProfessorSelecionado]           = useState<Professor | null>(null);
  const [professoresDisponiveis, setProfessoresDisponiveis]       = useState<Professor[]>([]);
  const [professoresIndisponiveis, setProfessoresIndisponiveis]   = useState<ProfIndisponivel[]>([]);
  const [carregando, setCarregando]                               = useState(true);
  const [salvando, setSalvando]                                   = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const [resProfessores, resCronogramas] = await Promise.all([
        api.get("/professores"),
        api.get("/cronogramas"),
      ]);

      const todosProfessores: Professor[] = resProfessores.data;

      // ── 1. Conflitos de agenda: professor já tem aula neste dia+horário ────
      const emAula = new Map<string, string>(); // id → motivo
      (resCronogramas.data as any[]).forEach(c => {
        (c.aulas ?? []).forEach((a: any) => {
          if (
            a.professor?.id &&
            !a.isInterval &&
            a.diaSemana === diaSemana &&
            timeOverlap(a.timeStart, a.timeEnd, timeStart, timeEnd)
          ) {
            emAula.set(a.professor.id, `Já tem aula às ${a.timeStart}`);
          }
        });
      });

      // ── 2. BloqueioHorario: professor indisponível neste dia+horário ───────
      const bloqueiosResultados = await Promise.allSettled(
        todosProfessores.map(p => api.get(`/bloqueios/professor/${p.id}`))
      );

      const bloqueado = new Map<string, string>(); // id → motivo
      todosProfessores.forEach((p, idx) => {
        if (emAula.has(p.id)) return; // já marcado pelo conflito de agenda
        const r = bloqueiosResultados[idx];
        if (r.status !== "fulfilled") return;
        const conflito = (r.value.data as any[]).find(b =>
          b.diaSemana === diaSemana &&
          timeOverlap(b.timeStart, b.timeEnd, timeStart, timeEnd)
        );
        if (conflito) {
          bloqueado.set(p.id, conflito.descricao?.trim() || "Indisponível neste horário");
        }
      });

      // ── 3. Separar disponíveis × indisponíveis ─────────────────────────────
      const disponiveis: Professor[] = [];
      const indisponiveis: ProfIndisponivel[] = [];

      todosProfessores.forEach(p => {
        if (emAula.has(p.id)) {
          indisponiveis.push({ professor: p, motivo: emAula.get(p.id)!, tipo: "em_aula" });
        } else if (bloqueado.has(p.id)) {
          indisponiveis.push({ professor: p, motivo: bloqueado.get(p.id)!, tipo: "bloqueado" });
        } else {
          disponiveis.push(p);
        }
      });

      setProfessoresDisponiveis(disponiveis);
      setProfessoresIndisponiveis(indisponiveis);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os professores.");
    } finally {
      setCarregando(false);
    }
  }, [diaSemana, timeStart, timeEnd]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvar = async () => {
    const erros: string[] = [];
    if (!materia.trim())       erros.push("• Você não preencheu a matéria");
    if (!professorSelecionado) erros.push("• Você não escolheu o professor");
    if (erros.length > 0) {
      Alert.alert("Campos obrigatórios", erros.join("\n"));
      return;
    }

    setSalvando(true);
    try {
      await api.post("/aulas", {
        cronogramaId,
        timeStart,
        timeEnd,
        subject: materia.trim(),
        professorId: professorSelecionado?.id ?? null,
        salaId: salaIdPre || null,
        isInterval: false,
        diaSemana: diaSemana || null,
      });
      setSucesso(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.error;
      if (status === 409) {
        setConflictMsg(backendMsg || "Já existe um horário cadastrado neste horário e dia.");
      } else {
        Alert.alert("Erro", backendMsg || "Não foi possível criar o horário.");
      }
    } finally {
      setSalvando(false);
    }
  };

  // ── helpers de filtro ──────────────────────────────────────────────────────
  const filtrarPorMateria = (lista: Professor[]) => {
    const filtro = normalizar(materia.trim());
    if (filtro.length < 2) return lista;
    return lista.filter(p => {
      const ms = p.materias ?? [];
      return ms.length > 0 && ms.some(m => normalizar(m).includes(filtro));
    });
  };

  const listaDisponiveis = filtrarPorMateria(professoresDisponiveis);
  const listaIndisponiveis = professoresIndisponiveis.filter(pi =>
    filtrarPorMateria([pi.professor]).length > 0
  );

  const renderProfCard = (prof: Professor, indispInfo?: ProfIndisponivel) => {
    const selected   = professorSelecionado?.id === prof.id;
    const bloqueado  = !!indispInfo;
    const profMaterias = prof.materias ?? [];

    return (
      <TouchableOpacity
        key={prof.id}
        style={[
          s.professorCard,
          selected && s.professorCardSelected,
          bloqueado && ch.cardBloqueado,
        ]}
        onPress={bloqueado ? undefined : () => {
          const novo = selected ? null : prof;
          setProfessorSelecionado(novo);
          if (novo && profMaterias.length > 0 && !materia.trim()) setMateria(profMaterias[0]);
        }}
        activeOpacity={bloqueado ? 1 : 0.75}
      >
        <View style={[s.professorAvatar, bloqueado && { opacity: 0.4 }]}>
          {prof.foto ? (
            <Image source={{ uri: prof.foto }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
          ) : (
            <Ionicons name="person-outline" size={24} color={bloqueado ? "#ccc" : "#888"} />
          )}
        </View>
        <View style={[s.professorInfo, { flex: 1 }]}>
          <Text style={[s.professorNome, bloqueado && { color: "#aaa" }]}>{prof.nome}</Text>
          {profMaterias.length > 0 ? (
            <Text style={[s.professorMaterias, bloqueado && { color: "#ccc" }]}>{profMaterias.join(" · ")}</Text>
          ) : null}
          {indispInfo && (
            <View style={ch.motivoRow}>
              <Ionicons
                name={indispInfo.tipo === "em_aula" ? "book-outline" : "ban-outline"}
                size={11}
                color={indispInfo.tipo === "em_aula" ? "#F59E0B" : "#ef4444"}
              />
              <Text style={[ch.motivoText, indispInfo.tipo === "bloqueado" && { color: "#ef4444" }]}>
                {indispInfo.motivo}
              </Text>
            </View>
          )}
        </View>
        {selected && <Text style={s.professorCheckmark}>✓</Text>}
        {bloqueado && (
          <Ionicons
            name={indispInfo.tipo === "em_aula" ? "time-outline" : "lock-closed-outline"}
            size={16}
            color={indispInfo.tipo === "em_aula" ? "#F59E0B" : "#ef4444"}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={voltar}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Criar Horário</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSalvar} disabled={salvando}>
          {salvando
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="checkmark" size={22} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {carregando ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Banner informativo: turno · dia · horário */}
            <View style={ch.infoBanner}>
              <View style={ch.infoRow}>
                <Ionicons name={TURNO_ICONS[turno] ?? "calendar-outline"} size={20} color="#3a7d44" />
                <Text style={ch.infoTurno}>{TURNO_LABELS[turno] ?? turno}</Text>
              </View>
              <View style={ch.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#555" />
                <Text style={ch.infoLabel}>{diaSemana}</Text>
              </View>
              <View style={ch.infoRow}>
                <Ionicons name="time-outline" size={16} color="#555" />
                <Text style={ch.infoLabel}>{timeStart} – {timeEnd}</Text>
              </View>
            </View>

            {/* Matéria */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>
                Matéria <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <TextInput
                style={s.inputCard}
                value={materia}
                onChangeText={(t) => {
                  setMateria(t);
                  if (professorSelecionado) {
                    const filtro = normalizar(t);
                    const pm = professorSelecionado.materias ?? [];
                    const bate = pm.some(m => normalizar(m).includes(filtro));
                    if (filtro.length >= 2 && pm.length > 0 && !bate) setProfessorSelecionado(null);
                  }
                }}
                placeholder="Digite para filtrar professores..."
                placeholderTextColor="#AAAAAA"
              />
              {materia.trim().length >= 2 && (
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                  Mostrando professores que lecionam "{materia.trim()}"
                </Text>
              )}
            </View>

            {/* Professor — disponíveis */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>
                Professor <Text style={{ color: Colors.error }}>*</Text>
              </Text>

              {professoresDisponiveis.length === 0 && professoresIndisponiveis.length === 0 ? (
                <View style={s.emptyProfessores}>
                  <Ionicons name="person-outline" size={32} color="#ccc" />
                  <Text style={s.emptyProfessoresText}>Nenhum professor cadastrado.</Text>
                </View>
              ) : (
                <>
                  {/* Disponíveis */}
                  {listaDisponiveis.length === 0 && materia.trim().length >= 2 ? (
                    <View style={s.emptyProfessores}>
                      <Ionicons name="search-outline" size={28} color="#ccc" />
                      <Text style={s.emptyProfessoresText}>
                        Nenhum professor disponível leciona "{materia.trim()}".
                      </Text>
                    </View>
                  ) : listaDisponiveis.length === 0 ? (
                    <View style={ch.semDisponiveisBanner}>
                      <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                      <Text style={ch.semDisponiveisText}>
                        Todos os professores estão indisponíveis neste horário.
                      </Text>
                    </View>
                  ) : (
                    listaDisponiveis.map(prof => renderProfCard(prof))
                  )}

                  {/* Indisponíveis */}
                  {listaIndisponiveis.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                      <View style={ch.sectionDivider}>
                        <Ionicons name="ban-outline" size={12} color="#aaa" />
                        <Text style={ch.sectionDividerText}>
                          Indisponíveis neste horário ({listaIndisponiveis.length})
                        </Text>
                      </View>
                      {listaIndisponiveis.map(pi => renderProfCard(pi.professor, pi))}
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal de sucesso */}
      <Modal visible={sucesso} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Ionicons name="checkmark-circle" size={56} color="#3a7d44" />
            <Text style={ms.title}>Horário criado!</Text>
            <Text style={ms.msg}>O horário foi salvo com sucesso no cronograma.</Text>
            <TouchableOpacity style={ms.btn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={ms.btnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de conflito */}
      <Modal visible={!!conflictMsg} transparent animationType="fade" onRequestClose={() => setConflictMsg(null)}>
        <View style={cf.overlay}>
          <View style={cf.card}>
            <View style={cf.iconBox}>
              <Ionicons name="warning" size={32} color="#DC2626" />
            </View>
            <Text style={cf.title}>Conflito de Horário</Text>
            <Text style={cf.desc}>{conflictMsg}</Text>
            <View style={cf.divider} />
            <View style={cf.dica}>
              <Ionicons name="bulb-outline" size={16} color="#92400e" />
              <Text style={cf.dicaText}>
                Verifique se já existe uma aula neste horário e dia para este turno, ou escolha outro horário.
              </Text>
            </View>
            <TouchableOpacity style={cf.btn} onPress={() => setConflictMsg(null)} activeOpacity={0.85}>
              <Text style={cf.btnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ch = StyleSheet.create({
  infoBanner: {
    marginHorizontal: 20, marginBottom: 4, marginTop: 4,
    backgroundColor: "#E8F5EA", borderRadius: 14, padding: 16, gap: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTurno: { fontSize: 15, fontWeight: "800", color: "#2d6a4f" },
  infoLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },

  cardBloqueado: {
    backgroundColor: "#FAFAFA",
    borderColor: "#F0F0F0",
    opacity: 0.85,
  },
  motivoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  motivoText: { fontSize: 11, color: "#F59E0B", fontWeight: "600" },

  sectionDivider: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 10, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  sectionDividerText: { fontSize: 11, fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },

  semDisponiveisBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFBEB", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  semDisponiveisText: { fontSize: 13, color: "#92400e", flex: 1, fontWeight: "500" },
});

const cf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "#fff", borderRadius: 22, padding: 24, width: "100%", alignItems: "center",
    elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    borderWidth: 1.5, borderColor: "#FEE2E2",
  },
  iconBox: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "#FECACA" },
  title: { fontSize: 20, fontWeight: "800", color: "#DC2626", marginBottom: 8, textAlign: "center" },
  desc: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 16 },
  divider: { width: "100%", height: 1, backgroundColor: "#FEE2E2", marginBottom: 14 },
  dica: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFF8F0", borderRadius: 12, padding: 12, width: "100%", borderWidth: 1, borderColor: "#FED7AA", marginBottom: 20 },
  dicaText: { fontSize: 12, color: "#92400e", flex: 1, lineHeight: 18 },
  btn: { width: "100%", paddingVertical: 14, borderRadius: 14, backgroundColor: "#DC2626", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  box: { backgroundColor: Colors.surface, borderRadius: 20, padding: 28, width: "80%", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginTop: 4 },
  msg: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  btn: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 36 },
  btnText: { color: Colors.textOnPrimary, fontWeight: "700", fontSize: 15 },
});
