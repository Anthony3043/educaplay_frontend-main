import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useFocusEffect } from "expo-router";
import api from "../../src/services/api";
import { useAuth } from "../../context/AuthContext";

type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };
type Assento = { id: string; numero: number; nome: string | null };

const COLUNAS = 5;

export default function MapaSalaScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregandoSalas, setCarregandoSalas] = useState(true);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [assentos, setAssentos] = useState<Assento[]>([]);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const podeEditar = usuario?.papel === "Supervisao" || usuario?.podeEditarMapaSala === true;

  // Modal de edição de assento
  const [modalAssento, setModalAssento] = useState(false);
  const [assentoEditando, setAssentoEditando] = useState<Assento | null>(null);
  const [nomeInput, setNomeInput] = useState("");

  useFocusEffect(
    useCallback(() => {
      api.get("/salas")
        .then((res) => setSalas(res.data))
        .catch(() => Alert.alert("Erro", "Não foi possível carregar as salas."))
        .finally(() => setCarregandoSalas(false));
    }, [])
  );

  const carregarMapa = async (sala: Sala) => {
    setSalaSelecionada(sala);
    setCarregandoMapa(true);
    try {
      const res = await api.get(`/salas/${sala.id}/mapa`);
      setAssentos(res.data.assentos as Assento[]);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o mapa da sala.");
    } finally {
      setCarregandoMapa(false);
    }
  };

  const voltarParaLista = () => {
    setSalaSelecionada(null);
    setAssentos([]);
  };

  const abrirEdicaoAssento = (assento: Assento) => {
    if (!podeEditar) return;
    setAssentoEditando(assento);
    setNomeInput(assento.nome ?? "");
    setModalAssento(true);
  };

  const salvarNomeAssento = () => {
    if (!assentoEditando) return;
    const nome = nomeInput.trim() || null;
    setAssentos((prev) =>
      prev.map((a) => a.id === assentoEditando.id ? { ...a, nome } : a)
    );
    setModalAssento(false);
    setAssentoEditando(null);
    setNomeInput("");
  };

  const salvarMapa = async () => {
    if (!salaSelecionada) return;
    setSalvando(true);
    try {
      await api.put(`/salas/${salaSelecionada.id}/mapa`, { assentos });
      Alert.alert("Salvo", "Mapa de sala atualizado com sucesso!");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      Alert.alert("Erro", msg || "Não foi possível salvar o mapa.");
    } finally {
      setSalvando(false);
    }
  };

  const linhas = React.useMemo(() => {
    const rows: Assento[][] = [];
    for (let i = 0; i < assentos.length; i += COLUNAS) {
      rows.push(assentos.slice(i, i + COLUNAS));
    }
    return rows;
  }, [assentos]);

  // --- Tela de lista de salas ---
  if (!salaSelecionada) {
    return (
      <SafeAreaView style={st.container}>
        <StatusBar barStyle="dark-content" />
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={st.headerTitle}>Mapa de Sala</Text>
          <View style={{ width: 40 }} />
        </View>

        {carregandoSalas ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Text style={st.sectionLabel}>Selecione uma sala para ver o mapa de carteiras</Text>
            {salas.length === 0 ? (
              <View style={st.empty}>
                <Ionicons name="grid-outline" size={48} color="#ccc" />
                <Text style={st.emptyTitle}>Nenhuma sala cadastrada</Text>
              </View>
            ) : (
              salas.map((sala) => (
                <TouchableOpacity key={sala.id} style={st.salaCard} onPress={() => carregarMapa(sala)} activeOpacity={0.75}>
                  <View style={st.salaIcon}>
                    <Ionicons name="grid-outline" size={24} color="#3a7d44" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.salaNome}>{sala.nome}</Text>
                    {sala.turma ? <Text style={st.salaTurma}>{sala.turma}</Text> : null}
                    {sala.capacidade ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Ionicons name="people-outline" size={12} color="#aaa" />
                        <Text style={st.salaCapacidade}>{sala.capacidade}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // --- Tela do mapa ---
  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="dark-content" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={voltarParaLista}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={st.headerTitle} numberOfLines={1}>{salaSelecionada.nome}</Text>
          {salaSelecionada.turma ? <Text style={{ fontSize: 11, color: "#888" }}>{salaSelecionada.turma}</Text> : null}
        </View>
        {podeEditar ? (
          <TouchableOpacity style={st.salvarBtn} onPress={salvarMapa} disabled={salvando} activeOpacity={0.8}>
            {salvando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.salvarBtnText}>Salvar</Text>}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {carregandoMapa ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.mapaScroll} showsVerticalScrollIndicator={false}>
          {/* Legenda */}
          <View style={st.legendaRow}>
            <View style={st.legendaDot} />
            <Text style={st.legendaText}>Carteira com aluno</Text>
            <View style={[st.legendaDot, { backgroundColor: "#f0f0f0", borderColor: "#ddd" }]} />
            <Text style={st.legendaText}>Carteira vaga</Text>
          </View>

          {podeEditar && (
            <View style={st.dicaEditar}>
              <Ionicons name="information-circle-outline" size={14} color="#3a7d44" />
              <Text style={st.dicaEditarText}>Toque em uma carteira para atribuir ou remover um aluno</Text>
            </View>
          )}

          {/* Quadro negro */}
          <View style={st.quadroNegro}>
            <Text style={st.quadroNegroText}>QUADRO</Text>
          </View>

          {/* Grade de carteiras */}
          <View style={st.mapaGrid}>
            {linhas.map((linha, li) => (
              <View key={li} style={st.linhaRow}>
                {linha.map((assento) => (
                  <TouchableOpacity
                    key={assento.id}
                    style={[
                      st.assento,
                      assento.nome ? st.assentoOcupado : st.assentoVago,
                    ]}
                    onPress={() => abrirEdicaoAssento(assento)}
                    activeOpacity={podeEditar ? 0.7 : 1}
                  >
                    <Text style={[st.assentoNumero, assento.nome && st.assentoNumeroOcupado]}>
                      {assento.numero}
                    </Text>
                    <Text
                      style={[st.assentoNome, assento.nome ? st.assentoNomeOcupado : st.assentoNomeVago]}
                      numberOfLines={3}
                      adjustsFontSizeToFit
                      minimumFontSize={6}
                    >
                      {assento.nome ?? "—"}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* Preenche células vazias para alinhar a última linha */}
                {Array.from({ length: COLUNAS - linha.length }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={[st.assento, { borderColor: "transparent", backgroundColor: "transparent" }]} />
                ))}
              </View>
            ))}
          </View>

          <Text style={st.totalText}>
            {assentos.filter((a) => a.nome).length} de {assentos.length} carteiras ocupadas
          </Text>
        </ScrollView>
      )}

      {/* Modal de edição de assento */}
      <Modal visible={modalAssento} transparent animationType="fade" onRequestClose={() => setModalAssento(false)}>
        <View style={me.overlay}>
          <View style={me.box}>
            <Text style={me.titulo}>Carteira {assentoEditando?.numero}</Text>
            <Text style={me.label}>Nome do aluno</Text>
            <TextInput
              style={me.input}
              placeholder="Nome do aluno (deixe vazio para vaga)"
              placeholderTextColor="#bbb"
              value={nomeInput}
              onChangeText={setNomeInput}
              autoCapitalize="words"
              autoFocus
            />
            <View style={me.botoesRow}>
              <TouchableOpacity style={me.cancelarBtn} onPress={() => setModalAssento(false)} activeOpacity={0.8}>
                <Text style={me.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={me.confirmarBtn} onPress={salvarNomeAssento} activeOpacity={0.85}>
                <Text style={me.confirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            {assentoEditando?.nome ? (
              <TouchableOpacity style={me.limparBtn} onPress={() => { setNomeInput(""); salvarNomeAssento(); }} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={me.limparText}>Remover aluno desta carteira</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  salvarBtn: {
    backgroundColor: "#3a7d44", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 60, alignItems: "center",
  },
  salvarBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  sectionLabel: { fontSize: 13, color: "#888", marginBottom: 4 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#bbb" },
  salaCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#F0F0F0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  salaIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center",
  },
  salaNome: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  salaTurma: { fontSize: 12, color: "#888", marginTop: 1 },
  salaCapacidade: { fontSize: 12, color: "#aaa" },

  // Mapa
  mapaScroll: { padding: 16, paddingBottom: 40, alignItems: "center" },
  legendaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  legendaDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: "#3a7d44", borderWidth: 1, borderColor: "#2d6a4f" },
  legendaText: { fontSize: 11, color: "#888", marginRight: 8 },
  dicaEditar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e8f5ea", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    marginBottom: 12,
  },
  dicaEditarText: { fontSize: 11, color: "#3a7d44", flex: 1 },
  quadroNegro: {
    width: "80%", height: 32, backgroundColor: "#1a1a2e", borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  quadroNegroText: { fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 2 },
  mapaGrid: { width: "100%", gap: 8 },
  linhaRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  assento: {
    width: 58, minHeight: 68, borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, padding: 4,
  },
  assentoVago: { backgroundColor: "#f7f8fa", borderColor: "#E5E7EB" },
  assentoOcupado: { backgroundColor: "#e8f5ea", borderColor: "#86efac" },
  assentoNumero: { fontSize: 10, fontWeight: "700", color: "#bbb" },
  assentoNumeroOcupado: { color: "#3a7d44" },
  assentoNome: { fontSize: 9, textAlign: "center", marginTop: 2, lineHeight: 11 },
  assentoNomeVago: { color: "#ccc" },
  assentoNomeOcupado: { color: "#1a1a2e", fontWeight: "600" },
  totalText: { fontSize: 12, color: "#aaa", marginTop: 20 },
});

const me = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, gap: 4 },
  titulo: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  label: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1a1a2e",
    backgroundColor: "#FAFAFA", marginBottom: 16,
  },
  botoesRow: { flexDirection: "row", gap: 10 },
  cancelarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  cancelarText: { fontSize: 14, fontWeight: "600", color: "#555" },
  confirmarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#3a7d44", alignItems: "center" },
  confirmarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  limparBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  limparText: { fontSize: 13, color: "#ef4444" },
});
