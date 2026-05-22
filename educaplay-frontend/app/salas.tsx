import { styles as s } from "@/styles/SalasStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/colors";
import api from "../src/services/api";

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

  const handleExcluir = (sala: Sala) => {
    Alert.alert("Excluir sala", `Deseja excluir "${sala.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/salas/${sala.id}`);
          setSalas((prev) => prev.filter((s) => s.id !== sala.id));
        } catch { Alert.alert("Erro", "Não foi possível excluir."); }
      }},
    ]);
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

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={fecharModal}>
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
      </Modal>
    </SafeAreaView>
  );
}
