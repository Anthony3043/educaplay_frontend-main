import { styles as s } from "@/styles/SalasStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/colors";
import api from "../../src/services/api";

type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };

export default function SalasScreen() {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Sala | null>(null);
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [nomeFocused, setNomeFocused] = useState(false);
  const [turmaFocused, setTurmaFocused] = useState(false);
  const [capFocused, setCapFocused] = useState(false);
  const [salaParaExcluir, setSalaParaExcluir] = useState<Sala | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const res = await api.get("/salas");
      setSalas(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as salas.");
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNova = () => { setEditando(null); setNome(""); setTurma(""); setCapacidade(""); setModalVisible(true); };
  const abrirModalEditar = (sala: Sala) => { setEditando(sala); setNome(sala.nome); setTurma(sala.turma || ""); setCapacidade(sala.capacidade || ""); setModalVisible(true); };
  const fecharModal = () => { setModalVisible(false); setEditando(null); setNome(""); setTurma(""); setCapacidade(""); };

  const handleSalvar = async () => {
    if (!nome.trim()) { Alert.alert("Atenção", "Informe o nome da sala."); return; }
    setSalvando(true);
    try {
      if (editando) {
        const res = await api.put(`/salas/${editando.id}`, { nome: nome.trim(), turma: turma.trim() || null, capacidade: capacidade.trim() || null });
        setSalas((prev) => prev.map((s) => s.id === editando.id ? res.data : s));
      } else {
        const res = await api.post("/salas", { nome: nome.trim(), turma: turma.trim() || null, capacidade: capacidade.trim() || null });
        setSalas((prev) => [...prev, res.data]);
      }
      fecharModal();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a sala.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = (sala: Sala) => { setConfirmText(""); setSalaParaExcluir(sala); };

  const confirmarExclusao = async () => {
    if (!salaParaExcluir) return;
    setExcluindo(true);
    try {
      // 1. Busca todos os cronogramas para encontrar aulas vinculadas a esta sala
      const resCronogramas = await api.get("/cronogramas");
      const aulasIds: string[] = [];
      for (const cron of resCronogramas.data) {
        for (const aula of cron.aulas) {
          if (aula.sala?.id === salaParaExcluir.id) {
            aulasIds.push(aula.id);
          }
        }
      }
      // 2. Exclui todas as aulas da sala em paralelo (falhas individuais são ignoradas)
      if (aulasIds.length > 0) {
        await Promise.allSettled(aulasIds.map((id) => api.delete(`/aulas/${id}`)));
      }
      // 3. Exclui a sala
      await api.delete(`/salas/${salaParaExcluir.id}`);
      setSalas((prev) => prev.filter((s) => s.id !== salaParaExcluir.id));
      setSalaParaExcluir(null);
      setConfirmText("");
    } catch {
      Alert.alert("Erro", "Não foi possível excluir a sala.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Salas</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirModalNova}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.counter}>{salas.length} {salas.length === 1 ? "sala cadastrada" : "salas cadastradas"}</Text>
          {salas.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="grid-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>Nenhuma sala cadastrada</Text>
              <Text style={s.emptySubtitle}>Toque no botão ＋ para{"\n"}adicionar a primeira sala.</Text>
            </View>
          ) : (
            salas.map((sala) => (
              <View key={sala.id} style={s.salaCard}>
                <View style={s.salaIconWrapper}><Ionicons name="grid-outline" size={22} color={Colors.primary} /></View>
                <View style={s.salaInfo}>
                  <Text style={s.salaNome}>
                    {sala.nome}{sala.turma ? ` — ${sala.turma}` : ""}
                  </Text>
                  {sala.capacidade ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                      <Text style={s.salaCapacidade}>{sala.capacidade}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.salaActions}>
                  <TouchableOpacity style={[s.actionBtn, s.editBtn]} onPress={() => abrirModalEditar(sala)} activeOpacity={0.75}>
                    <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => handleExcluir(sala)} activeOpacity={0.75}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={!!salaParaExcluir}
        transparent
        animationType="fade"
        onRequestClose={() => { setSalaParaExcluir(null); setConfirmText(""); }}
      >
        <View style={del.overlay}>
          <View style={del.card}>
            <View style={del.iconCircle}>
              <Ionicons name="trash-outline" size={30} color="#DC2626" />
            </View>
            <Text style={del.title}>Excluir Sala</Text>
            <Text style={del.msg}>
              Para confirmar, digite exatamente:{"\n"}
              <Text style={del.nomeSala}>
                Excluir sala {salaParaExcluir?.nome}{salaParaExcluir?.turma ? ` — ${salaParaExcluir.turma}` : ""}
              </Text>
            </Text>
            <Text style={del.aviso}>Esta ação não pode ser desfeita.</Text>
            <TextInput
              style={[del.input, confirmText === `Excluir sala ${salaParaExcluir?.nome}${salaParaExcluir?.turma ? ` — ${salaParaExcluir.turma}` : ""}` && del.inputOk]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={`Excluir sala ${salaParaExcluir?.nome ?? ""}`}
              placeholderTextColor="#BBBBBB"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={del.btnRow}>
              <TouchableOpacity
                style={del.btnCancelar}
                onPress={() => { setSalaParaExcluir(null); setConfirmText(""); }}
                activeOpacity={0.8}
              >
                <Text style={del.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  del.btnExcluir,
                  confirmText !== `Excluir sala ${salaParaExcluir?.nome}${salaParaExcluir?.turma ? ` — ${salaParaExcluir.turma}` : ""}` && del.btnExcluirDisabled,
                ]}
                onPress={confirmarExclusao}
                disabled={excluindo || confirmText !== `Excluir sala ${salaParaExcluir?.nome}${salaParaExcluir?.turma ? ` — ${salaParaExcluir.turma}` : ""}`}
                activeOpacity={0.85}
              >
                {excluindo
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={del.btnExcluirText}>Excluir</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={fecharModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
        >
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={fecharModal}>
            <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>{editando ? "Editar Sala" : "Nova Sala"}</Text>
              <View>
                <Text style={s.modalLabel}>Nome da sala *</Text>
                <TextInput style={[s.modalInput, nomeFocused && s.modalInputFocused]} value={nome} onChangeText={setNome}
                  placeholder="Ex: Sala 01, Lab. de Ciências..." placeholderTextColor="#AAAAAA"
                  onFocus={() => setNomeFocused(true)} onBlur={() => setNomeFocused(false)} />
              </View>
              <View>
                <Text style={s.modalLabel}>Turma (opcional)</Text>
                <TextInput style={[s.modalInput, turmaFocused && s.modalInputFocused]} value={turma} onChangeText={setTurma}
                  placeholder="Ex: 3º A, 2º B, 1º Ano..." placeholderTextColor="#AAAAAA"
                  onFocus={() => setTurmaFocused(true)} onBlur={() => setTurmaFocused(false)} />
              </View>
              <View>
                <Text style={s.modalLabel}>Capacidade (opcional)</Text>
                <TextInput style={[s.modalInput, capFocused && s.modalInputFocused]} value={capacidade} onChangeText={setCapacidade}
                  placeholder="Ex: 35 alunos" placeholderTextColor="#AAAAAA"
                  onFocus={() => setCapFocused(true)} onBlur={() => setCapFocused(false)} />
              </View>
              <View style={s.modalRow}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={fecharModal}>
                  <Text style={s.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={handleSalvar} disabled={salvando}>
                  {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.modalSaveText}>{editando ? "Salvar" : "Criar"}</Text>}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const del = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    width: "100%",
    alignItems: "center",
    gap: 6,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 3,
    borderColor: "#FECACA",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
    marginBottom: 4,
  },
  msg: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    lineHeight: 22,
  },
  nomeSala: {
    fontWeight: "700",
    color: "#1a1a2e",
  },
  aviso: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  btnCancelarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555",
  },
  btnExcluir: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  btnExcluirDisabled: {
    backgroundColor: "#F0A0A0",
  },
  btnExcluirText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: "#1a1a2e",
    backgroundColor: "#FAFAFA",
    marginTop: 4,
  },
  inputOk: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
});
