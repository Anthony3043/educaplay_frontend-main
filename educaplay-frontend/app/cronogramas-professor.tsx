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
import { Ionicons } from "@expo/vector-icons";
import api from "../src/services/api";
import { useAuth } from "../context/AuthContext";

type TurnoId = "matutino" | "vespertino" | "noturno" | "integral";

type AulaProfessor = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  salaNome: string | null;
  salaTurma: string | null;
  turno: TurnoId;
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

const TURNOS: { id: TurnoId; label: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; time: string }[] = [
  { id: "matutino",   label: "Matutino",   ionicon: "sunny-outline",       time: "07:00 - 12:00" },
  { id: "vespertino", label: "Vespertino", ionicon: "partly-sunny-outline", time: "13:00 - 18:00" },
  { id: "noturno",    label: "Noturno",    ionicon: "moon-outline",         time: "18:30 - 23:00" },
  { id: "integral",   label: "Integral",   ionicon: "book-outline",         time: "07:00 - 18:00" },
];

const TABS = [
  { id: "home",          ionicon: "home-outline" as const, label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

export default function CronogramasProfessorScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [minhasAulas, setMinhasAulas] = useState<Record<TurnoId, AulaProfessor[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/cronogramas");
      const dados: Record<TurnoId, AulaProfessor[]> = {
        matutino: [], vespertino: [], noturno: [], integral: [],
      };
      (res.data as CronogramaAPI[]).forEach((c) => {
        const turno = c.turno as TurnoId;
        if (!(turno in dados)) return;
        c.aulas
          .filter((a) => !a.isInterval && a.professor?.id === usuario?.id)
          .forEach((a) => {
            dados[turno].push({
              id: a.id,
              timeStart: a.timeStart,
              timeEnd: a.timeEnd,
              subject: a.subject,
              salaNome: a.sala?.nome ?? null,
              salaTurma: a.sala?.turma ?? null,
              turno,
            });
          });
      });
      setMinhasAulas(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o cronograma.");
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/home-professor");
    else if (tabId === "configuracoes") router.push("/configuracoes");
  };

  const aulasDoCronograma = minhasAulas[selectedTurno];
  const totalAulas = Object.values(minhasAulas).reduce((sum, list) => sum + list.length, 0);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meu Cronograma</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent}>
          {/* Resumo */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={resumoStyles.card}>
              <Ionicons name="book-outline" size={32} color="#2d6a4f" />
              <View>
                <Text style={resumoStyles.total}>
                  {totalAulas} aula{totalAulas !== 1 ? "s" : ""} atribuída{totalAulas !== 1 ? "s" : ""}
                </Text>
                <Text style={resumoStyles.subtotal}>
                  Olá, {usuario?.nome?.split(" ")[0]}! Veja suas aulas abaixo.
                </Text>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecione o Turno</Text>
            <View style={s.turnoGrid}>
              {TURNOS.map((turno) => (
                <TouchableOpacity
                  key={turno.id}
                  style={[s.turnoCard, selectedTurno === turno.id && s.turnoCardSelected]}
                  onPress={() => setSelectedTurno(turno.id)}
                >
                  <Ionicons name={turno.ionicon} size={24} color={selectedTurno === turno.id ? "#3a7d44" : "#1a1a2e"} />
                  <Text style={s.turnoLabel}>{turno.label}</Text>
                  <Text style={s.turnoTime}>{turno.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Minhas Aulas</Text>
            {aulasDoCronograma.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={s.emptyText}>Nenhuma aula atribuída neste turno.</Text>
              </View>
            ) : (
              aulasDoCronograma.map((item) => (
                <View key={item.id} style={s.horarioItem}>
                  <View style={s.timeColumn}>
                    <Text style={s.startTime}>{item.timeStart}</Text>
                    <Text style={s.endTime}>{item.timeEnd}</Text>
                  </View>
                  <View style={s.infoColumn}>
                    {item.salaNome ? (
                      <Text style={s.materiaName}>
                        {item.salaNome}{item.salaTurma ? ` — ${item.salaTurma}` : ""}
                      </Text>
                    ) : (
                      <Text style={s.materiaName}>{item.subject}</Text>
                    )}
                    <Text style={s.professorName}>{item.subject}</Text>
                  </View>
                </View>
              ))
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
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const resumoStyles = StyleSheet.create({
  card: {
    backgroundColor: "#e8f5ea",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  subtotal: {
    fontSize: 12,
    color: "#52b788",
    marginTop: 2,
  },
});
