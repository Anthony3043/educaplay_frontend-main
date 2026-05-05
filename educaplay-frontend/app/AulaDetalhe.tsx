import { styles as s } from "@/styles/aulaDetalheStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TURNO_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  matutino:   { label: "Matutino",   icon: "☀️",  color: "#F59E0B" },
  vespertino: { label: "Vespertino", icon: "🌤️", color: "#3B82F6" },
  noturno:    { label: "Noturno",    icon: "🌙",  color: "#6366F1" },
  integral:   { label: "Integral",   icon: "📚",  color: "#10B981" },
};

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin <= 0) return "—";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

export default function AulaDetalheScreen() {
  const router = useRouter();
  const { timeStart, timeEnd, subject, teacher, turno } =
    useLocalSearchParams<{
      id: string;
      timeStart: string;
      timeEnd: string;
      subject: string;
      teacher: string;
      turno: string;
    }>();

  const turnoInfo = TURNO_LABELS[turno] ?? {
    label: turno,
    icon: "📅",
    color: "#6366F1",
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalhe da Aula</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>

        {/* Banner da matéria */}
        <View style={[s.subjectBanner, { borderLeftColor: turnoInfo.color }]}>
          <Text style={s.subjectEmoji}>📖</Text>
          <Text style={s.subjectTitle}>{subject}</Text>
        </View>

        {/* Cards de info */}
        <View style={s.infoGrid}>
          <View style={s.infoCard}>
            <Text style={s.infoCardIcon}>🕐</Text>
            <Text style={s.infoCardLabel}>Horário</Text>
            <Text style={s.infoCardValue}>{timeStart}</Text>
            <Text style={s.infoCardSub}>até {timeEnd}</Text>
          </View>

          <View style={s.infoCard}>
            <Text style={s.infoCardIcon}>{turnoInfo.icon}</Text>
            <Text style={s.infoCardLabel}>Turno</Text>
            <Text style={s.infoCardValue}>{turnoInfo.label}</Text>
          </View>
        </View>

        {/* Professor */}
        <View style={s.teacherCard}>
          <View style={s.teacherAvatar}>
            <Text style={{ fontSize: 28 }}>👨‍🏫</Text>
          </View>
          <View style={s.teacherInfo}>
            <Text style={s.teacherLabel}>Professor(a)</Text>
            <Text style={s.teacherName}>{teacher}</Text>
          </View>
        </View>

        {/* Duração */}
        <View style={s.durationRow}>
          <Text style={s.durationIcon}>⏱️</Text>
          <Text style={s.durationText}>
            Duração: {calcDuration(timeStart, timeEnd)}
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
