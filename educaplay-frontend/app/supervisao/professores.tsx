import { styles as s } from "../../styles/ProfessoresStyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import api from "../../src/services/api";

type Professor = {
  id: string;
  nome: string;
  cargo?: string | null;
  foto?: string | null;
  materias?: string[];
};

type NovoProfessor = {
  nome: string;
  email: string;
  senha: string;
  materias: string[];
};

type Bloqueio = {
  id: string;
  diaSemana: string | null;
  timeStart: string;
  timeEnd: string;
  descricao: string | null;
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ProfessoresScreen() {
  const router = useRouter();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal de indisponibilidades
  const [modalVisivel, setModalVisivel] = useState(false);
  const [profSelecionado, setProfSelecionado] = useState<Professor | null>(null);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false);

  // Modal de confirmação de exclusão
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);
  const [fraseDigitada, setFraseDigitada] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  // Modal de cadastro de professor
  const [modalCadastroVisivel, setModalCadastroVisivel] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenhaVisivel, setNovaSenhaVisivel] = useState(false);
  const [novasMaterias, setNovasMaterias] = useState<string[]>([]);
  const [materiaInput, setMateriaInput] = useState("");
  const [cadastrando, setCadastrando] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [nomeProfCadastrado, setNomeProfCadastrado] = useState("");

  // Modal de edição de matérias
  const [modalEditarMaterias, setModalEditarMaterias] = useState(false);
  const [materiasEditadas, setMateriasEditadas] = useState<string[]>([]);
  const [materiaEditInput, setMateriaEditInput] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [modalConfirmarVisivel, setModalConfirmarVisivel] = useState(false);
  const [mensagemConfirmacao, setMensagemConfirmacao] = useState("");
  const [tituloConfirmacao, setTituloConfirmacao] = useState("");
  const confirmarAcao = React.useRef<() => void>(() => {});

  const abrirEditarMaterias = useCallback(() => {
    setMateriasEditadas(profSelecionado?.materias ?? []);
    setMateriaEditInput("");
    setModalEditarMaterias(true);
  }, [profSelecionado]);

  const fecharEditarMaterias = useCallback(() => {
    const original = profSelecionado?.materias ?? [];
    const mudou =
      materiasEditadas.length !== original.length ||
      materiasEditadas.some((m) => !original.includes(m));

    if (mudou) {
      setTituloConfirmacao("Descartar alterações?");
      setMensagemConfirmacao("Você tem alterações não salvas. Deseja descartá-las?");
      confirmarAcao.current = () => {
        setModalConfirmarVisivel(false);
        setModalEditarMaterias(false);
      };
      setModalConfirmarVisivel(true);
    } else {
      setModalEditarMaterias(false);
    }
  }, [profSelecionado, materiasEditadas]);

  const adicionarMateriaEdit = () => {
    const trimmed = materiaEditInput.trim();
    if (!trimmed) return;
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      Alert.alert("Matéria inválida", "O nome da matéria deve conter apenas letras.");
      return;
    }
    if (trimmed.length < 2) {
      Alert.alert("Matéria inválida", "O nome da matéria deve ter pelo menos 2 letras.");
      return;
    }
    if (materiasEditadas.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMateriaEditInput("");
      return;
    }
    setMateriasEditadas((prev) => [...prev, trimmed]);
    setMateriaEditInput("");
  };

  const removerMateriaEdit = (idx: number) => {
    setMateriasEditadas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSalvarMaterias = useCallback(() => {
    if (!profSelecionado) return;
    const original = profSelecionado.materias ?? [];
    const adicionadas = materiasEditadas.filter((m) => !original.includes(m));
    const removidas = original.filter((m) => !materiasEditadas.includes(m));

    let verbo = "alterar as matérias de";
    if (adicionadas.length > 0 && removidas.length === 0) verbo = "adicionar matérias a";
    else if (removidas.length > 0 && adicionadas.length === 0) verbo = "excluir matérias de";

    setTituloConfirmacao("Confirmar alteração");
    setMensagemConfirmacao(`Deseja realmente ${verbo} ${profSelecionado.nome}?`);
    confirmarAcao.current = async () => {
      setModalConfirmarVisivel(false);
      setSalvando(true);
      try {
        const res = await api.put(`/professores/${profSelecionado.id}/materias`, { materias: materiasEditadas });
        setProfessores((prev) =>
          prev.map((p) => p.id === profSelecionado.id ? { ...p, materias: res.data.materias } : p)
        );
        setProfSelecionado((prev) => prev ? { ...prev, materias: res.data.materias } : prev);
        setModalEditarMaterias(false);
      } catch {
        Alert.alert("Erro", "Não foi possível salvar as matérias. Tente novamente.");
      } finally {
        setSalvando(false);
      }
    };
    setModalConfirmarVisivel(true);
  }, [profSelecionado, materiasEditadas]);

  const abrirModalCadastro = useCallback(() => {
    setNovoNome("");
    setNovoEmail("");
    setNovaSenha("");
    setNovasMaterias([]);
    setMateriaInput("");
    setModalCadastroVisivel(true);
  }, []);

  const fecharModalCadastro = useCallback(() => {
    setModalCadastroVisivel(false);
  }, []);

  const adicionarMateria = () => {
    const trimmed = materiaInput.trim();
    if (!trimmed) return;
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      Alert.alert("Matéria inválida", "O nome da matéria deve conter apenas letras.");
      return;
    }
    if (trimmed.length < 2) {
      Alert.alert("Matéria inválida", "O nome da matéria deve ter pelo menos 2 letras.");
      return;
    }
    if (novasMaterias.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMateriaInput("");
      return;
    }
    setNovasMaterias((prev) => [...prev, trimmed]);
    setMateriaInput("");
  };

  const removerMateria = (idx: number) => {
    setNovasMaterias((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCadastrarProfessor = useCallback(async () => {
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      Alert.alert("Atenção", "Preencha nome, e-mail e senha.");
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCadastrando(true);
    try {
      const res = await api.post("/supervisao/professores", {
        nome: novoNome.trim(),
        email: novoEmail.trim().toLowerCase(),
        senha: novaSenha,
        materias: novasMaterias,
      });
      setProfessores((prev) => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
      fecharModalCadastro();
      setNomeProfCadastrado(res.data.nome);
      setModalSucessoVisivel(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (err?.response?.status === 409) {
        Alert.alert("E-mail já cadastrado", "Este e-mail já está em uso. Use outro.");
      } else {
        Alert.alert("Erro", msg || "Não foi possível cadastrar o professor.");
      }
    } finally {
      setCadastrando(false);
    }
  }, [novoNome, novoEmail, novaSenha, novasMaterias, fecharModalCadastro]);

  const FRASE_CONFIRMACAO = "excluir professor";

  useEffect(() => {
    api.get("/supervisao/professores")
      .then((res) => setProfessores(res.data))
      .catch(() => Alert.alert("Erro", "Não foi possível carregar os professores."))
      .finally(() => setCarregando(false));
  }, []);

  const abrirModal = useCallback(async (prof: Professor) => {
    setProfSelecionado(prof);
    setModalVisivel(true);
    setCarregandoBloqueios(true);
    try {
      const res = await api.get(`/bloqueios/professor/${prof.id}`);
      setBloqueios(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os horários de indisponibilidade.");
      setBloqueios([]);
    } finally {
      setCarregandoBloqueios(false);
    }
  }, []);

  const fecharModal = useCallback(() => {
    setModalVisivel(false);
    setProfSelecionado(null);
    setBloqueios([]);
  }, []);

  const abrirModalExcluir = useCallback(() => {
    setFraseDigitada("");
    setModalExcluirVisivel(true);
  }, []);

  const fecharModalExcluir = useCallback(() => {
    setModalExcluirVisivel(false);
    setFraseDigitada("");
  }, []);

  const handleExcluirProfessor = useCallback(async () => {
    if (!profSelecionado) return;
    setExcluindo(true);
    try {
      await api.delete(`/professores/${profSelecionado.id}`);
      setProfessores((prev) => prev.filter((p) => p.id !== profSelecionado.id));
      fecharModalExcluir();
      fecharModal();
      Alert.alert("Sucesso", `A conta de ${profSelecionado.nome} foi excluída.`);
    } catch {
      Alert.alert("Erro", "Não foi possível excluir o professor. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  }, [profSelecionado, fecharModal, fecharModalExcluir]);

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
        <Text style={s.headerTitle}>Professores</Text>
        <TouchableOpacity style={cad.headerBtn} onPress={abrirModalCadastro} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={cad.headerBtnText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.counter}>
            {professores.length} {professores.length === 1 ? "professor cadastrado" : "professores cadastrados"}
          </Text>

          {professores.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>Nenhum professor cadastrado</Text>
              <Text style={s.emptySubtitle}>
                Os professores aparecerão aqui{"\n"}conforme se cadastrarem no aplicativo.
              </Text>
            </View>
          ) : (
            professores.map((prof) => (
              <TouchableOpacity
                key={prof.id}
                style={s.professorCard}
                onPress={() => abrirModal(prof)}
                activeOpacity={0.75}
              >
                <View style={s.professorAvatar}>
                  {prof.foto ? (
                    <Image source={{ uri: prof.foto }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person-circle-outline" size={48} color="#bbb" />
                  )}
                </View>
                <View style={s.professorInfo}>
                  <Text style={s.professorNome}>{prof.nome}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Ionicons name="person-outline" size={12} color="#7a7f9a" />
                    <Text style={{ fontSize: 12, color: "#7a7f9a", fontWeight: "600" }}>Professor</Text>
                  </View>
                  {(prof.materias ?? []).length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                      {(prof.materias ?? []).map((m, i) => (
                        <View key={i} style={pc.chip}>
                          <Ionicons name="book-outline" size={10} color="#3a7d44" />
                          <Text style={pc.chipText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal de indisponibilidades */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={fecharModal}
      >
        <View style={m.overlay}>
          <View style={m.sheet}>
            {/* Handle */}
            <View style={m.handle} />

            {/* Header */}
            <View style={m.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={m.sheetTitle}>{profSelecionado?.nome}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Ionicons name="person-outline" size={12} color="#7a7f9a" />
                  <Text style={{ fontSize: 12, color: "#7a7f9a", fontWeight: "600" }}>Professor</Text>
                </View>
                {(profSelecionado?.materias ?? []).length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5, marginBottom: 2 }}>
                    {(profSelecionado?.materias ?? []).map((mat, i) => (
                      <View key={i} style={pc.chip}>
                        <Ionicons name="book-outline" size={10} color="#3a7d44" />
                        <Text style={pc.chipText}>{mat}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={m.sheetSubtitle}>Horários de indisponibilidade</Text>
              </View>
              <TouchableOpacity onPress={fecharModal} style={m.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#1a1a2e" />
              </TouchableOpacity>
            </View>

            <ScrollView style={m.sheetScroll} contentContainerStyle={m.sheetScrollContent} showsVerticalScrollIndicator={false}>
              {carregandoBloqueios ? (
                <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#3a7d44" />
              ) : bloqueios.length === 0 ? (
                <View style={m.empty}>
                  <Ionicons name="calendar-outline" size={40} color="#ccc" />
                  <Text style={m.emptyText}>Nenhum bloqueio cadastrado.</Text>
                  <Text style={m.emptySubText}>Este professor não tem horários de indisponibilidade registrados.</Text>
                </View>
              ) : (
                <>
                  {DIAS.map((dia) =>
                    bloqueiosPorDia[dia].length === 0 ? null : (
                      <View key={dia} style={{ marginBottom: 12 }}>
                        <View style={m.diaHeader}>
                          <Ionicons name="calendar-outline" size={14} color="#3a7d44" />
                          <Text style={m.diaHeaderText}>{dia}</Text>
                        </View>
                        {bloqueiosPorDia[dia].map((b) => (
                          <BloqueioRow key={b.id} b={b} />
                        ))}
                      </View>
                    )
                  )}
                  {semDia.length > 0 && (
                    <View style={{ marginBottom: 4 }}>
                      <View style={m.diaHeader}>
                        <Ionicons name="time-outline" size={14} color="#888" />
                        <Text style={[m.diaHeaderText, { color: "#888" }]}>Sem dia específico</Text>
                      </View>
                      {semDia.map((b) => (
                        <BloqueioRow key={b.id} b={b} />
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Botão editar matérias */}
            <TouchableOpacity style={m.editarBtn} onPress={abrirEditarMaterias} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={18} color="#3a7d44" />
              <Text style={m.editarBtnText}>Editar Matérias</Text>
            </TouchableOpacity>

            {/* Botão excluir professor */}
            <TouchableOpacity style={m.excluirBtn} onPress={abrirModalExcluir} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={m.excluirBtnText}>Excluir Professor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de cadastro de professor */}
      <Modal
        visible={modalCadastroVisivel}
        animationType="slide"
        transparent
        onRequestClose={fecharModalCadastro}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "padding"}>
          <View style={cad.overlay}>
            <View style={cad.sheet}>
              <View style={m.handle} />
              <View style={cad.sheetHeader}>
                <Text style={cad.sheetTitle}>Cadastrar Professor</Text>
                <TouchableOpacity onPress={fecharModalCadastro} style={m.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color="#1a1a2e" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={cad.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Nome */}
                <View style={cad.inputRow}>
                  <Ionicons name="person-outline" size={18} color="#888" style={cad.inputIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={cad.inputLabel}>Nome completo *</Text>
                    <TextInput
                      style={cad.textInput}
                      placeholder="Nome do professor"
                      placeholderTextColor="#bbb"
                      value={novoNome}
                      onChangeText={setNovoNome}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* E-mail */}
                <View style={cad.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#888" style={cad.inputIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={cad.inputLabel}>E-mail *</Text>
                    <TextInput
                      style={cad.textInput}
                      placeholder="E-mail do professor"
                      placeholderTextColor="#bbb"
                      value={novoEmail}
                      onChangeText={setNovoEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Senha */}
                <View style={cad.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#888" style={cad.inputIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={cad.inputLabel}>Senha *</Text>
                    <TextInput
                      style={cad.textInput}
                      placeholder="Senha de acesso do professor"
                      placeholderTextColor="#bbb"
                      value={novaSenha}
                      onChangeText={setNovaSenha}
                      secureTextEntry={!novaSenhaVisivel}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity onPress={() => setNovaSenhaVisivel(!novaSenhaVisivel)}>
                    <Ionicons name={novaSenhaVisivel ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                {/* Matérias */}
                <Text style={cad.materiaLabel}>Matérias que leciona</Text>
                {novasMaterias.length > 0 && (
                  <View style={cad.chipsRow}>
                    {novasMaterias.map((mat, idx) => (
                      <View key={idx} style={pc.chip}>
                        <Ionicons name="book-outline" size={10} color="#3a7d44" />
                        <Text style={pc.chipText}>{mat}</Text>
                        <TouchableOpacity onPress={() => removerMateria(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close" size={13} color="#2d6a4f" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={cad.addRow}>
                  <View style={[cad.inputRow, { flex: 1, marginBottom: 0 }]}>
                    <Ionicons name="book-outline" size={18} color="#888" style={cad.inputIcon} />
                    <TextInput
                      style={[cad.textInput, { flex: 1 }]}
                      placeholder="Ex: Matemática, Português..."
                      placeholderTextColor="#bbb"
                      value={materiaInput}
                      onChangeText={setMateriaInput}
                      autoCapitalize="words"
                      onSubmitEditing={adicionarMateria}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity style={cad.addBtn} onPress={adicionarMateria} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={cad.materiaHint}>Adicione uma de cada vez. Toque + ou pressione "concluir".</Text>

                <TouchableOpacity
                  style={[cad.confirmarBtn, cadastrando && { opacity: 0.7 }]}
                  onPress={handleCadastrarProfessor}
                  activeOpacity={0.85}
                  disabled={cadastrando}
                >
                  {cadastrando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={cad.confirmarBtnText}>Cadastrar Professor</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de edição de matérias */}
      <Modal visible={modalEditarMaterias} animationType="slide" transparent onRequestClose={fecharEditarMaterias}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "padding"}>
          <View style={cad.overlay}>
            <View style={[cad.sheet, { height: "75%" }]}>
              <View style={m.handle} />
              <View style={cad.sheetHeader}>
                <View>
                  <Text style={cad.sheetTitle}>Editar Matérias</Text>
                  <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{profSelecionado?.nome}</Text>
                </View>
                <TouchableOpacity onPress={fecharEditarMaterias} style={m.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color="#1a1a2e" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={cad.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {materiasEditadas.length > 0 ? (
                  <View style={cad.chipsRow}>
                    {materiasEditadas.map((mat, idx) => (
                      <View key={idx} style={pc.chip}>
                        <Ionicons name="book-outline" size={10} color="#3a7d44" />
                        <Text style={pc.chipText}>{mat}</Text>
                        <TouchableOpacity onPress={() => removerMateriaEdit(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close" size={13} color="#2d6a4f" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>Nenhuma matéria adicionada.</Text>
                )}

                <View style={cad.addRow}>
                  <View style={[cad.inputRow, { flex: 1, marginBottom: 0 }]}>
                    <Ionicons name="book-outline" size={18} color="#888" style={cad.inputIcon} />
                    <TextInput
                      style={[cad.textInput, { flex: 1 }]}
                      placeholder="Ex: Matemática, Português..."
                      placeholderTextColor="#bbb"
                      value={materiaEditInput}
                      onChangeText={setMateriaEditInput}
                      autoCapitalize="words"
                      onSubmitEditing={adicionarMateriaEdit}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity style={cad.addBtn} onPress={adicionarMateriaEdit} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={cad.materiaHint}>Toque no X para remover. Toque + para adicionar.</Text>

                <TouchableOpacity
                  style={[cad.confirmarBtn, salvando && { opacity: 0.7 }]}
                  onPress={handleSalvarMaterias}
                  activeOpacity={0.85}
                  disabled={salvando}
                >
                  {salvando ? <ActivityIndicator color="#fff" /> : <Text style={cad.confirmarBtnText}>Salvar Matérias</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de confirmação de alteração de matérias */}
      <Modal visible={modalConfirmarVisivel} transparent animationType="fade" onRequestClose={() => setModalConfirmarVisivel(false)}>
        <View style={conf.overlay}>
          <View style={conf.box}>
            <View style={conf.iconCircle}>
              <Ionicons name="create-outline" size={34} color="#fff" />
            </View>
            <Text style={conf.titulo}>{tituloConfirmacao}</Text>
            <Text style={conf.mensagem}>{mensagemConfirmacao}</Text>
            <View style={conf.botoesRow}>
              <TouchableOpacity style={conf.cancelarBtn} onPress={() => setModalConfirmarVisivel(false)} activeOpacity={0.8}>
                <Text style={conf.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={conf.confirmarBtn} onPress={() => confirmarAcao.current()} activeOpacity={0.85}>
                <Text style={conf.confirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sucesso ao cadastrar professor */}
      <Modal visible={modalSucessoVisivel} transparent animationType="fade" onRequestClose={() => setModalSucessoVisivel(false)}>
        <View style={suc.overlay}>
          <View style={suc.box}>
            <View style={suc.iconCircle}>
              <Ionicons name="checkmark" size={38} color="#fff" />
            </View>
            <Text style={suc.titulo}>Professor cadastrado!</Text>
            <Text style={suc.descricao}>
              <Text style={suc.nome}>{nomeProfCadastrado}</Text>
              {"\n"}foi adicionado com sucesso.
            </Text>
            <TouchableOpacity style={suc.btn} onPress={() => setModalSucessoVisivel(false)} activeOpacity={0.85}>
              <Text style={suc.btnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={modalExcluirVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModalExcluir}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <View style={ex.overlay}>
            <View style={ex.box}>
              {/* Ícone de aviso */}
              <View style={ex.iconWrap}>
                <Ionicons name="warning-outline" size={32} color="#ef4444" />
              </View>

              <Text style={ex.titulo}>Excluir Professor</Text>
              <Text style={ex.descricao}>
                Você está prestes a excluir permanentemente a conta de{" "}
                <Text style={{ fontWeight: "700", color: "#1a1a2e" }}>
                  {profSelecionado?.nome}
                </Text>
                .{"\n"}Esta ação não pode ser desfeita.
              </Text>

              {/* Instrução de confirmação */}
              <View style={ex.instrucaoBox}>
                <Text style={ex.instrucaoLabel}>Para confirmar, digite exatamente:</Text>
                <Text style={ex.instrucaoFrase}>"excluir professor"</Text>
              </View>

              <TextInput
                style={ex.input}
                placeholder="excluir professor"
                placeholderTextColor="#bbb"
                value={fraseDigitada}
                onChangeText={setFraseDigitada}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Botões */}
              <View style={ex.botoesRow}>
                <TouchableOpacity
                  style={ex.cancelarBtn}
                  onPress={fecharModalExcluir}
                  activeOpacity={0.8}
                  disabled={excluindo}
                >
                  <Text style={ex.cancelarText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    ex.confirmarBtn,
                    fraseDigitada !== FRASE_CONFIRMACAO && ex.confirmarBtnDesativado,
                  ]}
                  onPress={handleExcluirProfessor}
                  activeOpacity={0.8}
                  disabled={fraseDigitada !== FRASE_CONFIRMACAO || excluindo}
                >
                  {excluindo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={ex.confirmarText}>Excluir</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function BloqueioRow({ b }: { b: Bloqueio }) {
  return (
    <View style={m.bloqueioCard}>
      <View style={m.bloqueioIconWrap}>
        <Ionicons name="ban-outline" size={16} color="#ef4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={m.bloqueioHorario}>{b.timeStart} – {b.timeEnd}</Text>
        {b.descricao ? <Text style={m.bloqueioDesc}>{b.descricao}</Text> : null}
      </View>
    </View>
  );
}

const conf = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#3a7d44",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 10,
    textAlign: "center",
  },
  mensagem: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  botoesRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  cancelarText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  confirmarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    shadowColor: "#3a7d44",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  confirmarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

const suc = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#3a7d44",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 10,
    textAlign: "center",
  },
  descricao: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  nome: {
    fontWeight: "700",
    color: "#1a1a2e",
  },
  btn: {
    width: "100%",
    backgroundColor: "#3a7d44",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#3a7d44",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

const cad = StyleSheet.create({
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3a7d44",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingTop: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    marginBottom: 2,
  },
  textInput: {
    fontSize: 14,
    color: "#1a1a2e",
    padding: 0,
  },
  materiaLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  addBtn: {
    backgroundColor: "#3a7d44",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  materiaHint: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 20,
  },
  confirmarBtn: {
    backgroundColor: "#3a7d44",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmarBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

const pc = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#e8f5ea",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    color: "#3a7d44",
    fontWeight: "600",
  },
});

const ex = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 10,
    textAlign: "center",
  },
  descricao: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  instrucaoBox: {
    width: "100%",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
  },
  instrucaoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  instrucaoFrase: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
    letterSpacing: 0.3,
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  botoesRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  cancelarText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  confirmarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  confirmarBtnDesativado: {
    backgroundColor: "#FECACA",
  },
  confirmarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "75%",
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  sheetSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sheetScroll: { flex: 1, minHeight: 0 },
  sheetScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#999" },
  emptySubText: { fontSize: 13, color: "#bbb", textAlign: "center" },
  diaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  diaHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3a7d44",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bloqueioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE4E4",
  },
  bloqueioIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFE4E4",
    alignItems: "center",
    justifyContent: "center",
  },
  bloqueioHorario: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  bloqueioDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  editarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#b7dfbe",
    backgroundColor: "#f0faf2",
  },
  editarBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3a7d44",
  },
  excluirBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  excluirBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
});
