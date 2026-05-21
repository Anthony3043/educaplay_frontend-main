import { styles as s } from "@/styles/Cronogramasstyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  salaId?: string | null;
  salaNome?: string | null;
  salaTurma?: string | null;
};

type CronogramaAPI = {
  id: string;
  turno: string;
  aulas: {
    id: string;
    timeStart: string;
    timeEnd: string;
    subject: string;
    isInterval: boolean;
    professor: { id: string; nome: string } | null;
    sala: { id: string; nome: string; turma?: string | null } | null;
  }[];
};

const TURNOS: { id: TurnoId; label: string; icon: string; time: string }[] = [
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
            salaId: a.sala?.id ?? null,
            salaNome: a.sala?.nome ?? null,
            salaTurma: a.sala?.turma ?? null,
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

  const handleCriarHorario = async () => {
    let cronogramaId = cronogramaIds[selectedTurno];
    if (!cronogramaId) {
      try {
        const res = await api.post("/cronogramas", { turno: selectedTurno });
        cronogramaId = res.data.id;
        setCronogramaIds((prev) => ({ ...prev, [selectedTurno]: cronogramaId }));
      } catch {
        Alert.alert("Erro", "Não foi possível iniciar o cronograma.");
        return;
      }
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
        professorId: aula.professorId ?? "",
        salaId: aula.salaId ?? "",
        salaNome: aula.salaNome ?? "",
        salaTurma: aula.salaTurma ?? "",
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

          {/* Botão de ação */}
          <View style={actionStyles.row}>
            <TouchableOpacity
              style={[actionStyles.btn, actionStyles.btnPrimary]}
              onPress={handleCriarHorario}
              activeOpacity={0.8}
            >
              <Text style={actionStyles.btnIcon}>⏰</Text>
              <Text style={actionStyles.btnTextPrimary}>Criar Horário</Text>
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
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  btn: {
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
  btnIcon: {
    fontSize: 16,
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
