import { styles as s } from "@/styles/Cronogramasstyles";
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
import { ActionBar } from "@/components/ActionBar";

export type TurnoId = "matutino" | "vespertino" | "noturno" | "integral";

export type Aula = {
  id: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  teacher: string;
  isInterval?: boolean;
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

export const SCHEDULE_DATA: Record<TurnoId, Aula[]> = {
  matutino: [
    { id: "m1", timeStart: "07:00", timeEnd: "07:50", subject: "Matemática",      teacher: "Prof. Ricardo" },
    { id: "m2", timeStart: "07:50", timeEnd: "08:40", subject: "História",         teacher: "Prof. Ana" },
    { id: "m3", timeStart: "08:40", timeEnd: "09:30", subject: "Português",        teacher: "Prof. Carlos" },
    { id: "mi", timeStart: "09:30", timeEnd: "09:50", subject: "Intervalo",        teacher: "", isInterval: true },
    { id: "m4", timeStart: "09:50", timeEnd: "10:40", subject: "Ciências",         teacher: "Prof. Beatriz" },
    { id: "m5", timeStart: "10:40", timeEnd: "11:30", subject: "Geografia",        teacher: "Prof. Marcos" },
    { id: "mf", timeStart: "11:30", timeEnd: "12:00", subject: "Intervalo Final",  teacher: "", isInterval: true },
  ],
  vespertino: [
    { id: "v1", timeStart: "13:00", timeEnd: "13:50", subject: "Física",           teacher: "Prof. Luiz" },
    { id: "v2", timeStart: "13:50", timeEnd: "14:40", subject: "Química",          teacher: "Prof. Fernanda" },
    { id: "v3", timeStart: "14:40", timeEnd: "15:30", subject: "Biologia",         teacher: "Prof. Paula" },
    { id: "vi", timeStart: "15:30", timeEnd: "15:50", subject: "Intervalo",        teacher: "", isInterval: true },
    { id: "v4", timeStart: "15:50", timeEnd: "16:40", subject: "Inglês",           teacher: "Prof. Sandra" },
    { id: "v5", timeStart: "16:40", timeEnd: "17:30", subject: "Educação Física",  teacher: "Prof. João" },
    { id: "vf", timeStart: "17:30", timeEnd: "18:00", subject: "Intervalo Final",  teacher: "", isInterval: true },
  ],
  noturno: [
    { id: "n1", timeStart: "18:30", timeEnd: "19:20", subject: "Matemática",       teacher: "Prof. Roberto" },
    { id: "n2", timeStart: "19:20", timeEnd: "20:10", subject: "Português",        teacher: "Prof. Lúcia" },
    { id: "ni", timeStart: "20:10", timeEnd: "20:30", subject: "Intervalo",        teacher: "", isInterval: true },
    { id: "n3", timeStart: "20:30", timeEnd: "21:20", subject: "História",         teacher: "Prof. Tiago" },
    { id: "n4", timeStart: "21:20", timeEnd: "22:10", subject: "Geografia",        teacher: "Prof. Cláudia" },
    { id: "nf", timeStart: "22:10", timeEnd: "23:00", subject: "Intervalo Final",  teacher: "", isInterval: true },
  ],
  integral: [
    { id: "i1",  timeStart: "07:00", timeEnd: "07:50", subject: "Matemática",      teacher: "Prof. Ricardo" },
    { id: "i2",  timeStart: "07:50", timeEnd: "08:40", subject: "Português",       teacher: "Prof. Carlos" },
    { id: "i3",  timeStart: "08:40", timeEnd: "09:30", subject: "História",        teacher: "Prof. Ana" },
    { id: "ii1", timeStart: "09:30", timeEnd: "09:50", subject: "Intervalo",       teacher: "", isInterval: true },
    { id: "i4",  timeStart: "09:50", timeEnd: "10:40", subject: "Ciências",        teacher: "Prof. Beatriz" },
    { id: "i5",  timeStart: "10:40", timeEnd: "11:30", subject: "Geografia",       teacher: "Prof. Marcos" },
    { id: "il",  timeStart: "11:30", timeEnd: "13:00", subject: "Almoço",          teacher: "", isInterval: true },
    { id: "i6",  timeStart: "13:00", timeEnd: "13:50", subject: "Física",          teacher: "Prof. Luiz" },
    { id: "i7",  timeStart: "13:50", timeEnd: "14:40", subject: "Química",         teacher: "Prof. Fernanda" },
    { id: "i8",  timeStart: "14:40", timeEnd: "15:30", subject: "Biologia",        teacher: "Prof. Paula" },
    { id: "ii2", timeStart: "15:30", timeEnd: "15:50", subject: "Intervalo",       teacher: "", isInterval: true },
    { id: "i9",  timeStart: "15:50", timeEnd: "16:40", subject: "Inglês",          teacher: "Prof. Sandra" },
    { id: "i10", timeStart: "16:40", timeEnd: "17:30", subject: "Educação Física", teacher: "Prof. João" },
    { id: "if",  timeStart: "17:30", timeEnd: "18:00", subject: "Intervalo Final", teacher: "", isInterval: true },
  ],
};

export default function CronogramasScreen() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<TurnoId>("matutino");
  const [activeTab, setActiveTab] = useState("cronograma");
  const [modoEdicao, setModoEdicao] = useState(false);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/home");
    else if (tabId === "configuracoes") router.push("/configuracoes");
  };

  // Clique normal → detalhe da aula
  const handleAulaPress = (aula: Aula) => {
    if (aula.isInterval) return;
    router.push({
      pathname: "/AulaDetalhe",
      params: {
        id:        aula.id,
        timeStart: aula.timeStart,
        timeEnd:   aula.timeEnd,
        subject:   aula.subject,
        teacher:   aula.teacher,
        turno:     selectedTurno,
      },
    });
  };

  // Clique no modo edição → tela de edição
  const handleAulaEditPress = (aula: Aula) => {
    router.push({
      pathname: "/EditarHorario",
      params: {
        id:         aula.id,
        timeStart:  aula.timeStart,
        timeEnd:    aula.timeEnd,
        subject:    aula.subject,
        teacher:    aula.teacher,
        turno:      selectedTurno,
        isInterval: aula.isInterval ? "true" : "false",
      },
    });
  };

  const handleItemPress = (aula: Aula) => {
    if (modoEdicao) handleAulaEditPress(aula);
    else handleAulaPress(aula);
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

          {SCHEDULE_DATA[selectedTurno].map((item) =>
            item.isInterval ? (
              // Intervalo — clicável apenas no modo edição
              <TouchableOpacity
                key={item.id}
                style={[
                  s.intervalItem,
                  modoEdicao && editBannerStyle.editableItem,
                ]}
                onPress={() => modoEdicao && handleAulaEditPress(item)}
                activeOpacity={modoEdicao ? 0.7 : 1}
              >
                <Text style={s.intervalIcon}>
                  {modoEdicao ? "✏️" : "☕"}
                </Text>
                <Text style={s.intervalText}>
                  {item.subject} · {item.timeStart} – {item.timeEnd}
                </Text>
              </TouchableOpacity>
            ) : (
              // Aula — sempre clicável
              <TouchableOpacity
                key={item.id}
                style={[
                  s.horarioItem,
                  modoEdicao && editBannerStyle.editableItem,
                ]}
                activeOpacity={0.75}
                onPress={() => handleItemPress(item)}
              >
                <View style={s.timeColumn}>
                  <Text style={s.startTime}>{item.timeStart}</Text>
                  <Text style={s.endTime}>{item.timeEnd}</Text>
                </View>
                <View style={s.infoColumn}>
                  <Text style={s.materiaName}>{item.subject}</Text>
                  <Text style={s.professorName}>{item.teacher}</Text>
                </View>
                <Text style={{ fontSize: 18, color: "#CCC" }}>
                  {modoEdicao ? "✏️" : "›"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      {/* ActionBar */}
      <ActionBar
        onEdit={() => setModoEdicao(true)}
        onSave={() => {
          setModoEdicao(false);
          console.log("Salvar cronograma");
        }}
        onExportPDF={() => console.log("Exportar PDF")}
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

// Estilos inline pequenos só para o banner de edição
// (para não poluir o Cronogramasstyles com coisa específica)
import { StyleSheet } from "react-native";
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