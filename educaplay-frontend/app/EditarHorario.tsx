import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type Professor = { id: string; nome: string; materias: string[] };
type TipoSlot = "aula" | "intervalo";

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
  }>();

  const isIntervalOriginal = params.isInterval === "true";
  const [tipoSlot, setTipoSlot] = useState<TipoSlot>(isIntervalOriginal ? "intervalo" : "aula");
  const [materia, setMateria] = useState(isIntervalOriginal ? "" : params.subject);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get("/professores")
      .then((res) => setProfessores(res.data))
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
        professorId: tipoSlot === "intervalo" ? null : professorSelecionado?.id,
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

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.horarioBanner}>
          <Text style={{ fontSize: 28 }}>🕐</Text>
          <View>
            <Text style={s.horarioBannerTime}>{params.timeStart} – {params.timeEnd}</Text>
            <Text style={s.horarioBannerSub}>
              Turno {params.turno.charAt(0).toUpperCase() + params.turno.slice(1)}
            </Text>
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

        {tipoSlot === "intervalo" ? (
          <View style={s.intervaloBanner}>
            <Text style={{ fontSize: 24 }}>☕</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
