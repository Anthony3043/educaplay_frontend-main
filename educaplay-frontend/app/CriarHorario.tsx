import { styles as s } from "@/styles/EditarHorarioStyles";
import { Colors } from "@/src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { storageKeyHorarios } from "./HorarioAulas";
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
import api from "../src/services/api";

type TipoSlot = "aula" | "intervalo";
type Professor = { id: string; nome: string; cargo?: string | null; foto?: string | null; materias?: string[] };
type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };

const salaLabel = (sala: Sala) => sala.turma ? `${sala.nome} — ${sala.turma}` : sala.nome;

const TURNO_LABELS: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
};

const TURNO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  matutino:   "sunny-outline",
  vespertino: "partly-sunny-outline",
  noturno:    "moon-outline",
  integral:   "book-outline",
};

const TURNO_LIMITES: Record<string, { inicio: string; fim: string; label: string }> = {
  matutino:   { inicio: "07:00", fim: "12:35", label: "Matutino (07:00 – 12:35)" },
  vespertino: { inicio: "13:00", fim: "18:00", label: "Vespertino (13:00 – 18:00)" },
  noturno:    { inicio: "18:30", fim: "23:00", label: "Noturno (18:30 – 23:00)" },
  integral:   { inicio: "07:00", fim: "18:00", label: "Integral (07:00 – 18:00)" },
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Remove acentos e normaliza para comparação sem necessidade de acento exato
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatarHorario(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  // Se o primeiro dígito for ≥ 3 (impossível como dezena de hora), adiciona "0" na frente
  // Ex: "7" → "07", "730" → "07:30"
  let normalized = digitos;
  if (normalized.length >= 1 && parseInt(normalized[0], 10) >= 3) {
    normalized = "0" + normalized;
  }
  normalized = normalized.slice(0, 4);
  if (normalized.length <= 2) return normalized;
  return `${normalized.slice(0, 2)}:${normalized.slice(2)}`;
}

function validarHorarioTempoReal(value: string, campo: "inicio" | "fim", turno: string): string | null {
  if (value.length < 5) return null;
  const limite = TURNO_LIMITES[turno];
  if (!limite) return null;
  const mins = toMinutes(value);
  if (campo === "inicio") {
    if (mins < toMinutes(limite.inicio) || mins >= toMinutes(limite.fim)) {
      return `Início fora do turno. Permitido: ${limite.inicio} – ${limite.fim}`;
    }
  } else {
    if (mins > toMinutes(limite.fim) || mins <= toMinutes(limite.inicio)) {
      return `Término fora do turno. Permitido: ${limite.inicio} – ${limite.fim}`;
    }
  }
  return null;
}

function validarHorario(start: string, end: string, turno: string): string | null {
  const formato = /^\d{2}:\d{2}$/;
  if (!formato.test(start) || !formato.test(end)) {
    return "Use o formato HH:MM (ex: 07:00, 13:30).";
  }
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s < toMinutes("07:00")) {
    return "Não existem aulas antes das 07:00. O horário mínimo permitido é 07:00.";
  }
  if (e <= s) {
    return "O horário de término deve ser após o horário de início.";
  }
  const limite = TURNO_LIMITES[turno];
  if (!limite) return null;
  if (s < toMinutes(limite.inicio) || s >= toMinutes(limite.fim)) {
    return `Horário de início fora do turno ${limite.label}.`;
  }
  if (e > toMinutes(limite.fim)) {
    return `Horário de término fora do turno ${limite.label}.`;
  }
  return null;
}

export default function CriarHorarioScreen() {
  const router = useRouter();
  const { cronogramaId, turno } = useLocalSearchParams<{
    cronogramaId: string;
    turno: string;
  }>();

  const voltar = () => {
    try {
      router.back();
    } catch {
      router.replace("/cronogramas" as any);
    }
  };

  const [tipoSlot, setTipoSlot] = useState<TipoSlot>("aula");
  const [sucesso, setSucesso] = useState(false);
  const [materia, setMateria] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const [resProfessores, resSalas] = await Promise.all([
        api.get("/professores"),
        api.get("/salas"),
      ]);
      setProfessores(resProfessores.data);
      setSalas(resSalas.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Carrega slots configurados para o turno
  useEffect(() => {
    AsyncStorage.getItem(storageKeyHorarios(turno))
      .then((val) => setSlots(val ? JSON.parse(val) : []))
      .catch(() => setSlots([]));
  }, [turno]);

  const handleSalvar = async () => {
    // Valida todos os campos obrigatórios de uma vez
    const erros: string[] = [];

    if (!diaSemana) erros.push("• Você não selecionou o dia da semana");
    if (!timeStart || !timeEnd) erros.push("• Você não selecionou o horário da aula");

    if (tipoSlot === "aula") {
      if (!materia.trim()) erros.push("• Você não preencheu a matéria");
      if (!salaSelecionada) erros.push("• Você não escolheu a sala");
      if (!professorSelecionado) erros.push("• Você não escolheu o professor");
    }

    if (erros.length > 0) {
      Alert.alert("Campos obrigatórios", erros.join("\n"));
      return;
    }

    const erroHorario = validarHorario(timeStart.trim(), timeEnd.trim(), turno);
    if (erroHorario) {
      Alert.alert("Horário inválido", erroHorario);
      return;
    }

    setSalvando(true);
    try {
      await api.post("/aulas", {
        cronogramaId,
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
        professorId: tipoSlot === "aula" ? (professorSelecionado?.id ?? null) : null,
        salaId: tipoSlot === "aula" ? (salaSelecionada?.id ?? null) : null,
        isInterval: tipoSlot === "intervalo",
        diaSemana: diaSemana || null,
      });
      setSucesso(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.error;
      if (status === 409) {
        Alert.alert("Conflito detectado", backendMsg || "Já existe um conflito neste horário.");
      } else {
        Alert.alert("Erro", backendMsg || "Não foi possível criar o horário.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => voltar()}>
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
          {/* Turno banner */}
          <View style={s.horarioBanner}>
            <Ionicons name={TURNO_ICONS[turno] ?? "calendar-outline"} size={28} color="#3a7d44" />
            <View>
              <Text style={s.horarioBannerTime}>{TURNO_LABELS[turno] ?? turno}</Text>
              <Text style={s.horarioBannerSub}>Novo horário</Text>
            </View>
          </View>

          {/* Tipo */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Tipo do horário</Text>
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, tipoSlot === "aula" && s.toggleBtnActive]}
                onPress={() => setTipoSlot("aula")}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="book-outline" size={16} color={tipoSlot === "aula" ? "#3a7d44" : "#888"} />
                  <Text style={[s.toggleBtnText, tipoSlot === "aula" && s.toggleBtnTextActive]}>Aula</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, tipoSlot === "intervalo" && s.toggleBtnActive]}
                onPress={() => setTipoSlot("intervalo")}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="cafe-outline" size={16} color={tipoSlot === "intervalo" ? "#3a7d44" : "#888"} />
                  <Text style={[s.toggleBtnText, tipoSlot === "intervalo" && s.toggleBtnTextActive]}>Intervalo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dia da semana */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Dia da semana <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={ds.diasRow}>
              {DIAS.map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[ds.chip, diaSemana === dia && ds.chipActive]}
                  onPress={() => setDiaSemana(diaSemana === dia ? null : dia)}
                  activeOpacity={0.7}
                >
                  <Text style={[ds.chipText, diaSemana === dia && ds.chipTextActive]}>
                    {dia.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seletor de horário */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Horário <Text style={{ color: Colors.error }}>*</Text>
            </Text>
            {slots.length === 0 ? (
              <TouchableOpacity
                style={ch.semSlots}
                onPress={() => router.push({ pathname: "/HorarioAulas", params: { turno } })}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={20} color="#888" />
                <Text style={ch.semSlotsText}>Nenhum horário configurado.</Text>
                <Text style={ch.semSlotsLink}>Configurar agora →</Text>
              </TouchableOpacity>
            ) : (
              <View style={ch.slotsGrid}>
                {slots.map((slot, idx) => {
                  const sel = timeStart === slot.start && timeEnd === slot.end;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[ch.slotBtn, sel && ch.slotBtnActive]}
                      onPress={() => { setTimeStart(slot.start); setTimeEnd(slot.end); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[ch.slotBtnTime, sel && ch.slotBtnTimeActive]}>
                        {slot.start}
                      </Text>
                      <Text style={[ch.slotBtnSep, sel && ch.slotBtnTimeActive]}>–</Text>
                      <Text style={[ch.slotBtnTime, sel && ch.slotBtnTimeActive]}>
                        {slot.end}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {tipoSlot === "intervalo" ? (
            <View style={s.intervaloBanner}>
              <Ionicons name="cafe-outline" size={24} color="#92400e" />
              <Text style={s.intervaloBannerText}>
                Este horário será marcado como intervalo. Nenhum professor ou sala será atribuído.
              </Text>
            </View>
          ) : (
            <>
              {/* Matéria */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Matéria <Text style={{ color: Colors.error }}>*</Text></Text>
                <TextInput
                  style={s.inputCard}
                  value={materia}
                  onChangeText={(t) => {
                    setMateria(t);
                    // Se o professor selecionado não leciona mais essa matéria, deseleciona
                    if (professorSelecionado) {
                      const filtro = normalizar(t);
                      const profMaterias = professorSelecionado.materias ?? [];
                      const bate = profMaterias.some((m) => normalizar(m).includes(filtro));
                      if (filtro.length >= 2 && profMaterias.length > 0 && !bate) {
                        setProfessorSelecionado(null);
                      }
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

              {/* Sala */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Sala <Text style={{ color: "#ef4444" }}>*</Text></Text>
                {salas.length === 0 ? (
                  <View style={s.emptyProfessores}>
                    <Ionicons name="business-outline" size={32} color="#ccc" />
                    <Text style={s.emptyProfessoresText}>Nenhuma sala cadastrada.</Text>
                  </View>
                ) : (
                  salas.map((sala) => {
                    const selected = salaSelecionada?.id === sala.id;
                    return (
                      <TouchableOpacity
                        key={sala.id}
                        style={[s.professorCard, selected && s.professorCardSelected]}
                        onPress={() => setSalaSelecionada(selected ? null : sala)}
                        activeOpacity={0.75}
                      >
                        <View style={s.professorAvatar}>
                          <Ionicons name="business-outline" size={24} color="#888" />
                        </View>
                        <View style={s.professorInfo}>
                          <Text style={s.professorNome}>{salaLabel(sala)}</Text>
                          {sala.capacidade ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name="people-outline" size={13} color="#7a7f9a" />
                              <Text style={s.professorMaterias}>{sala.capacidade}</Text>
                            </View>
                          ) : null}
                        </View>
                        {selected && <Text style={s.professorCheckmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Professor */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Professor <Text style={{ color: Colors.error }}>*</Text></Text>
                {professores.length === 0 ? (
                  <View style={s.emptyProfessores}>
                    <Ionicons name="person-outline" size={32} color="#ccc" />
                    <Text style={s.emptyProfessoresText}>Nenhum professor cadastrado.</Text>
                  </View>
                ) : (() => {
                  // Filtra pela matéria digitada sem precisar de acento exato
                  const filtro = normalizar(materia.trim());
                  const lista = filtro.length >= 2
                    ? professores.filter((p) => {
                        const profMaterias = p.materias ?? [];
                        // Com filtro ativo, só mostra quem tem aquela matéria cadastrada
                        if (profMaterias.length === 0) return false;
                        return profMaterias.some((m) => normalizar(m).includes(filtro));
                      })
                    : professores;

                  if (lista.length === 0) {
                    return (
                      <View style={s.emptyProfessores}>
                        <Ionicons name="search-outline" size={28} color="#ccc" />
                        <Text style={s.emptyProfessoresText}>
                          Nenhum professor leciona "{materia.trim()}".
                        </Text>
                      </View>
                    );
                  }

                  return lista.map((prof) => {
                    const selected = professorSelecionado?.id === prof.id;
                    const profMaterias = prof.materias ?? [];
                    return (
                      <TouchableOpacity
                        key={prof.id}
                        style={[s.professorCard, selected && s.professorCardSelected]}
                        onPress={() => {
                          const novoSelected = selected ? null : prof;
                          setProfessorSelecionado(novoSelected);
                          // Auto-preenche a matéria com a primeira matéria do professor (se campo estiver vazio)
                          if (novoSelected && profMaterias.length > 0 && !materia.trim()) {
                            setMateria(profMaterias[0]);
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={s.professorAvatar}>
                          {prof.foto ? (
                            <Image source={{ uri: prof.foto }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                          ) : (
                            <Ionicons name="person-outline" size={24} color="#888" />
                          )}
                        </View>
                        <View style={s.professorInfo}>
                          <Text style={s.professorNome}>{prof.nome}</Text>
                          {profMaterias.length > 0 ? (
                            <Text style={s.professorMaterias}>{profMaterias.join(" · ")}</Text>
                          ) : null}
                        </View>
                        {selected && <Text style={s.professorCheckmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </>
          )}
        </ScrollView>
      )}
      </KeyboardAvoidingView>

      <Modal visible={sucesso} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Ionicons name="checkmark-circle" size={56} color="#3a7d44" />
            <Text style={ms.title}>Horário criado!</Text>
            <Text style={ms.msg}>O horário foi salvo com sucesso no cronograma.</Text>
            <TouchableOpacity style={ms.btn} onPress={() => router.replace("/cronogramas" as any)} activeOpacity={0.85}>
              <Text style={ms.btnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.transparent,
  },
  chipActive: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  chipTextActive: { color: Colors.primary },
});

const ch = StyleSheet.create({
  semSlots: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border ?? "#E5E7EB",
    borderStyle: "dashed",
  },
  semSlotsText: { fontSize: 14, color: "#888", fontWeight: "500" },
  semSlotsLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  slotBtnActive: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  slotBtnTime: { fontSize: 14, fontWeight: "800", color: "#555" },
  slotBtnSep: { fontSize: 12, color: "#aaa" },
  slotBtnTimeActive: { color: Colors.primary },
});

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    width: "80%",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginTop: 4 },
  msg: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  btn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  btnText: { color: Colors.textOnPrimary, fontWeight: "700", fontSize: 15 },
});
