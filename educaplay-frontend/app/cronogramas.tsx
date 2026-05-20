import { styles as s } from "@/styles/Cronogramasstyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/services/api";

export type TurnoId = "matutino" | "vespertino" | "noturno" | "integral";

export type Aula = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  teacher: string;
  isInterval?: boolean;
  professorId?: string | null;
};

type CronogramaAPI = {
  id: string;
  turno: string;
  aulas: Array<{
    id: string;
    timeStart: string;
    timeEnd: string;
    subject: string;
    isInterval: boolean;
    professor: { id: string; nome: string } | null;
  }>;
};

const TURNOS: Array<{ id: TurnoId; label: string; icon: string; time: string }> = [
  { id: "matutino",   label: "Matutino",   icon: "☀️",  time: "07:00 - 12:00" },
  { id: "vespertino", label: "Vespertino", icon: "🌤️", time: "13:00 - 18:00" },
  { id: "noturno",    label: "Noturno",    icon: "🌙",  time: "18:30 - 23:00" },
  { id: "integral",   label: "Integral",   icon: "📚",  time: "07:00 - 18:00" },
];

const TABS = [
  { id: "home",          icon: "🏠", label: "Home" },
  { id: "cronograma",    icon: "📅", label: "Cronograma" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações" },
];

export default function CronogramasScreen() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [cronogramas, setCronogramas] = useState<Record<TurnoId, Aula[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [cronogramaIds, setCronogramaIds] = useState<Record<TurnoId, string | null>>({
    matutino: null, vespertino: null, noturno: null, integral: null,
  });
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/cronogramas");
      const ids: Record<TurnoId, string | null> = { matutino: null, vespertino: null, noturno: null, integral: null };
      const dados: Record<TurnoId, Aula[]> = { matutino: [], vespertino: [], noturno: [], integral: [] };
      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (turno in dados) {
          ids[turno] = c.id;
          dados[turno] = c.aulas.map((a) => ({
            id: a.id,
            timeStart: a.timeStart,
            timeEnd: a.timeEnd,
            subject: a.subject,
            teacher: a.professor?.nome ?? "",
            isInterval: a.isInterval,
            professorId: a.professor?.id ?? null,
          }));
        }
      });
      setCronogramaIds(ids);
      setCronogramas(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os cronogramas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriarCronograma = async () => {
    if (cronogramaIds[selectedTurno]) {
      Alert.alert("Aviso", `Já existe um cronograma para o turno ${selectedTurno}.`);
      return;
    }
    setCriando(true);
    try {
      const res = await api.post("/cronogramas", { turno: selectedTurno });
      setCronogramaIds((prev) => ({ ...prev, [selectedTurno]: res.data.id }));
      Alert.alert("Sucesso", "Cronograma criado com sucesso!");
      await carregar();
    } catch {
      Alert.alert("Erro", "Não foi possível criar o cronograma.");
    } finally {
      setCriando(false);
    }
  };

  const handleCriarHorario = () => {
    const cronogramaId = cronogramaIds[selectedTurno];
    if (!cronogramaId) {
      Alert.alert("Atenção", "Crie um cronograma para este turno antes de adicionar horários.");
      return;
    }
    router.push({
      pathname: "/CriarHorario",
      params: { cronogramaId, turno: selectedTurno },
    });
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/home");
    else if (tabId === "configuracoes") router.push("/configuracoes");
  };

  const handleAulaPress = (aula: Aula) => {
    if (aula.isInterval) return;
    router.push({
      pathname: "/AulaDetalhe",
      params: {
        id: aula.id,
        timeStart: aula.timeStart,
        timeEnd: aula.timeEnd,
        subject: aula.subject,
        teacher: aula.teacher,
        turno: selectedTurno,
      },
    });
  };

  const aulasDoCronograma = cronogramas[selectedTurno];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecione o Turno</Text>
            <View style={s.turnoGrid}>
              {TURNOS.map((turno) => (
                <TouchableOpacity
                  key={turno.id}
                  style={[s.turnoCard, selectedTurno === turno.id && s.turnoCardSelected]}
                  onPress={() => setSelectedTurno(turno.id)}
                >
                  <Text style={s.turnoIcon}>{turno.icon}</Text>
                  <Text style={s.turnoLabel}>{turno.label}</Text>
                  <Text style={s.turnoTime}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botões de ação */}
          <View style={actionStyles.row}>
            <TouchableOpacity
              style={[actionStyles.btn, actionStyles.btnPrimary, criando && actionStyles.btnDisabled]}
              onPress={handleCriarCronograma}
              disabled={criando}
              activeOpacity={0.8}
            >
              <Text style={actionStyles.btnIcon}>📋</Text>
              <Text style={actionStyles.btnTextPrimary}>
                {criando ? "Criando..." : "Criar Cronograma"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[actionStyles.btn, actionStyles.btnSecondary]}
              onPress={handleCriarHorario}
              activeOpacity={0.8}
            >
              <Text style={actionStyles.btnIcon}>⏰</Text>
              <Text style={actionStyles.btnTextSecondary}>Criar Horário</Text>
            </TouchableOpacity>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Horários das Aulas</Text>
            {aulasDoCronograma.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 40 }}>🗓️</Text>
                <Text style={s.emptyText}>Nenhum horário cadastrado para este turno.</Text>
              </View>
            ) : (
              aulasDoCronograma.map((item) =>
                item.isInterval ? (
                  <View key={item.id} style={s.intervalItem}>
                    <Text style={s.intervalIcon}>☕</Text>
                    <Text style={s.intervalText}>
                      {item.subject} · {item.timeStart} – {item.timeEnd}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={item.id}
                    style={s.horarioItem}
                    activeOpacity={0.75}
                    onPress={() => handleAulaPress(item)}
                  >
                    <View style={s.timeColumn}>
                      <Text style={s.startTime}>{item.timeStart}</Text>
                      <Text style={s.endTime}>{item.timeEnd}</Text>
                    </View>
                    <View style={s.infoColumn}>
                      <Text style={s.materiaName}>{item.subject}</Text>
                      <Text style={s.professorName}>{item.teacher}</Text>
                    </View>
                    <Text style={{ fontSize: 18, color: "#CCC" }}>›</Text>
                  </TouchableOpacity>
                )
              )
            )}
          </View>
        </ScrollView>
      )}

      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabIcon, isActive && s.tabIconActive]}>{tab.icon}</Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const actionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 4,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  btnPrimary: {
    backgroundColor: "#3a7d44",
  },
  btnSecondary: {
    backgroundColor: "#EEF1FF",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    fontSize: 16,
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  btnTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B6BD8",
  },
});
