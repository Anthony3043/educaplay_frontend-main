import { styles as s } from "@/styles/salasStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// =============================================================
//  Quando o backend existir, substitua:
//    - SALAS_MOCK         →  GET  /api/salas
//    - handleSalvar()     →  POST /api/salas  ou  PUT /api/salas/:id
//    - handleExcluir()    →  DELETE /api/salas/:id
// =============================================================

type Sala = {
  id: string;
  nome: string;
  capacidade: string;
};

const SALAS_MOCK: Sala[] = [
  { id: "s1", nome: "Sala 01", capacidade: "35 alunos" },
  { id: "s2", nome: "Sala 02", capacidade: "35 alunos" },
  { id: "s3", nome: "Laboratório de Ciências", capacidade: "20 alunos" },
  { id: "s4", nome: "Sala de Informática", capacidade: "25 alunos" },
];

export default function SalasScreen() {
  const router = useRouter();

  const [salas, setSalas] = useState<Sala[]>(SALAS_MOCK);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Sala | null>(null);
  const [nomeFocused, setNomeFocused] = useState(false);
  const [capFocused, setCapFocused] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [capacidade, setCapacidade] = useState("");

  const abrirModalNova = () => {
    setEditando(null);
    setNome("");
    setCapacidade("");
    setModalVisible(true);
  };

  const abrirModalEditar = (sala: Sala) => {
    setEditando(sala);
    setNome(sala.nome);
    setCapacidade(sala.capacidade);
    setModalVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
    setEditando(null);
    setNome("");
    setCapacidade("");
  };

  const handleSalvar = () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome da sala.");
      return;
    }

    if (editando) {
      // TODO (backend): PUT /api/salas/:editando.id
      setSalas((prev) =>
        prev.map((s) =>
          s.id === editando.id
            ? { ...s, nome: nome.trim(), capacidade: capacidade.trim() }
            : s
        )
      );
    } else {
      // TODO (backend): POST /api/salas
      const nova: Sala = {
        id: `s${Date.now()}`,
        nome: nome.trim(),
        capacidade: capacidade.trim() || "—",
      };
      setSalas((prev) => [...prev, nova]);
    }

    fecharModal();
  };

  const handleExcluir = (sala: Sala) => {
    Alert.alert(
      "Excluir sala",
      `Deseja excluir "${sala.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            // TODO (backend): DELETE /api/salas/:sala.id
            setSalas((prev) => prev.filter((s) => s.id !== sala.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Salas</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirModalNova}>
          <Text style={s.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.counter}>
          {salas.length} {salas.length === 1 ? "sala cadastrada" : "salas cadastradas"}
        </Text>

        {salas.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🚪</Text>
            <Text style={s.emptyTitle}>Nenhuma sala cadastrada</Text>
            <Text style={s.emptySubtitle}>
              Toque no botão ＋ para{"\n"}adicionar a primeira sala.
            </Text>
          </View>
        ) : (
          salas.map((sala) => (
            <View key={sala.id} style={s.salaCard}>
              <View style={s.salaIconWrapper}>
                <Text style={s.salaIcon}>🚪</Text>
              </View>

              <View style={s.salaInfo}>
                <Text style={s.salaNome}>{sala.nome}</Text>
                {sala.capacidade !== "—" && (
                  <Text style={s.salaCapacidade}>👥 {sala.capacidade}</Text>
                )}
              </View>

              <View style={s.salaActions}>
                <TouchableOpacity
                  style={[s.actionBtn, s.editBtn]}
                  onPress={() => abrirModalEditar(sala)}
                  activeOpacity={0.75}
                >
                  <Text style={s.actionBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, s.deleteBtn]}
                  onPress={() => handleExcluir(sala)}
                  activeOpacity={0.75}
                >
                  <Text style={s.actionBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal criar / editar */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={fecharModal}
        >
          <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {editando ? "Editar Sala" : "Nova Sala"}
            </Text>

            {/* Nome */}
            <View>
              <Text style={s.modalLabel}>Nome da sala *</Text>
              <TextInput
                style={[s.modalInput, nomeFocused && s.modalInputFocused]}
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Sala 01, Lab. de Ciências..."
                placeholderTextColor="#AAAAAA"
                onFocus={() => setNomeFocused(true)}
                onBlur={() => setNomeFocused(false)}
              />
            </View>

            {/* Capacidade */}
            <View>
              <Text style={s.modalLabel}>Capacidade (opcional)</Text>
              <TextInput
                style={[s.modalInput, capFocused && s.modalInputFocused]}
                value={capacidade}
                onChangeText={setCapacidade}
                placeholder="Ex: 35 alunos"
                placeholderTextColor="#AAAAAA"
                keyboardType="default"
                onFocus={() => setCapFocused(true)}
                onBlur={() => setCapFocused(false)}
              />
            </View>

            {/* Botões */}
            <View style={s.modalRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={fecharModal}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={handleSalvar}>
                <Text style={s.modalSaveText}>
                  {editando ? "Salvar" : "Criar"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
