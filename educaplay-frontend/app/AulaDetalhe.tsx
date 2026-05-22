import { styles as s } from "@/styles/aulaDetalheStyles";
import { styles as es } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../src/services/api";

type Professor = { id: string; nome: string; cargo?: string | null; foto?: string | null };
type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };

const salaLabel = (sala: Sala) => sala.turma ? `${sala.nome} — ${sala.turma}` : sala.nome;

const TURNO_LABELS: Record<string, { label: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; color: string }> = {
  matutino:   { label: "Matutino",   ionicon: "sunny-outline",        color: "#F59E0B" },
  vespertino: { label: "Vespertino", ionicon: "partly-sunny-outline",  color: "#3B82F6" },
  noturno:    { label: "Noturno",    ionicon: "moon-outline",          color: "#6366F1" },
  integral:   { label: "Integral",   ionicon: "book-outline",          color: "#10B981" },
};

const TURNO_LIMITES: Record<string, { inicio: string; fim: string; label: string }> = {
  matutino:   { inicio: "07:00", fim: "12:35", label: "Matutino (07:00 – 12:35)" },
  vespertino: { inicio: "13:00", fim: "18:00", label: "Vespertino (13:00 – 18:00)" },
  noturno:    { inicio: "18:30", fim: "23:00", label: "Noturno (18:30 – 23:00)" },
  integral:   { inicio: "07:00", fim: "18:00", label: "Integral (07:00 – 18:00)" },
};

function formatarHorario(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
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
    professorId: string; salaId: string; salaNome: string; salaTurma: string;
  }>();

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);

  const [timeStart, setTimeStart] = useState(params.timeStart);
  const [timeEnd, setTimeEnd] = useState(params.timeEnd);
  const [subject, setSubject] = useState(params.subject);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);

  const turnoInfo = TURNO_LABELS[params.turno] ?? { label: params.turno, ionicon: "calendar-outline" as const, color: "#6366F1" };

  const carregarOpcoes = useCallback(async () => {
    setCarregando(true);
    try {
      const [rp, rs] = await Promise.all([api.get("/professores"), api.get("/salas")]);
      setProfessores(rp.data);
      setSalas(rs.data);
      if (params.professorId) {
        const p = rp.data.find((x: Professor) => x.id === params.professorId);
        if (p) setProfessorSelecionado(p);
      }
      if (params.salaId) {
        const sl = rs.data.find((x: Sala) => x.id === params.salaId);
        if (sl) setSalaSelecionada(sl);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar professores/salas.");
    } finally {
      setCarregando(false);
    }
  }, [params.professorId, params.salaId]);

  useEffect(() => {
    if (editando) carregarOpcoes();
  }, [editando, carregarOpcoes]);

  const handleSalvar = async () => {
    if (!timeStart.trim() || !timeEnd.trim() || !subject.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }
    const erroHorario = validarHorario(timeStart.trim(), timeEnd.trim(), params.turno);
    if (erroHorario) {
      Alert.alert("Horário indisponível", erroHorario);
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/aulas/${params.id}`, {
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        subject: subject.trim(),
        professorId: professorSelecionado?.id ?? null,
        salaId: salaSelecionada?.id ?? null,
      });
      Alert.alert("Sucesso", "Horário atualizado!", [
        { text: "OK", onPress: () => router.replace("/cronogramas" as any) },
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
              router.replace("/cronogramas" as any);
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

        {carregando ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView contentContainerStyle={es.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={es.section}>
              <Text style={es.sectionTitle}>Horário de início</Text>
              <TextInput style={es.inputCard} value={timeStart} onChangeText={(t) => setTimeStart(formatarHorario(t))} placeholder="0730 → 07:30" placeholderTextColor="#AAAAAA" keyboardType="numeric" maxLength={5} />
            </View>
            <View style={es.section}>
              <Text style={es.sectionTitle}>Horário de término</Text>
              <TextInput style={es.inputCard} value={timeEnd} onChangeText={(t) => setTimeEnd(formatarHorario(t))} placeholder="0800 → 08:00" placeholderTextColor="#AAAAAA" keyboardType="numeric" maxLength={5} />
            </View>
            <View style={es.section}>
              <Text style={es.sectionTitle}>Matéria</Text>
              <TextInput style={es.inputCard} value={subject} onChangeText={setSubject} placeholder="Ex: Matemática" placeholderTextColor="#AAAAAA" />
            </View>

            <View style={es.section}>
              <Text style={es.sectionTitle}>Sala</Text>
              {salas.map((sala) => {
                const sel = salaSelecionada?.id === sala.id;
                return (
                  <TouchableOpacity key={sala.id} style={[es.professorCard, sel && es.professorCardSelected]} onPress={() => setSalaSelecionada(sel ? null : sala)} activeOpacity={0.75}>
                    <View style={es.professorAvatar}><Text style={es.professorAvatarText}>🏫</Text></View>
                    <View style={es.professorInfo}>
                      <Text style={es.professorNome}>{salaLabel(sala)}</Text>
                      {sala.capacidade ? <Text style={es.professorMaterias}>👥 {sala.capacidade}</Text> : null}
                    </View>
                    {sel && <Text style={es.professorCheckmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalhe da Aula</Text>
        <TouchableOpacity style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }} onPress={() => setEditando(true)}>
          <Text style={{ fontSize: 22 }}>✏️</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <View style={[s.subjectBanner, { borderLeftColor: turnoInfo.color }]}>
          <Text style={s.subjectEmoji}>📖</Text>
          <Text style={s.subjectTitle}>{params.subject}</Text>
        </View>

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
        </View>

        {params.salaNome ? (
          <View style={s.teacherCard}>
            <View style={s.teacherAvatar}><Text style={{ fontSize: 28 }}>🏫</Text></View>
            <View style={s.teacherInfo}>
              <Text style={s.teacherLabel}>Sala</Text>
              <Text style={s.teacherName}>
                {params.salaNome}{params.salaTurma ? ` — ${params.salaTurma}` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={s.teacherCard}>
          <View style={s.teacherAvatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
          <View style={s.teacherInfo}>
            <Text style={s.teacherLabel}>Professor(a)</Text>
            <Text style={s.teacherName}>{params.teacher || "Não atribuído"}</Text>
          </View>
        </View>

        <View style={s.durationRow}>
          <Text style={s.durationIcon}>⏱️</Text>
          <Text style={s.durationText}>Duração: {calcDuration(params.timeStart, params.timeEnd)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
