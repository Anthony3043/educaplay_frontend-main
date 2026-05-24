import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type Professor = { id: string; nome: string; materias: string[] };
type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };
type TipoSlot = "aula" | "intervalo";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
  if (toMinutes(start) < toMinutes("07:00")) {
    return "Não existem aulas antes das 07:00.";
  }
  if (toMinutes(end) <= toMinutes(start)) {
    return "O horário de término deve ser após o horário de início.";
  }
  const limite = TURNO_LIMITES[turno];
  if (!limite) return null;
  if (toMinutes(start) < toMinutes(limite.inicio) || toMinutes(start) >= toMinutes(limite.fim)) {
    return `Horário de início fora do turno ${limite.label}.`;
  }
  if (toMinutes(end) > toMinutes(limite.fim)) {
    return `Horário de término fora do turno ${limite.label}.`;
  }
  return null;
}

export default function EditarHorarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    timeStart: string;
    timeEnd: string;
    subject: string;
    teacher: string;
    turno: string;
    isInterval: string;
    diaSemana: string;
  }>();

  const isIntervalOriginal = params.isInterval === "true";
  const [tipoSlot, setTipoSlot] = useState<TipoSlot>(isIntervalOriginal ? "intervalo" : "aula");
  const [timeStart, setTimeStart] = useState(params.timeStart);
  const [timeEnd, setTimeEnd] = useState(params.timeEnd);
  const [diaSemana, setDiaSemana] = useState<string | null>(params.diaSemana || null);
  const [materia, setMateria] = useState(isIntervalOriginal ? "" : params.subject);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/professores"), api.get("/salas")])
      .then(([rp, rs]) => {
        setProfessores(rp.data);
        setSalas(rs.data);
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar os dados."))
      .finally(() => setCarregando(false));
  }, []);

  const handleSalvar = async () => {
    const erroHorario = validarHorario(timeStart.trim(), timeEnd.trim(), params.turno);
    if (erroHorario) { Alert.alert("Horário indisponível", erroHorario); return; }
    if (tipoSlot === "aula") {
      if (!materia.trim()) { Alert.alert("Atenção", "Informe o nome da matéria."); return; }
      if (!professorSelecionado) { Alert.alert("Atenção", "Selecione um professor."); return; }
    }
    setSalvando(true);
    try {
      await api.put(`/aulas/${params.id}`, {
        subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        isInterval: tipoSlot === "intervalo",
        diaSemana: diaSemana || null,
        professorId: tipoSlot === "intervalo" ? null : professorSelecionado?.id,
        salaId: tipoSlot === "intervalo" ? null : salaSelecionada?.id ?? null,
      });
      Alert.alert("Salvo!", "Horário atualizado com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o horário.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Horário</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSalvar} disabled={salvando}>
          <Text style={s.saveBtnText}>{salvando ? "⏳" : "✓"}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.section}>
          <Text style={s.sectionTitle}>Horário de início</Text>
          <TextInput
            style={s.inputCard}
            value={timeStart}
            onChangeText={(t) => setTimeStart(formatarHorario(t))}
            placeholder="0730 → 07:30"
            placeholderTextColor="#AAAAAA"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Horário de término</Text>
          <TextInput
            style={s.inputCard}
            value={timeEnd}
            onChangeText={(t) => setTimeEnd(formatarHorario(t))}
            placeholder="0800 → 08:00"
            placeholderTextColor="#AAAAAA"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Dia da semana <Text style={{ fontWeight: "400", color: "#aaa" }}>(opcional)</Text></Text>
          <View style={eh.diasRow}>
            {DIAS.map((dia) => (
              <TouchableOpacity
                key={dia}
                style={[eh.chip, diaSemana === dia && eh.chipActive]}
                onPress={() => setDiaSemana(diaSemana === dia ? null : dia)}
                activeOpacity={0.7}
              >
                <Text style={[eh.chipText, diaSemana === dia && eh.chipTextActive]}>
                  {dia.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

        {tipoSlot === "intervalo" ? (
          <View style={s.intervaloBanner}>
            <Ionicons name="cafe-outline" size={24} color="#92400e" />
            <Text style={s.intervaloBannerText}>
              Este horário será marcado como intervalo. Nenhum professor ou matéria será atribuído.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Matéria</Text>
              <TextInput
                style={s.inputCard}
                value={materia}
                onChangeText={setMateria}
                placeholder="Ex: Matemática, Português..."
                placeholderTextColor="#AAAAAA"
              />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Sala <Text style={{ fontWeight: "400", color: "#aaa" }}>(opcional)</Text></Text>
              {carregando ? (
                <ActivityIndicator color="#3a7d44" />
              ) : salas.length === 0 ? (
                <View style={s.emptyProfessores}>
                  <Ionicons name="business-outline" size={32} color="#ccc" />
                  <Text style={s.emptyProfessoresText}>Nenhuma sala cadastrada.</Text>
                </View>
              ) : (
                salas.map((sala) => {
                  const sel = salaSelecionada?.id === sala.id;
                  const label = sala.turma ? `${sala.nome} — ${sala.turma}` : sala.nome;
                  return (
                    <TouchableOpacity
                      key={sala.id}
                      style={[s.professorCard, sel && s.professorCardSelected]}
                      onPress={() => setSalaSelecionada(sel ? null : sala)}
                      activeOpacity={0.75}
                    >
                      <View style={s.professorAvatar}>
                        <Text style={s.professorAvatarText}>🏫</Text>
                      </View>
                      <View style={s.professorInfo}>
                        <Text style={s.professorNome}>{label}</Text>
                        {sala.capacidade ? (
                          <Text style={s.professorMaterias}>👥 {sala.capacidade}</Text>
                        ) : null}
                      </View>
                      {sel && <Text style={s.professorCheckmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Professor</Text>
              {carregando ? (
                <ActivityIndicator color="#3a7d44" />
              ) : professores.length === 0 ? (
                <View style={s.emptyProfessores}>
                  <Ionicons name="person-outline" size={32} color="#ccc" />
                  <Text style={s.emptyProfessoresText}>Nenhum professor cadastrado.</Text>
                </View>
              ) : (
                professores.map((prof) => {
                  const selected = professorSelecionado?.id === prof.id;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[s.professorCard, selected && s.professorCardSelected]}
                      onPress={() => setProfessorSelecionado(selected ? null : prof)}
                      activeOpacity={0.75}
                    >
                      <View style={s.professorAvatar}>
                        <Ionicons name="person-outline" size={24} color="#888" />
                      </View>
                      <View style={s.professorInfo}>
                        <Text style={s.professorNome}>{prof.nome}</Text>
                        <Text style={s.professorMaterias}>{prof.materias.join(" · ")}</Text>
                      </View>
                      {selected && <Text style={s.professorCheckmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              tipoSlot === "intervalo" ? "Excluir intervalo" : "Excluir horário",
              "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
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
                      Alert.alert("Erro", "Não foi possível excluir.");
                    }
                  },
                },
              ]
            );
          }}
          style={{ marginTop: 8, padding: 14, backgroundColor: "#fee2e2", borderRadius: 12, alignItems: "center" }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 15 }}>🗑️ Excluir este horário</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const eh = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "#3a7d44" },
});
