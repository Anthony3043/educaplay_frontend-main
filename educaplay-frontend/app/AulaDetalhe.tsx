import { styles as s } from "@/styles/aulaDetalheStyles";
import { styles as es } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
  }>();

  const ehIntervalo = params.isInterval === "true";

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [professores, setProfessores] = useState<Professor[]>([]);

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
      Alert.alert("Erro", "Não foi possível carregar os professores.");
    } finally {
      setCarregando(false);
    }
  }, [params.professorId]);

  useEffect(() => {
    if (editando) carregarOpcoes();
  }, [editando, carregarOpcoes]);

  const handleSalvar = async () => {
    if (!subject.trim()) {
      Alert.alert("Atenção", "Informe o nome da matéria.");
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
      Alert.alert("Sucesso", "Horário atualizado!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 409) {
        Alert.alert("Conflito de horário", msg || "Conflito detectado.");
      } else {
        Alert.alert("Erro", msg || "Não foi possível salvar.");
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = () => {
    Alert.alert(
      "Excluir horário",
      "Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/aulas/${params.id}`);
              router.back();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir a aula.");
            }
          },
        },
      ]
    );
  };

  if (editando) {
    return (
      <SafeAreaView style={es.container}>
        <StatusBar barStyle="dark-content" />
        <View style={es.header}>
          <TouchableOpacity style={es.backBtn} onPress={() => setEditando(false)}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={es.headerTitle}>Editar Horário</Text>
          <TouchableOpacity style={es.saveBtn} onPress={handleSalvar} disabled={salvando}>
            <Text style={es.saveBtnText}>{salvando ? "⏳" : "✓"}</Text>
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
              <Text style={es.sectionTitle}>Dia da semana <Text style={{ fontWeight: "400", color: "#aaa" }}>(opcional)</Text></Text>
              <View style={adDs.diasRow}>
                {DIAS.map((dia) => (
                  <TouchableOpacity
                    key={dia}
                    style={[adDs.chip, diaSemana === dia && adDs.chipActive]}
                    onPress={() => setDiaSemana(diaSemana === dia ? null : dia)}
                    activeOpacity={0.7}
                  >
                    <Text style={[adDs.chipText, diaSemana === dia && adDs.chipTextActive]}>
                      {dia.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={es.section}>
              <Text style={es.sectionTitle}>Professor</Text>
              {professores.map((prof) => {
                const sel = professorSelecionado?.id === prof.id;
                return (
                  <TouchableOpacity key={prof.id} style={[es.professorCard, sel && es.professorCardSelected]} onPress={() => setProfessorSelecionado(sel ? null : prof)} activeOpacity={0.75}>
                    <View style={es.professorAvatar}>
                      {prof.foto ? (
                        <Image source={{ uri: prof.foto }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                      ) : (
                        <Text style={es.professorAvatarText}>👤</Text>
                      )}
                    </View>
                    <View style={es.professorInfo}>
                      <Text style={es.professorNome}>{prof.nome}</Text>
                      {prof.cargo ? <Text style={es.professorMaterias}>{prof.cargo}</Text> : null}
                    </View>
                    {sel && <Text style={es.professorCheckmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={handleExcluir} style={{ margin: 20, padding: 14, backgroundColor: "#fee2e2", borderRadius: 12, alignItems: "center" }} activeOpacity={0.8}>
              <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 15 }}>🗑️ Excluir este horário</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{ehIntervalo ? "Detalhe do Intervalo" : "Detalhe da Aula"}</Text>
        <TouchableOpacity
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
          onPress={() => {
            if (ehIntervalo) {
              router.push({
                pathname: "/EditarHorario",
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
        >
          <Ionicons name="pencil-outline" size={22} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {ehIntervalo ? (
          /* ── Detalhe de Intervalo ── */
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
          <View style={[s.subjectBanner, { borderLeftColor: turnoInfo.color }]}>
            <Ionicons name="book-outline" size={28} color={turnoInfo.color} />
            <Text style={s.subjectTitle}>{params.subject}</Text>
          </View>
        )}

        <View style={s.infoGrid}>
          <View style={s.infoCard}>
            <Ionicons name="time-outline" size={24} color="#1a1a2e" />
            <Text style={s.infoCardLabel}>Horário</Text>
            <Text style={s.infoCardValue}>{params.timeStart}</Text>
            <Text style={s.infoCardSub}>até {params.timeEnd}</Text>
          </View>
          <View style={s.infoCard}>
            <Ionicons name={turnoInfo.ionicon} size={24} color={turnoInfo.color} />
            <Text style={s.infoCardLabel}>Turno</Text>
            <Text style={s.infoCardValue}>{turnoInfo.label}</Text>
          </View>
          {params.diaSemana ? (
            <View style={[s.infoCard, { flex: 2 }]}>
              <Ionicons name="calendar-outline" size={24} color="#3a7d44" />
              <Text style={s.infoCardLabel}>Dia</Text>
              <Text style={[s.infoCardValue, { color: "#3a7d44" }]}>{params.diaSemana}</Text>
            </View>
          ) : null}
        </View>

        {!ehIntervalo && params.salaNome ? (
          <View style={s.teacherCard}>
            <View style={s.teacherAvatar}><Ionicons name="business-outline" size={28} color="#888" /></View>
            <View style={s.teacherInfo}>
              <Text style={s.teacherLabel}>Sala</Text>
              <Text style={s.teacherName}>
                {params.salaNome}{params.salaTurma ? ` — ${params.salaTurma}` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        {!ehIntervalo && (
          <View style={s.teacherCard}>
            <View style={s.teacherAvatar}><Ionicons name="person-outline" size={28} color="#888" /></View>
            <View style={s.teacherInfo}>
              <Text style={s.teacherLabel}>Professor(a)</Text>
              <Text style={s.teacherName}>{params.teacher || "Não atribuído"}</Text>
            </View>
          </View>
        )}

        <View style={s.durationRow}>
          <Ionicons name="timer-outline" size={18} color="#888" />
          <Text style={s.durationText}>Duração: {calcDuration(params.timeStart, params.timeEnd)}</Text>
        </View>

        {!ehIntervalo && (
          <TouchableOpacity
            onPress={handleExcluir}
            style={{ marginTop: 16, padding: 14, backgroundColor: "#fee2e2", borderRadius: 12, alignItems: "center" }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 15 }}>🗑️ Excluir este horário</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

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
