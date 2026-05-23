import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import api from "../src/services/api";

type Bloqueio = {
  id: string;
  diaSemana: string | null;
  timeStart: string;
  timeEnd: string;
  descricao: string | null;
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const formatarHorario = (texto: string) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
};

export default function IndisponibilidadeScreen() {
  const router = useRouter();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [diaSemana, setDiaSemana] = useState<string | null>(null);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [descricao, setDescricao] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/bloqueios");
      setBloqueios(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os bloqueios.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAdicionar = async () => {
    if (!timeStart.trim() || !timeEnd.trim()) {
      Alert.alert("Atenção", "Preencha o horário de início e de término.");
      return;
    }
    setSalvando(true);
    try {
      const res = await api.post("/bloqueios", {
        diaSemana: diaSemana || null,
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        descricao: descricao.trim() || null,
      });
      setDiaSemana(null);
      setTimeStart("");
      setTimeEnd("");
      setDescricao("");
      await carregar();
      const removidas = res.data?.aulasRemovidas ?? 0;
      if (removidas > 0) {
        Alert.alert(
          "Aulas removidas automaticamente",
          `${removidas} aula(s) que conflitavam com este horário foram removidas do cronograma. A supervisão foi notificada.`
        );
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.error || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = (id: string) => {
    Alert.alert("Remover bloqueio", "Deseja remover este horário de indisponibilidade?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/bloqueios/${id}`);
            setBloqueios((prev) => prev.filter((b) => b.id !== id));
          } catch {
            Alert.alert("Erro", "Não foi possível remover.");
          }
        },
      },
    ]);
  };

  // Agrupa bloqueios por dia
  const bloqueiosPorDia = DIAS.reduce<Record<string, Bloqueio[]>>((acc, dia) => {
    acc[dia] = bloqueios.filter((b) => b.diaSemana === dia);
    return acc;
  }, {});
  const semDia = bloqueios.filter((b) => !b.diaSemana);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Minha Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Explicação */}
          <View style={s.infoBanner}>
            <Ionicons name="business-outline" size={22} color="#2d6a4f" />
            <Text style={s.infoText}>
              Registre os horários em que você está indisponível. A supervisão será avisada caso tente te alocar neste período.
            </Text>
          </View>

          {/* Formulário */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Adicionar indisponibilidade</Text>

            {/* Seleção de dia */}
            <Text style={s.label}>Dia da semana (opcional)</Text>
            <View style={s.diasRow}>
              {DIAS.map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[s.diaChip, diaSemana === dia && s.diaChipActive]}
                  onPress={() => setDiaSemana(diaSemana === dia ? null : dia)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.diaChipText, diaSemana === dia && s.diaChipTextActive]}>
                    {dia.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Horários */}
            <View style={s.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Início</Text>
                <TextInput
                  style={s.input}
                  value={timeStart}
                  onChangeText={(t) => setTimeStart(formatarHorario(t))}
                  placeholder="07:00"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={s.timeSep}>
                <Text style={{ color: "#aaa", fontSize: 18, fontWeight: "300" }}>–</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Término</Text>
                <TextInput
                  style={s.input}
                  value={timeEnd}
                  onChangeText={(t) => setTimeEnd(formatarHorario(t))}
                  placeholder="09:00"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <Text style={s.label}>Escola / motivo (opcional)</Text>
            <TextInput
              style={s.input}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex: Escola Estadual São João"
              placeholderTextColor="#AAAAAA"
            />

            <TouchableOpacity
              style={[s.addBtn, salvando && { opacity: 0.6 }]}
              onPress={handleAdicionar}
              disabled={salvando}
              activeOpacity={0.8}
            >
              {salvando
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="add" size={18} color="#fff" /><Text style={s.addBtnText}>Adicionar</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* Lista de bloqueios */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Meus bloqueios</Text>

            {bloqueios.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={s.emptyText}>Nenhum bloqueio cadastrado.</Text>
              </View>
            ) : (
              <>
                {DIAS.map((dia) =>
                  bloqueiosPorDia[dia].length === 0 ? null : (
                    <View key={dia} style={{ marginBottom: 12 }}>
                      <View style={s.diaHeader}>
                        <Ionicons name="calendar-outline" size={14} color="#3a7d44" />
                        <Text style={s.diaHeaderText}>{dia}</Text>
                      </View>
                      {bloqueiosPorDia[dia].map((b) => (
                        <BloqueioItem key={b.id} b={b} onDelete={handleDeletar} />
                      ))}
                    </View>
                  )
                )}

                {semDia.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <View style={s.diaHeader}>
                      <Ionicons name="time-outline" size={14} color="#888" />
                      <Text style={[s.diaHeaderText, { color: "#888" }]}>Sem dia específico</Text>
                    </View>
                    {semDia.map((b) => (
                      <BloqueioItem key={b.id} b={b} onDelete={handleDeletar} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BloqueioItem({ b, onDelete }: { b: Bloqueio; onDelete: (id: string) => void }) {
  return (
    <View style={s.bloqueioCard}>
      <View style={s.bloqueioIconWrapper}>
        <Ionicons name="ban-outline" size={18} color="#ef4444" />
      </View>
      <View style={s.bloqueioInfo}>
        <Text style={s.bloqueioHorario}>{b.timeStart} – {b.timeEnd}</Text>
        {b.descricao ? <Text style={s.bloqueioDesc}>{b.descricao}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(b.id)} style={s.deleteBtn} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#e8f5ea", borderRadius: 14, padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: "#2d6a4f", lineHeight: 19 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F0F0F0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginBottom: 14 },
  label: { fontSize: 12, color: "#666", marginBottom: 6, fontWeight: "600" },
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  diaChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent",
  },
  diaChipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  diaChipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  diaChipTextActive: { color: "#3a7d44" },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  timeSep: { paddingBottom: 12, alignItems: "center" },
  input: {
    backgroundColor: "#F7F9FC", borderRadius: 12, borderWidth: 1, borderColor: "#E8E8E8",
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: "#1a1a2e",
  },
  addBtn: {
    backgroundColor: "#3a7d44", borderRadius: 12, paddingVertical: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 12,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: "#999" },
  diaHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 8, marginTop: 4,
  },
  diaHeaderText: { fontSize: 12, fontWeight: "700", color: "#3a7d44", textTransform: "uppercase", letterSpacing: 0.5 },
  bloqueioCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFF5F5", borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#FFE4E4",
  },
  bloqueioIconWrapper: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFE4E4",
    alignItems: "center", justifyContent: "center",
  },
  bloqueioInfo: { flex: 1 },
  bloqueioHorario: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  bloqueioDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  deleteBtn: { padding: 6 },
});
