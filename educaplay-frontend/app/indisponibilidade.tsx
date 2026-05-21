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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/services/api";

type Bloqueio = {
  id: string;
  timeStart: string;
  timeEnd: string;
  descricao: string | null;
};

export default function IndisponibilidadeScreen() {
  const router = useRouter();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
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
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        descricao: descricao.trim() || null,
      });
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
    Alert.alert(
      "Remover bloqueio",
      "Deseja remover este horário de indisponibilidade?",
      [
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
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Minha Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Explicação */}
          <View style={s.infoBanner}>
            <Text style={{ fontSize: 24 }}>🏫</Text>
            <Text style={s.infoText}>
              Registre os horários em que você está em outra escola. A supervisão será avisada
              caso tente te alocar neste período.
            </Text>
          </View>

          {/* Formulário */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Adicionar indisponibilidade</Text>

            <Text style={s.label}>Horário de início</Text>
            <TextInput
              style={s.input}
              value={timeStart}
              onChangeText={setTimeStart}
              placeholder="Ex: 07:00"
              placeholderTextColor="#AAAAAA"
            />

            <Text style={s.label}>Horário de término</Text>
            <TextInput
              style={s.input}
              value={timeEnd}
              onChangeText={setTimeEnd}
              placeholder="Ex: 09:00"
              placeholderTextColor="#AAAAAA"
            />

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
              <Text style={s.addBtnText}>{salvando ? "Salvando..." : "+ Adicionar"}</Text>
            </TouchableOpacity>
          </View>

          {/* Lista */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Meus bloqueios</Text>
            {bloqueios.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 36 }}>📭</Text>
                <Text style={s.emptyText}>Nenhum bloqueio cadastrado.</Text>
              </View>
            ) : (
              bloqueios.map((b) => (
                <View key={b.id} style={s.bloqueioCard}>
                  <View style={s.bloqueioInfo}>
                    <Text style={s.bloqueioHorario}>
                      {b.timeStart} – {b.timeEnd}
                    </Text>
                    {b.descricao ? (
                      <Text style={s.bloqueioDesc}>{b.descricao}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDeletar(b.id)} style={s.deleteBtn}>
                    <Text style={s.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  scroll: { padding: 20, paddingBottom: 40 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#e8f5ea",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: "#2d6a4f", lineHeight: 19 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  label: { fontSize: 13, color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: "#3a7d44",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: "#999" },
  bloqueioCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  bloqueioInfo: { flex: 1 },
  bloqueioHorario: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  bloqueioDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 20 },
});
