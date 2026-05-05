import { styles as s } from "";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TURNOS: Array<{
  id: "matutino" | "vespertino" | "noturno";
  label: string;
  icon: string;
  time: string;
}> = [
  { id: "matutino", label: "Matutino", icon: "☀️", time: "07:00 - 12:30" },
  { id: "vespertino", label: "Vespertino", icon: "🌤️", time: "13:00 - 18:30" },
  { id: "noturno", label: "Noturno", icon: "🌙", time: "19:00 - 22:30" },
];

const TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "cronograma", icon: "📅", label: "Cronograma" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações" },
];

// Mock de dados para exemplo
const SCHEDULE_DATA = {
  matutino: [
    {
      id: "1",
      timeStart: "07:00",
      timeEnd: "07:50",
      subject: "Matemática",
      teacher: "Prof. Ricardo",
    },
    {
      id: "2",
      timeStart: "07:50",
      timeEnd: "08:40",
      subject: "História",
      teacher: "Prof. Ana",
    },
  ],
  vespertino: [],
  noturno: [],
};

export default function CronogramasScreen() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<
    "matutino" | "vespertino" | "noturno"
  >("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.push("/home");
    } else if (tabId === "configuracoes") {
      router.push("/configuracoes");
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 40 }} /> {/* Spacer para centralizar título */}
      </View>

      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Seleção de Turno */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Selecione o Turno</Text>
          <View style={s.turnoGrid}>
            {TURNOS.map((turno) => (
              <TouchableOpacity
                key={turno.id}
                style={[
                  s.turnoCard,
                  selectedTurno === turno.id && s.turnoCardSelected,
                ]}
                onPress={() => setSelectedTurno(turno.id)}
              >
                <Text style={s.turnoIcon}>{turno.icon}</Text>
                <Text style={s.turnoLabel}>{turno.label}</Text>
                <Text style={s.turnoTime}>{turno.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de Aulas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Horários das Aulas</Text>

          {SCHEDULE_DATA[selectedTurno].length > 0 ? (
            SCHEDULE_DATA[selectedTurno].map((item) => (
              <View key={item.id} style={s.horarioItem}>
                <View style={s.timeColumn}>
                  <Text style={s.startTime}>{item.timeStart}</Text>
                  <Text style={s.endTime}>{item.timeEnd}</Text>
                </View>
                <View style={s.infoColumn}>
                  <Text style={s.materiaName}>{item.subject}</Text>
                  <Text style={s.professorName}>{item.teacher}</Text>
                </View>
                <Text style={{ fontSize: 18, color: "#CCC" }}>⋮</Text>
              </View>
            ))
          ) : (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 40 }}>🗓️</Text>
              <Text style={s.emptyText}>
                Nenhum horário cadastrado para este turno.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
