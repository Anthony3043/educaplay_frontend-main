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
import api from "../../src/services/api";

type Professor = { id: string; nome: string; materias: string[] };
type TipoSlot = "aula" | "intervalo";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
  const [diaSemana, setDiaSemana] = useState<string | null>(params.diaSemana || null);
  const [materia, setMateria] = useState(isIntervalOriginal ? "" : params.subject);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get("/professores")
      .then((rp) => setProfessores(rp.data))
      .catch(() => Alert.alert("Erro", "Não foi possível carregar os professores."))
      .finally(() => setCarregando(false));
  }, []);

  const handleSalvar = async () => {
    if (tipoSlot === "aula") {
      if (!materia.trim()) { Alert.alert("Atenção", "Informe o nome da matéria."); return; }
      if (!professorSelecionado) { Alert.alert("Atenção", "Selecione um professor."); return; }
    }
    setSalvando(true);
    try {
      await api.put(`/aulas/${params.id}`, {
        subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
        timeStart: params.timeStart,
        timeEnd: params.timeEnd,
        isInterval: tipoSlot === "intervalo",
        diaSemana: diaSemana || null,
        professorId: tipoSlot === "intervalo" ? null : professorSelecionado?.id,
        salaId: null,
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
        {/* Banner de horário – somente leitura */}
        <View style={ehEx.horarioBanner}>
          <View style={ehEx.horarioIconBox}>
            <Ionicons name="time-outline" size={22} color="#3a7d44" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ehEx.horarioLabel}>Horário (não editável)</Text>
            <Text style={ehEx.horarioValue}>{params.timeStart} – {params.timeEnd}</Text>
          </View>
          <Ionicons name="lock-closed-outline" size={16} color="#aaa" />
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

const ehEx = StyleSheet.create({
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
