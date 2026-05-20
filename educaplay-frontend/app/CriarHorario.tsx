import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/services/api";

type TipoSlot = "aula" | "intervalo";
type Professor = { id: string; nome: string; materias: string[] };

const TURNO_LABELS: Record<string, string> = {
  matutino: "☀️ Matutino",
  vespertino: "🌤️ Vespertino",
  noturno: "🌙 Noturno",
  integral: "📚 Integral",
};

export default function CriarHorarioScreen() {
  const router = useRouter();
  const { cronogramaId, turno } = useLocalSearchParams<{
    cronogramaId: string;
    turno: string;
  }>();

  const [tipoSlot, setTipoSlot] = useState<TipoSlot>("aula");
  const [materia, setMateria] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const res = await api.get("/professores");
      setProfessores(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os professores.");
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
    setSalvando(true);
    try {
      await api.post("/aulas", {
        cronogramaId,
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
        professorId: tipoSlot === "aula" ? (professorSelecionado?.id ?? null) : null,
        isInterval: tipoSlot === "intervalo",
      });
      Alert.alert("Sucesso", "Horário criado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Não foi possível criar o horário.";
      Alert.alert("Erro", msg);
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
              onChangeText={setTimeStart}
              placeholder="Ex: 07:00"
              placeholderTextColor="#AAAAAA"
            />
          </View>

          {/* Horário término */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Horário de término</Text>
            <TextInput
              style={s.inputCard}
              value={timeEnd}
              onChangeText={setTimeEnd}
              placeholder="Ex: 08:00"
              placeholderTextColor="#AAAAAA"
            />
          </View>

          {tipoSlot === "intervalo" ? (
            <View style={s.intervaloBanner}>
              <Text style={{ fontSize: 24 }}>☕</Text>
              <Text style={s.intervaloBannerText}>
                Este horário será marcado como intervalo. Nenhum professor ou matéria será atribuído.
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
                          <Text style={s.professorAvatarText}>👨🏫</Text>
                        </View>
                        <View style={s.professorInfo}>
                          <Text style={s.professorNome}>{prof.nome}</Text>
                          <Text style={s.professorMaterias}>
                            {prof.materias?.join(" · ")}
                          </Text>
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
    </SafeAreaView>
  );
}
