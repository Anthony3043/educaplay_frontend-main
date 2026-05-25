import { styles as s } from "@/styles/EditarHorarioStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { Ionicons } from "@expo/vector-icons";

type Slot = { start: string; end: string };

const TURNO_LABELS: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
};

const TURNO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  matutino:   "sunny-outline",
  vespertino: "partly-sunny-outline",
  noturno:    "moon-outline",
  integral:   "book-outline",
};

const TURNO_LIMITES: Record<string, { inicio: string; fim: string }> = {
  matutino:   { inicio: "07:00", fim: "12:35" },
  vespertino: { inicio: "13:00", fim: "18:00" },
  noturno:    { inicio: "18:30", fim: "23:00" },
  integral:   { inicio: "07:00", fim: "18:00" },
};

export function storageKeyHorarios(turno: string) {
  return `@educaplay_horarios_${turno}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatarHorario(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  let normalized = digitos;
  if (normalized.length >= 1 && parseInt(normalized[0], 10) >= 3) {
    normalized = "0" + normalized;
  }
  normalized = normalized.slice(0, 4);
  if (normalized.length <= 2) return normalized;
  return `${normalized.slice(0, 2)}:${normalized.slice(2)}`;
}

function calcDuracao(start: string, end: string): string {
  const totalMin = toMinutes(end) - toMinutes(start);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export default function HorarioAulasScreen() {
  const router = useRouter();
  const { turno } = useLocalSearchParams<{ turno: string }>();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [novoStart, setNovoStart] = useState("");
  const [novoEnd, setNovoEnd] = useState("");
  const [erroAdd, setErroAdd] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKeyHorarios(turno))
      .then((val) => setSlots(val ? JSON.parse(val) : []))
      .catch(() => setSlots([]));
  }, [turno]);

  const salvarSlots = async (novos: Slot[]) => {
    await AsyncStorage.setItem(storageKeyHorarios(turno), JSON.stringify(novos));
    setSlots(novos);
  };

  const adicionarSlot = () => {
    const formato = /^\d{2}:\d{2}$/;
    if (!formato.test(novoStart) || !formato.test(novoEnd)) {
      setErroAdd("Use o formato HH:MM (ex: 07:00, 07:50).");
      return;
    }
    if (toMinutes(novoEnd) <= toMinutes(novoStart)) {
      setErroAdd("O término deve ser após o início.");
      return;
    }
    const limite = TURNO_LIMITES[turno];
    if (limite) {
      if (toMinutes(novoStart) < toMinutes(limite.inicio) || toMinutes(novoStart) >= toMinutes(limite.fim)) {
        setErroAdd(`Início fora do turno (${limite.inicio} – ${limite.fim}).`);
        return;
      }
      if (toMinutes(novoEnd) > toMinutes(limite.fim)) {
        setErroAdd(`Término fora do turno (${limite.inicio} – ${limite.fim}).`);
        return;
      }
    }
    const jaExiste = slots.some((sl) => sl.start === novoStart && sl.end === novoEnd);
    if (jaExiste) {
      setErroAdd("Este horário já está na lista.");
      return;
    }
    const novos = [...slots, { start: novoStart, end: novoEnd }]
      .sort((a, b) => a.start.localeCompare(b.start));
    salvarSlots(novos);
    setAddModal(false);
    setNovoStart("");
    setNovoEnd("");
    setErroAdd(null);
  };

  const removerSlot = (index: number) => {
    Alert.alert(
      "Remover horário",
      `Remover ${slots[index].start} – ${slots[index].end} da lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => salvarSlots(slots.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const limparTudo = () => {
    Alert.alert(
      "Limpar lista",
      "Remover todos os horários configurados para este turno?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: () => salvarSlots([]) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Horário das Aulas</Text>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#3a7d44" }]}
          onPress={() => setAddModal(true)}
        >
          <Ionicons name="add" size={22} color="#3a7d44" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 }}>
        {/* Banner do turno */}
        <View style={s.horarioBanner}>
          <Ionicons name={TURNO_ICONS[turno] ?? "calendar-outline"} size={28} color="#3a7d44" />
          <View style={{ flex: 1 }}>
            <Text style={s.horarioBannerTime}>{TURNO_LABELS[turno] ?? turno}</Text>
            <Text style={s.horarioBannerSub}>
              {slots.length === 0
                ? "Nenhum horário configurado"
                : `${slots.length} horário${slots.length > 1 ? "s" : ""} configurado${slots.length > 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        {/* Explicação */}
        <View style={ha.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#1d4ed8" />
          <Text style={ha.infoText}>
            Os horários definidos aqui serão usados ao criar novas aulas, garantindo que todas as colunas fiquem com tempos idênticos.
          </Text>
        </View>

        {/* Lista de slots */}
        {slots.length === 0 ? (
          <View style={ha.empty}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={ha.emptyTitle}>Nenhum horário configurado</Text>
            <Text style={ha.emptyHint}>Toque em "+" para adicionar o primeiro horário.</Text>
          </View>
        ) : (
          <>
            {slots.map((slot, idx) => (
              <View key={idx} style={ha.slotCard}>
                <View style={ha.slotIconBox}>
                  <Ionicons name="time-outline" size={22} color="#3a7d44" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ha.slotTime}>{slot.start} – {slot.end}</Text>
                  <Text style={ha.slotDur}>{calcDuracao(slot.start, slot.end)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerSlot(idx)}
                  style={ha.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={limparTudo} style={ha.clearBtn} activeOpacity={0.8}>
              <Text style={ha.clearBtnText}>🗑️ Limpar todos os horários</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal adicionar slot */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <TouchableOpacity
          style={ha.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={ha.modalCard}>
            <View style={ha.modalHeader}>
              <Text style={ha.modalTitle}>Adicionar horário</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color="#aaa" />
              </TouchableOpacity>
            </View>

            {TURNO_LIMITES[turno] && (
              <Text style={ha.limiteHint}>
                🕐 Turno: {TURNO_LIMITES[turno].inicio} – {TURNO_LIMITES[turno].fim}
              </Text>
            )}

            <Text style={s.sectionTitle}>Início</Text>
            <TextInput
              style={[s.inputCard, { marginBottom: 14 }]}
              value={novoStart}
              onChangeText={(t) => { setNovoStart(formatarHorario(t)); setErroAdd(null); }}
              placeholder="Ex: 07:00"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              maxLength={5}
              autoFocus
            />

            <Text style={s.sectionTitle}>Término</Text>
            <TextInput
              style={[s.inputCard, { marginBottom: 14 }]}
              value={novoEnd}
              onChangeText={(t) => { setNovoEnd(formatarHorario(t)); setErroAdd(null); }}
              placeholder="Ex: 07:50"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              maxLength={5}
            />

            {erroAdd ? (
              <Text style={ha.erroText}>⚠ {erroAdd}</Text>
            ) : null}

            <TouchableOpacity style={ha.addConfirmBtn} onPress={adicionarSlot} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={ha.addConfirmBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const ha = StyleSheet.create({
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: { fontSize: 13, color: "#1d4ed8", flex: 1, lineHeight: 18 },

  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#aaa" },
  emptyHint: { fontSize: 13, color: "#ccc", textAlign: "center" },

  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E8F5EA",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  slotIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E8F5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  slotTime: { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },
  slotDur: { fontSize: 12, color: "#888", marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  clearBtn: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    alignItems: "center",
  },
  clearBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a2e" },
  limiteHint: {
    fontSize: 12,
    color: "#3a7d44",
    fontWeight: "600",
    marginBottom: 14,
  },
  erroText: { fontSize: 13, color: "#DC2626", marginBottom: 12 },
  addConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3a7d44",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  addConfirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
