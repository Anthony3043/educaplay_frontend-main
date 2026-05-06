import { styles as s } from "../styles/ProfessoresStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import api from "../src/services/api";

type Professor = { id: string; nome: string; materias: string[] };

export default function ProfessoresScreen() {
  const router = useRouter();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Professor | null>(null);
  const [nome, setNome] = useState("");
  const [materias, setMaterias] = useState<string[]>([]);
  const [materiaInput, setMateriaInput] = useState("");
  const [nomeFocused, setNomeFocused] = useState(false);
  const [materiaFocused, setMateriaFocused] = useState(false);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const res = await api.get("/professores");
      setProfessores(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os professores.");
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovo = () => { setEditando(null); setNome(""); setMaterias([]); setMateriaInput(""); setModalVisible(true); };
  const abrirModalEditar = (prof: Professor) => { setEditando(prof); setNome(prof.nome); setMaterias([...prof.materias]); setMateriaInput(""); setModalVisible(true); };
  const fecharModal = () => { setModalVisible(false); setEditando(null); setNome(""); setMaterias([]); setMateriaInput(""); };

  const adicionarMateria = () => {
    const mat = materiaInput.trim();
    if (!mat) return;
    if (materias.includes(mat)) { Alert.alert("Atenção", "Esta matéria já foi adicionada."); return; }
    setMaterias((prev) => [...prev, mat]);
    setMateriaInput("");
  };

  const handleSalvar = async () => {
    if (!nome.trim()) { Alert.alert("Atenção", "Informe o nome do professor."); return; }
    if (materias.length === 0) { Alert.alert("Atenção", "Adicione pelo menos uma matéria."); return; }
    setSalvando(true);
    try {
      if (editando) {
        const res = await api.put(`/professores/${editando.id}`, { nome: nome.trim(), materias });
        setProfessores((prev) => prev.map((p) => p.id === editando.id ? res.data : p));
      } else {
        const res = await api.post("/professores", { nome: nome.trim(), materias });
        setProfessores((prev) => [...prev, res.data]);
      }
      fecharModal();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o professor.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = (prof: Professor) => {
    Alert.alert("Excluir professor", `Deseja excluir "${prof.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/professores/${prof.id}`);
          setProfessores((prev) => prev.filter((p) => p.id !== prof.id));
        } catch { Alert.alert("Erro", "Não foi possível excluir."); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Professores</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirModalNovo}>
          <Text style={s.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.counter}>{professores.length} {professores.length === 1 ? "professor cadastrado" : "professores cadastrados"}</Text>
          {professores.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTitle}>Nenhum professor cadastrado</Text>
              <Text style={s.emptySubtitle}>Toque no botão ＋ para{"\n"}adicionar o primeiro professor.</Text>
            </View>
          ) : (
            professores.map((prof) => (
              <View key={prof.id} style={s.professorCard}>
                <View style={s.professorAvatar}><Text style={s.professorAvatarText}>👨🏫</Text></View>
                <View style={s.professorInfo}>
                  <Text style={s.professorNome}>{prof.nome}</Text>
                  <View style={s.materiasRow}>
                    {prof.materias.map((mat) => (
                      <View key={mat} style={s.materiaTag}><Text style={s.materiaTagText}>{mat}</Text></View>
                    ))}
                  </View>
                </View>
                <View style={s.professorActions}>
                  <TouchableOpacity style={[s.actionBtn, s.editBtn]} onPress={() => abrirModalEditar(prof)} activeOpacity={0.75}>
                    <Text style={s.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => handleExcluir(prof)} activeOpacity={0.75}>
                    <Text style={s.actionBtnText}>🗑️</Text>
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
            <Text style={s.modalTitle}>{editando ? "Editar Professor" : "Novo Professor"}</Text>
            <View>
              <Text style={s.modalLabel}>Nome do professor *</Text>
              <TextInput style={[s.modalInput, nomeFocused && s.modalInputFocused]} value={nome} onChangeText={setNome}
                placeholder="Ex: Prof. Ricardo" placeholderTextColor="#AAAAAA"
                onFocus={() => setNomeFocused(true)} onBlur={() => setNomeFocused(false)} />
            </View>
            <View>
              <Text style={s.modalLabel}>Matérias *</Text>
              {materias.length > 0 && (
                <View style={s.materiasRow}>
                  {materias.map((mat) => (
                    <TouchableOpacity key={mat} style={s.materiaTag} onPress={() => setMaterias((prev) => prev.filter((m) => m !== mat))} activeOpacity={0.7}>
                      <Text style={s.materiaTagText}>{mat}<Text style={s.materiaTagRemove}> ✕</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={s.addMateriaRow}>
                <TextInput style={[s.addMateriaInput, materiaFocused && s.modalInputFocused]} value={materiaInput} onChangeText={setMateriaInput}
                  placeholder="Ex: Matemática" placeholderTextColor="#AAAAAA"
                  onFocus={() => setMateriaFocused(true)} onBlur={() => setMateriaFocused(false)}
                  onSubmitEditing={adicionarMateria} returnKeyType="done" />
                <TouchableOpacity style={s.addMateriaBtn} onPress={adicionarMateria} activeOpacity={0.8}>
                  <Text style={s.addMateriaBtnText}>＋</Text>
                </TouchableOpacity>
              </View>
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
