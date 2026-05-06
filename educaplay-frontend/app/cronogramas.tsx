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

import { ActionBar } from "@/components/ActionBar";
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
    professor: { nome: string } | null;
  }>;
};

const TURNOS: Array<{
  id: TurnoId;
  label: string;
  icon: string;
  time: string;
}> = [
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

// Remover SCHEDULE_DATA mock — dados vêm do backend agora

export default function CronogramasScreen() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cronogramas, setCronogramas] = useState<Record<TurnoId, Aula[]>>({
    matutino: [], vespertino: [], noturno: [], integral: [],
  });
  const [cronogramaIds, setCronogramaIds] = useState<Record<TurnoId, string | null>>({
    matutino: null, vespertino: null, noturno: null, integral: null,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aulasEditadas, setAulasEditadas] = useState<Record<string, Partial<Aula>>>({});

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

  // Garante que o cronograma do turno existe no banco antes de editar
  const garantirCronograma = async (turno: TurnoId): Promise<string> => {
    if (cronogramaIds[turno]) return cronogramaIds[turno]!;
    const res = await api.post("/cronogramas", { turno });
    setCronogramaIds((prev) => ({ ...prev, [turno]: res.data.id }));
    return res.data.id;
  };

  const handleSalvar = async () => {
    if (Object.keys(aulasEditadas).length === 0) {
      setModoEdicao(false);
      return;
    }
    setSalvando(true);
    try {
      await garantirCronograma(selectedTurno);
      await Promise.all(
        Object.entries(aulasEditadas).map(([aulaId, dados]) =>
          api.put(`/aulas/${aulaId}`, dados)
        )
      );
      setAulasEditadas({});
      setModoEdicao(false);
      await carregar();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
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
      params: { id: aula.id, timeStart: aula.timeStart, timeEnd: aula.timeEnd, subject: aula.subject, teacher: aula.teacher, turno: selectedTurno },
    });
  };

  const handleAulaEditPress = (aula: Aula) => {
    router.push({
      pathname: "/EditarHorario",
      params: { id: aula.id, timeStart: aula.timeStart, timeEnd: aula.timeEnd, subject: aula.subject, teacher: aula.teacher, turno: selectedTurno, isInterval: aula.isInterval ? "true" : "false" },
    });
  };

  const handleItemPress = (aula: Aula) => {
    if (modoEdicao) handleAulaEditPress(aula);
    else handleAulaPress(aula);
  };

  const aulasDoCronograma = cronogramas[selectedTurno];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Banner modo edição */}
      {modoEdicao && (
        <View style={editBannerStyle.banner}>
          <Text style={editBannerStyle.text}>
            ✏️ Modo edição — toque em um horário para editar
          </Text>
          <TouchableOpacity onPress={() => setModoEdicao(false)}>
            <Text style={editBannerStyle.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Selecione o Turno</Text>
          <View style={s.turnoGrid}>
            {TURNOS.map((turno) => (
              <TouchableOpacity key={turno.id} style={[s.turnoCard, selectedTurno === turno.id && s.turnoCardSelected]} onPress={() => setSelectedTurno(turno.id)}>
                <Text style={s.turnoIcon}>{turno.icon}</Text>
                <Text style={s.turnoLabel}>{turno.label}</Text>
                <Text style={s.turnoTime}>{turno.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
                <TouchableOpacity key={item.id} style={[s.intervalItem, modoEdicao && editBannerStyle.editableItem]}
                  onPress={() => modoEdicao && handleAulaEditPress(item)} activeOpacity={modoEdicao ? 0.7 : 1}>
                  <Text style={s.intervalIcon}>{modoEdicao ? "✏️" : "☕"}</Text>
                  <Text style={s.intervalText}>{item.subject} · {item.timeStart} – {item.timeEnd}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={item.id} style={[s.horarioItem, modoEdicao && editBannerStyle.editableItem]}
                  activeOpacity={0.75} onPress={() => handleItemPress(item)}>
                  <View style={s.timeColumn}>
                    <Text style={s.startTime}>{item.timeStart}</Text>
                    <Text style={s.endTime}>{item.timeEnd}</Text>
                  </View>
                  <View style={s.infoColumn}>
                    <Text style={s.materiaName}>{item.subject}</Text>
                    <Text style={s.professorName}>{item.teacher}</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: "#CCC" }}>{modoEdicao ? "✏️" : "›"}</Text>
                </TouchableOpacity>
              )
            )
          )}
        </View>
      </ScrollView>
      )}

      <ActionBar
        onEdit={() => setModoEdicao(true)}
        onSave={handleSalvar}
        onExportPDF={() => Alert.alert("Em breve", "Exportação em PDF será implementada em breve.")}
        salvando={salvando}
      />

      {/* Tab Bar */}
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
              <Text style={[s.tabIcon, isActive && s.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const editBannerStyle = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF1FF",
    borderBottomWidth: 1,
    borderBottomColor: "#C7CFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    color: "#5B6BD8",
    fontWeight: "600",
    flex: 1,
  },
  cancel: {
    fontSize: 13,
    color: "#E05A5A",
    fontWeight: "700",
    marginLeft: 12,
  },
  editableItem: {
    borderColor: "#C7CFFF",
    borderWidth: 1.5,
  },
});