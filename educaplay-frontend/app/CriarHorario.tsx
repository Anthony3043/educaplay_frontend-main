import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../src/services/api";

type TipoSlot = "aula" | "intervalo";
type Professor = { id: string; nome: string; cargo?: string | null; foto?: string | null };
type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };

const salaLabel = (sala: Sala) => sala.turma ? `${sala.nome} — ${sala.turma}` : sala.nome;

const TURNO_LABELS: Record<string, string> = {
  matutino: "☀️ Matutino",
  vespertino: "🌤️ Vespertino",
  noturno: "🌙 Noturno",
  integral: "📚 Integral",
};

const TURNO_LIMITES: Record<string, { inicio: string; fim: string; label: string }> = {
  matutino:   { inicio: "07:00", fim: "12:35", label: "Matutino (07:00 – 12:35)" },
  vespertino: { inicio: "13:00", fim: "18:00", label: "Vespertino (13:00 – 18:00)" },
  noturno:    { inicio: "18:30", fim: "23:00", label: "Noturno (18:30 – 23:00)" },
  integral:   { inicio: "07:00", fim: "18:00", label: "Integral (07:00 – 18:00)" },
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatarHorario(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
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

  const handleSalvar = async () => {
    if (!timeStart.trim() || !timeEnd.trim()) {
      Alert.alert("Atenção", "Preencha o horário de início e de término.");
      return;
    }
    if (tipoSlot === "aula" && !materia.trim()) {
      Alert.alert("Atenção", "Informe o nome da matéria.");
      return;
    }
    const erroHorario = validarHorario(timeStart.trim(), timeEnd.trim(), turno);
    if (erroHorario) {
      Alert.alert("Horário indisponível", erroHorario);
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
      });
      setSucesso(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.error;
      if (status === 409) {
        Alert.alert("Conflito de horário", backendMsg || "Já existe um conflito neste período.");
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
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Criar Horário</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSalvar} disabled={salvando}>
          <Text style={s.saveBtnText}>{salvando ? "⏳" : "✓"}</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={{ fontSize: 28 }}>📅</Text>
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
                <Text style={[s.toggleBtnText, tipoSlot === "aula" && s.toggleBtnTextActive]}>
                  📖 Aula
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, tipoSlot === "intervalo" && s.toggleBtnActive]}
                onPress={() => setTipoSlot("intervalo")}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleBtnText, tipoSlot === "intervalo" && s.toggleBtnTextActive]}>
                  ☕ Intervalo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Horário início */}
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

          {/* Horário término */}
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

          {tipoSlot === "intervalo" ? (
            <View style={s.intervaloBanner}>
              <Text style={{ fontSize: 24 }}>☕</Text>
              <Text style={s.intervaloBannerText}>
                Este horário será marcado como intervalo. Nenhum professor ou sala será atribuído.
              </Text>
            </View>
          ) : (
            <>
              {/* Matéria */}
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

              {/* Sala */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Sala</Text>
                {salas.length === 0 ? (
                  <View style={s.emptyProfessores}>
                    <Text style={{ fontSize: 32 }}>🏫</Text>
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
                          <Text style={s.professorAvatarText}>🏫</Text>
                        </View>
                        <View style={s.professorInfo}>
                          <Text style={s.professorNome}>{salaLabel(sala)}</Text>
                          {sala.capacidade ? (
                            <Text style={s.professorMaterias}>👥 {sala.capacidade}</Text>
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
                <Text style={s.sectionTitle}>Professor</Text>
                {professores.length === 0 ? (
                  <View style={s.emptyProfessores}>
                    <Text style={{ fontSize: 32 }}>😔</Text>
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
                          {prof.foto ? (
                            <Image source={{ uri: prof.foto }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                          ) : (
                            <Text style={s.professorAvatarText}>👤</Text>
                          )}
                        </View>
                        <View style={s.professorInfo}>
                          <Text style={s.professorNome}>{prof.nome}</Text>
                          {prof.cargo ? (
                            <Text style={s.professorMaterias}>{prof.cargo}</Text>
                          ) : null}
                        </View>
                        {selected && <Text style={s.professorCheckmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={sucesso} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={ms.icon}>✅</Text>
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

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "80%",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginTop: 4 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
  btn: {
    marginTop: 12,
    backgroundColor: "#3a7d44",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
