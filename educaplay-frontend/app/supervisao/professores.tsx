import { styles as s } from "../../styles/ProfessoresStyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
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
  ativo: boolean;
  podeEditarMapaSala: boolean;
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

  // Modal de indisponibilidades / detalhe
  const [modalVisivel, setModalVisivel] = useState(false);
  const [profSelecionado, setProfSelecionado] = useState<Professor | null>(null);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false);

  // Modal de confirmação de desativação
  const [modalDesativarVisivel, setModalDesativarVisivel] = useState(false);
  const [desativando, setDesativando] = useState(false);

  // Modal de confirmação de reativação
  const [modalReativarVisivel, setModalReativarVisivel] = useState(false);
  const [reativando, setReativando] = useState(false);

  // Permissão de mapa
  const [atualizandoPermissao, setAtualizandoPermissao] = useState(false);

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

  // Modal de feedback (erros / avisos / sucesso simples)
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

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
      showInfo("Matéria inválida", "O nome da matéria deve conter apenas letras.", "aviso");
      return;
    }
    if (trimmed.length < 2) {
      showInfo("Matéria inválida", "O nome da matéria deve ter pelo menos 2 letras.", "aviso");
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
        showInfo("Erro", "Não foi possível salvar as matérias. Tente novamente.", "erro");
      } finally {
        setSalvando(false);
      }
    };
    setModalConfirmarVisivel(true);
  }, [profSelecionado, materiasEditadas]);

  const abrirModalCadastro = useCallback(() => {
    setNovoNome(""); setNovoEmail(""); setNovaSenha(""); setNovasMaterias([]); setMateriaInput("");
    setModalCadastroVisivel(true);
  }, []);

  const fecharModalCadastro = useCallback(() => { setModalCadastroVisivel(false); }, []);

  const adicionarMateria = () => {
    const trimmed = materiaInput.trim();
    if (!trimmed) return;
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      showInfo("Matéria inválida", "O nome da matéria deve conter apenas letras.", "aviso");
      return;
    }
    if (trimmed.length < 2) {
      showInfo("Matéria inválida", "O nome da matéria deve ter pelo menos 2 letras.", "aviso");
      return;
    }
    if (novasMaterias.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMateriaInput(""); return;
    }
    setNovasMaterias((prev) => [...prev, trimmed]);
    setMateriaInput("");
  };

  const removerMateria = (idx: number) => {
    setNovasMaterias((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCadastrarProfessor = useCallback(async () => {
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      showInfo("Atenção", "Preencha nome, e-mail e senha.", "aviso");
      return;
    }
    if (novaSenha.length < 6) {
      showInfo("Atenção", "A senha deve ter pelo menos 6 caracteres.", "aviso");
      return;
    }
    setCadastrando(true);
    try {
      const res = await api.post("/professores", {
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
      if (err?.response?.status === 409) {
        showInfo("E-mail já cadastrado", "Este e-mail já está em uso. Use outro.", "aviso");
      } else {
        showInfo("Erro", err?.response?.data?.error || "Não foi possível cadastrar o professor.", "erro");
      }
    } finally {
      setCadastrando(false);
    }
  }, [novoNome, novoEmail, novaSenha, novasMaterias, fecharModalCadastro]);

  useEffect(() => {
    api.get("/professores")
      .then((res) => setProfessores(res.data))
      .catch(() => showInfo("Erro", "Não foi possível carregar os professores.", "erro"))
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

  const handleDesativarProfessor = useCallback(async () => {
    if (!profSelecionado) return;
    setDesativando(true);
    try {
      await api.put(`/professores/${profSelecionado.id}/desativar`);
      setProfessores((prev) =>
        prev.map((p) => p.id === profSelecionado.id ? { ...p, ativo: false } : p)
      );
      setProfSelecionado((prev) => prev ? { ...prev, ativo: false } : prev);
      setModalDesativarVisivel(false);
      showInfo("Professor desativado", `${profSelecionado.nome} foi desativado. O acesso dele ao app foi bloqueado.`, "aviso");
    } catch {
      showInfo("Erro", "Não foi possível desativar o professor. Tente novamente.", "erro");
    } finally {
      setDesativando(false);
    }
  }, [profSelecionado]);

  const handleReativarProfessor = useCallback(async () => {
    if (!profSelecionado) return;
    setReativando(true);
    try {
      await api.put(`/professores/${profSelecionado.id}/reativar`);
      setProfessores((prev) =>
        prev.map((p) => p.id === profSelecionado.id ? { ...p, ativo: true } : p)
      );
      setProfSelecionado((prev) => prev ? { ...prev, ativo: true } : prev);
      setModalReativarVisivel(false);
      showInfo("Professor reativado", `${profSelecionado.nome} pode acessar o app novamente.`, "sucesso");
    } catch {
      showInfo("Erro", "Não foi possível reativar o professor. Tente novamente.", "erro");
    } finally {
      setReativando(false);
    }
  }, [profSelecionado]);

  const handleTogglePermissaoMapa = useCallback(async (valor: boolean) => {
    if (!profSelecionado) return;
    setAtualizandoPermissao(true);
    try {
      await api.put(`/professores/${profSelecionado.id}/permissao-mapa`, { podeEditarMapaSala: valor });
      setProfessores((prev) =>
        prev.map((p) => p.id === profSelecionado.id ? { ...p, podeEditarMapaSala: valor } : p)
      );
      setProfSelecionado((prev) => prev ? { ...prev, podeEditarMapaSala: valor } : prev);
    } catch {
      showInfo("Erro", "Não foi possível atualizar a permissão.", "erro");
    } finally {
      setAtualizandoPermissao(false);
    }
  }, [profSelecionado]);

  const bloqueiosPorDia = DIAS.reduce<Record<string, Bloqueio[]>>((acc, dia) => {
    acc[dia] = bloqueios.filter((b) => b.diaSemana === dia);
    return acc;
  }, {});
  const semDia = bloqueios.filter((b) => !b.diaSemana);

  const [mostrarInativos, setMostrarInativos] = useState(false);

  const ativos = professores.filter((p) => p.ativo);
  const inativos = professores.filter((p) => !p.ativo);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={s.counter}>
              {ativos.length} {ativos.length === 1 ? "professor ativo" : "professores ativos"}
            </Text>
            {inativos.length > 0 && (
              <TouchableOpacity
                style={[li.btnInativos, mostrarInativos && li.btnInativosAtivo]}
                onPress={() => setMostrarInativos((v) => !v)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={mostrarInativos ? "eye-off-outline" : "ban-outline"}
                  size={13}
                  color={mostrarInativos ? "#f97316" : "#aaa"}
                />
                <Text style={[li.btnInativosText, mostrarInativos && li.btnInativosTextAtivo]}>
                  {mostrarInativos ? "Ocultar" : `Desativados (${inativos.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {professores.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>Nenhum professor cadastrado</Text>
              <Text style={s.emptySubtitle}>Os professores aparecerão aqui{"\n"}conforme se cadastrarem no aplicativo.</Text>
            </View>
          ) : (
            <>
              {ativos.map((prof, idx) => {
                const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2","#d97706","#059669"];
                const cor = prof.foto ? "#3a7d44" : CORES[idx % CORES.length];
                const inicial = prof.nome.trim()[0]?.toUpperCase() ?? "P";
                return (
                  <TouchableOpacity
                    key={prof.id}
                    style={pp.card}
                    onPress={() => abrirModal(prof)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="person-outline" size={64} color={cor + "0D"} style={{ position: "absolute", top: -8, right: -4 }} />
                    <View style={[pp.cardAccent, { backgroundColor: cor }]} />
                    <View style={pp.avatarWrap}>
                      {prof.foto ? (
                        <Image source={{ uri: prof.foto }} style={pp.avatarImg} resizeMode="cover" />
                      ) : (
                        <View style={[pp.avatarInitialWrap, { backgroundColor: cor }]}>
                          <Text style={pp.avatarInitial}>{inicial}</Text>
                        </View>
                      )}
                      <View style={pp.statusDot} />
                    </View>
                    <View style={pp.info}>
                      <Text style={pp.nome} numberOfLines={1}>{prof.nome}</Text>
                      {(prof.materias ?? []).length > 0 ? (
                        <Text style={pp.materias} numberOfLines={1}>
                          {(prof.materias ?? []).join(" · ")}
                        </Text>
                      ) : (
                        <Text style={pp.semMaterias}>Sem matérias atribuídas</Text>
                      )}
                    </View>
                    <View style={[pp.chevron, { backgroundColor: cor + "18" }]}>
                      <Ionicons name="chevron-forward" size={14} color={cor} />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {mostrarInativos && inativos.length > 0 && (
                <>
                  <View style={li.secaoHeader}>
                    <Ionicons name="ban-outline" size={14} color="#aaa" />
                    <Text style={li.secaoTitulo}>Desativados</Text>
                  </View>
                  {inativos.map((prof) => (
                    <TouchableOpacity
                      key={prof.id}
                      style={[s.professorCard, li.cardInativo]}
                      onPress={() => abrirModal(prof)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.professorAvatar, { opacity: 0.5 }]}>
                        <Ionicons name="person-circle-outline" size={48} color="#bbb" />
                      </View>
                      <View style={[s.professorInfo, { opacity: 0.6 }]}>
                        <Text style={[s.professorNome, { color: "#999" }]}>{prof.nome}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Ionicons name="ban-outline" size={12} color="#bbb" />
                          <Text style={{ fontSize: 12, color: "#bbb", fontWeight: "600" }}>Desativado</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ddd" />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de detalhes / indisponibilidades */}
      <Modal visible={modalVisivel} animationType="slide" transparent onRequestClose={fecharModal}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />

            {/* Perfil do professor */}
            <View style={m.profileWrap}>
              <TouchableOpacity onPress={fecharModal} style={m.closeBtnAbs} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
              <View style={[m.profileAvatar, { backgroundColor: profSelecionado?.ativo ? "#3a7d44" : "#9CA3AF" }]}>
                {profSelecionado?.foto ? (
                  <Image source={{ uri: profSelecionado.foto }} style={{ width: 72, height: 72, borderRadius: 22 }} resizeMode="cover" />
                ) : (
                  <Text style={m.profileAvatarText}>{profSelecionado?.nome?.[0]?.toUpperCase() ?? "P"}</Text>
                )}
                <View style={[m.profileDot, { backgroundColor: profSelecionado?.ativo ? "#22C55E" : "#ef4444" }]} />
              </View>
              <Text style={m.profileNome}>{profSelecionado?.nome}</Text>
              <View style={m.profileRoleRow}>
                <View style={[m.profileRolePill, { backgroundColor: profSelecionado?.ativo ? "#F0FDF4" : "#FEF2F2", borderColor: profSelecionado?.ativo ? "#BBF7D0" : "#FECACA" }]}>
                  <Ionicons name={profSelecionado?.ativo ? "checkmark-circle-outline" : "ban-outline"} size={12} color={profSelecionado?.ativo ? "#3a7d44" : "#ef4444"} />
                  <Text style={[m.profileRoleText, { color: profSelecionado?.ativo ? "#3a7d44" : "#ef4444" }]}>
                    {profSelecionado?.ativo ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              </View>
              {(profSelecionado?.materias ?? []).length > 0 && (
                <View style={m.profileMaterias}>
                  {(profSelecionado?.materias ?? []).map((mat, i) => (
                    <View key={i} style={pc.chip}>
                      <Ionicons name="book-outline" size={10} color="#3a7d44" />
                      <Text style={pc.chipText}>{mat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <ScrollView style={m.sheetScroll} contentContainerStyle={m.sheetScrollContent} showsVerticalScrollIndicator={false}>
              {/* Seção indisponibilidades */}
              <View style={m.secHeader}>
                <View style={m.secHeaderDot} />
                <Text style={m.secHeaderText}>Indisponibilidades</Text>
                {bloqueios.length > 0 && (
                  <View style={m.secBadge}><Text style={m.secBadgeText}>{bloqueios.length}</Text></View>
                )}
              </View>

              {carregandoBloqueios ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#3a7d44" />
              ) : bloqueios.length === 0 ? (
                <View style={m.empty}>
                  <View style={m.emptyIconWrap}>
                    <Ionicons name="calendar-outline" size={28} color="#3a7d44" />
                  </View>
                  <Text style={m.emptyText}>Sem bloqueios</Text>
                  <Text style={m.emptySubText}>Disponível em todos os horários</Text>
                </View>
              ) : (
                <>
                  {DIAS.map((dia) =>
                    bloqueiosPorDia[dia].length === 0 ? null : (
                      <View key={dia} style={{ marginBottom: 14 }}>
                        <View style={m.diaHeader}>
                          <View style={m.diaDot} />
                          <Text style={m.diaHeaderText}>{dia}</Text>
                          <View style={m.diaLine} />
                        </View>
                        {bloqueiosPorDia[dia].map((b) => <BloqueioRow key={b.id} b={b} />)}
                      </View>
                    )
                  )}
                  {semDia.length > 0 && (
                    <View style={{ marginBottom: 4 }}>
                      <View style={m.diaHeader}>
                        <View style={[m.diaDot, { backgroundColor: "#9CA3AF" }]} />
                        <Text style={[m.diaHeaderText, { color: "#9CA3AF" }]}>Sem dia específico</Text>
                        <View style={[m.diaLine, { backgroundColor: "#F1F5F9" }]} />
                      </View>
                      {semDia.map((b) => <BloqueioRow key={b.id} b={b} />)}
                    </View>
                  )}
                </>
              )}

              {/* Permissão mapa de sala */}
              <View style={m.permCard}>
                <View style={m.permIconWrap}>
                  <Ionicons name="grid-outline" size={18} color="#3a7d44" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.permTitle}>Editar Mapa de Sala</Text>
                  <Text style={m.permDesc}>Permite alterar o mapa de carteiras</Text>
                </View>
                {atualizandoPermissao ? (
                  <ActivityIndicator size="small" color="#3a7d44" />
                ) : (
                  <Switch
                    value={profSelecionado?.podeEditarMapaSala ?? false}
                    onValueChange={handleTogglePermissaoMapa}
                    trackColor={{ false: "#E5E7EB", true: "#86efac" }}
                    thumbColor={profSelecionado?.podeEditarMapaSala ? "#3a7d44" : "#9CA3AF"}
                  />
                )}
              </View>
            </ScrollView>

            {/* Ações */}
            <View style={m.acoesWrap}>
              <TouchableOpacity style={m.acaoEditar} onPress={abrirEditarMaterias} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={17} color="#3a7d44" />
                <Text style={m.acaoEditarText}>Editar Matérias</Text>
              </TouchableOpacity>
              {profSelecionado?.ativo ? (
                <TouchableOpacity style={m.acaoDesativar} onPress={() => setModalDesativarVisivel(true)} activeOpacity={0.8}>
                  <Ionicons name="ban-outline" size={17} color="#f97316" />
                  <Text style={m.acaoDesativarText}>Desativar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={m.acaoReativar} onPress={() => setModalReativarVisivel(true)} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#3a7d44" />
                  <Text style={m.acaoReativarText}>Reativar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de cadastro de professor */}
      <Modal visible={modalCadastroVisivel} animationType="slide" transparent onRequestClose={fecharModalCadastro}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "padding"}>
          <View style={cad.overlay}>
            <View style={cad.sheet}>
              <View style={m.handle} />

              {/* Header */}
              <View style={cad.sheetHeader}>
                <View style={cad.sheetHeaderIcon}>
                  <Ionicons name="person-add-outline" size={20} color="#3a7d44" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cad.sheetTitle}>Cadastrar Professor</Text>
                  <Text style={cad.sheetSubtitle}>Preencha os dados para criar o acesso</Text>
                </View>
                <TouchableOpacity onPress={fecharModalCadastro} style={m.closeBtnAbs2} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={cad.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Campo: Nome */}
                <View style={cad.fieldWrap}>
                  <View style={cad.fieldHeader}>
                    <View style={[cad.fieldIcon, { backgroundColor: "#F0FDF4" }]}>
                      <Ionicons name="person-outline" size={15} color="#3a7d44" />
                    </View>
                    <Text style={cad.fieldLabel}>Nome completo</Text>
                    <Text style={cad.fieldRequired}>*</Text>
                  </View>
                  <TextInput style={cad.fieldInput} placeholder="Nome e sobrenome" placeholderTextColor="#9CA3AF" value={novoNome} onChangeText={setNovoNome} autoCapitalize="words" />
                </View>

                {/* Campo: E-mail */}
                <View style={cad.fieldWrap}>
                  <View style={cad.fieldHeader}>
                    <View style={[cad.fieldIcon, { backgroundColor: "#EFF6FF" }]}>
                      <Ionicons name="mail-outline" size={15} color="#3b82f6" />
                    </View>
                    <Text style={cad.fieldLabel}>E-mail</Text>
                    <Text style={cad.fieldRequired}>*</Text>
                  </View>
                  <TextInput style={cad.fieldInput} placeholder="email@escola.com" placeholderTextColor="#9CA3AF" value={novoEmail} onChangeText={setNovoEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>

                {/* Campo: Senha */}
                <View style={cad.fieldWrap}>
                  <View style={cad.fieldHeader}>
                    <View style={[cad.fieldIcon, { backgroundColor: "#FFF7ED" }]}>
                      <Ionicons name="lock-closed-outline" size={15} color="#f97316" />
                    </View>
                    <Text style={cad.fieldLabel}>Senha de acesso</Text>
                    <Text style={cad.fieldRequired}>*</Text>
                  </View>
                  <View style={cad.fieldInputRow}>
                    <TextInput style={[cad.fieldInput, { flex: 1, marginBottom: 0 }]} placeholder="Mínimo 6 caracteres" placeholderTextColor="#9CA3AF" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry={!novaSenhaVisivel} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setNovaSenhaVisivel(!novaSenhaVisivel)} style={cad.senhaEye}>
                      <Ionicons name={novaSenhaVisivel ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Matérias */}
                <View style={cad.materiasSection}>
                  <View style={cad.fieldHeader}>
                    <View style={[cad.fieldIcon, { backgroundColor: "#F0FDF4" }]}>
                      <Ionicons name="book-outline" size={15} color="#3a7d44" />
                    </View>
                    <Text style={cad.fieldLabel}>Matérias que leciona</Text>
                    <Text style={cad.fieldOptional}>(opcional)</Text>
                  </View>
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
                    <TextInput style={cad.addInput} placeholder="Ex: Matemática, Português..." placeholderTextColor="#9CA3AF" value={materiaInput} onChangeText={setMateriaInput} autoCapitalize="words" onSubmitEditing={adicionarMateria} returnKeyType="done" />
                    <TouchableOpacity style={cad.addBtn} onPress={adicionarMateria} activeOpacity={0.8}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[cad.confirmarBtn, cadastrando && { opacity: 0.65 }]} onPress={handleCadastrarProfessor} activeOpacity={0.85} disabled={cadastrando}>
                  {cadastrando ? <ActivityIndicator color="#fff" /> : (
                    <><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={cad.confirmarBtnText}>Criar Professor</Text></>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de edição de matérias */}
      <Modal visible={modalEditarMaterias} animationType="slide" transparent onRequestClose={fecharEditarMaterias}>
        <View style={em.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={em.sheet}>
              <View style={em.handle} />

              {/* Header */}
              <View style={em.header}>
                <View style={em.headerIcon}>
                  <Ionicons name="book-outline" size={20} color="#3a7d44" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={em.headerTitle}>Editar Matérias</Text>
                  <Text style={em.headerSub}>{profSelecionado?.nome}</Text>
                </View>
                <TouchableOpacity onPress={fecharEditarMaterias} style={em.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={em.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Estado vazio */}
                {materiasEditadas.length === 0 && (
                  <View style={em.emptyWrap}>
                    <Ionicons name="book-outline" size={28} color="#D1D5DB" />
                    <Text style={em.emptyText}>Nenhuma matéria adicionada</Text>
                  </View>
                )}

                {/* Chips de matérias */}
                {materiasEditadas.length > 0 && (
                  <View style={em.chipsWrap}>
                    {materiasEditadas.map((mat, idx) => (
                      <View key={idx} style={em.chip}>
                        <Ionicons name="book-outline" size={12} color="#3a7d44" />
                        <Text style={em.chipText}>{mat}</Text>
                        <TouchableOpacity
                          onPress={() => removerMateriaEdit(idx)}
                          style={em.chipRemove}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Campo adicionar */}
                <View style={em.addSection}>
                  <Text style={em.addLabel}>Adicionar matéria</Text>
                  <View style={em.addRow}>
                    <TextInput
                      style={em.addInput}
                      placeholder="Ex: Matemática, Física..."
                      placeholderTextColor="#9CA3AF"
                      value={materiaEditInput}
                      onChangeText={setMateriaEditInput}
                      autoCapitalize="words"
                      onSubmitEditing={adicionarMateriaEdit}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={em.addBtn} onPress={adicionarMateriaEdit} activeOpacity={0.8}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={em.addHint}>Toque em + ou "concluir" no teclado para adicionar</Text>
                </View>

                <TouchableOpacity
                  style={[em.salvarBtn, salvando && { opacity: 0.65 }]}
                  onPress={handleSalvarMaterias}
                  activeOpacity={0.85}
                  disabled={salvando}
                >
                  {salvando
                    ? <ActivityIndicator color="#fff" />
                    : <><Ionicons name="checkmark-outline" size={18} color="#fff" /><Text style={em.salvarBtnText}>Salvar Matérias</Text></>
                  }
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal confirmação geral */}
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

      {/* Modal sucesso ao cadastrar */}
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

      {/* Modal de confirmação de desativação */}
      <Modal visible={modalDesativarVisivel} transparent animationType="fade" onRequestClose={() => setModalDesativarVisivel(false)}>
        <View style={desat.overlay}>
          <View style={desat.box}>
            <View style={desat.iconWrap}>
              <Ionicons name="ban-outline" size={32} color="#f97316" />
            </View>
            <Text style={desat.titulo}>Desativar Professor</Text>
            <Text style={desat.descricao}>
              <Text style={{ fontWeight: "700", color: "#1a1a2e" }}>{profSelecionado?.nome}</Text>
              {" "}não conseguirá mais acessar o aplicativo.{"\n"}
              O professor pode ser reativado a qualquer momento.
            </Text>
            <View style={desat.botoesRow}>
              <TouchableOpacity style={desat.cancelarBtn} onPress={() => setModalDesativarVisivel(false)} activeOpacity={0.8} disabled={desativando}>
                <Text style={desat.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={desat.confirmarBtn} onPress={handleDesativarProfessor} activeOpacity={0.8} disabled={desativando}>
                {desativando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={desat.confirmarText}>Desativar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmação de reativação */}
      <Modal visible={modalReativarVisivel} transparent animationType="fade" onRequestClose={() => setModalReativarVisivel(false)}>
        <View style={desat.overlay}>
          <View style={desat.box}>
            <View style={[desat.iconWrap, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#3a7d44" />
            </View>
            <Text style={[desat.titulo, { color: "#3a7d44" }]}>Reativar Professor</Text>
            <Text style={desat.descricao}>
              <Text style={{ fontWeight: "700", color: "#1a1a2e" }}>{profSelecionado?.nome}</Text>
              {" "}poderá acessar o aplicativo novamente.
            </Text>
            <View style={desat.botoesRow}>
              <TouchableOpacity style={desat.cancelarBtn} onPress={() => setModalReativarVisivel(false)} activeOpacity={0.8} disabled={reativando}>
                <Text style={desat.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[desat.confirmarBtn, { backgroundColor: "#3a7d44" }]} onPress={handleReativarProfessor} activeOpacity={0.8} disabled={reativando}>
                {reativando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={desat.confirmarText}>Reativar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de feedback (erros / avisos / sucesso) */}
      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={inf.overlay}>
          <View style={inf.box}>
            <View style={[inf.iconCircle, {
              backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : modalInfo.tipo === "sucesso" ? "#dcfce7" : "#FFF7ED",
            }]}>
              <Ionicons
                name={modalInfo.tipo === "erro" ? "close-circle-outline" : modalInfo.tipo === "sucesso" ? "checkmark-circle-outline" : "warning-outline"}
                size={32}
                color={modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316"}
              />
            </View>
            <Text style={[inf.titulo, {
              color: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316",
            }]}>{modalInfo.titulo}</Text>
            <Text style={inf.msg}>{modalInfo.mensagem}</Text>
            <TouchableOpacity
              style={[inf.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]}
              onPress={() => setModalInfo(p => ({ ...p, visivel: false }))}
              activeOpacity={0.85}
            >
              <Text style={inf.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BloqueioRow({ b }: { b: Bloqueio }) {
  return (
    <View style={m.bloqueioCard}>
      <View style={m.bloqueioAccent} />
      <View style={m.bloqueioTimeBadge}>
        <Text style={m.bloqueioHoraStart}>{b.timeStart}</Text>
        <View style={m.bloqueioTimeSep} />
        <Text style={m.bloqueioHoraEnd}>{b.timeEnd}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 2 }}>
        {b.descricao ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="business-outline" size={11} color="#9CA3AF" />
            <Text style={m.bloqueioDesc} numberOfLines={1}>{b.descricao}</Text>
          </View>
        ) : (
          <Text style={m.bloqueioSemDesc}>Sem motivo informado</Text>
        )}
      </View>
    </View>
  );
}

const pp = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20, overflow: "hidden",
    marginBottom: 10, paddingVertical: 14, paddingRight: 14, paddingLeft: 0,
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardAccent: { width: 5, alignSelf: "stretch", marginRight: 12 },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 14 },
  avatarInitialWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statusDot: { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "#fff" },
  info: { flex: 1, gap: 3 },
  nome: { fontSize: 15, fontWeight: "800", color: "#111827" },
  materias: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  semMaterias: { fontSize: 11, color: "#D1D5DB", fontStyle: "italic" },
  chevron: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: 8 },
});

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,15,20,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#F8F9FA", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "85%", paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#BBF7D0" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  emptyWrap: {
    alignItems: "center", paddingVertical: 32, gap: 10,
    backgroundColor: "#fff", borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#BBF7D0",
    shadowColor: "#3a7d44", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  chipText: { fontSize: 14, fontWeight: "700", color: "#166534" },
  chipRemove: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#FECACA",
  },

  addSection: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, gap: 10,
    marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  addLabel: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addInput: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#111827",
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: "#3a7d44",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#3a7d44", shadowOpacity: 0.32, shadowRadius: 8, elevation: 4,
  },
  addHint: { fontSize: 11, color: "#9CA3AF" },

  salvarBtn: {
    backgroundColor: "#3a7d44", borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#3a7d44", shadowOpacity: 0.32, shadowRadius: 12, elevation: 6,
    marginHorizontal: 0,
  },
  salvarBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

const conf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center", marginBottom: 18, elevation: 5 },
  titulo: { fontSize: 18, fontWeight: "800", color: "#1a1a2e", marginBottom: 10, textAlign: "center" },
  mensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  botoesRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelarBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center", backgroundColor: "#fafafa" },
  cancelarText: { fontSize: 15, fontWeight: "600", color: "#555" },
  confirmarBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#3a7d44", alignItems: "center", elevation: 3 },
  confirmarText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const suc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10 },
  iconCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center", marginBottom: 20, elevation: 6 },
  titulo: { fontSize: 20, fontWeight: "800", color: "#1a1a2e", marginBottom: 10, textAlign: "center" },
  descricao: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  nome: { fontWeight: "700", color: "#1a1a2e" },
  btn: { width: "100%", backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 4 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const desat = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: "700", color: "#f97316", marginBottom: 10, textAlign: "center" },
  descricao: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21, marginBottom: 20 },
  botoesRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  cancelarText: { fontSize: 15, fontWeight: "600", color: "#555" },
  confirmarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#f97316", alignItems: "center" },
  confirmarText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const pm = StyleSheet.create({
  box: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#f0faf2", borderRadius: 14, padding: 14,
    marginTop: 16, marginBottom: 8,
    borderWidth: 1, borderColor: "#b7dfbe",
  },
  titulo: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  descricao: { fontSize: 12, color: "#666", marginTop: 2 },
});

const li = StyleSheet.create({
  secaoHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  secaoTitulo: { fontSize: 12, fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  cardInativo: { opacity: 0.7, borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" },
  badge: { backgroundColor: "#FFF7ED", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: "#FED7AA" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  btnInativos: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F5F5F5", borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1.5, borderColor: "#E5E7EB",
  },
  btnInativosAtivo: {
    backgroundColor: "#FFF7ED", borderColor: "#FED7AA",
  },
  btnInativosText: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  btnInativosTextAtivo: { color: "#f97316" },
});

const cad = StyleSheet.create({
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  headerBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  overlay: { flex: 1, backgroundColor: "rgba(15,15,20,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "90%", paddingTop: 12 },

  // Header do cadastro
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  sheetHeaderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#BBF7D0" },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  sheetSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  sheetScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Campos redesenhados
  fieldWrap: { marginBottom: 16 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  fieldIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151", flex: 1 },
  fieldRequired: { fontSize: 13, color: "#ef4444", fontWeight: "700" },
  fieldOptional: { fontSize: 12, color: "#9CA3AF" },
  fieldInput: {
    backgroundColor: "#F9FAFB", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", marginBottom: 0,
  },
  fieldInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB" },
  senhaEye: { paddingHorizontal: 14 },

  // Matérias
  materiasSection: { marginBottom: 20 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addInput: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827",
  },
  addBtn: { backgroundColor: "#3a7d44", borderRadius: 12, width: 44, height: 44, alignItems: "center", justifyContent: "center", shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },

  confirmarBtn: {
    backgroundColor: "#3a7d44", borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#3a7d44", shadowOpacity: 0.32, shadowRadius: 10, elevation: 5,
    marginBottom: 8,
  },
  confirmarBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Aliases antigos (não usados no novo JSX mas podem existir no modal editar)
  inputRow: {},
  inputIcon: {},
  inputLabel: {},
  textInput: {},
  materiaLabel: {},
  materiaHint: {},
});

const pc = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#e8f5ea", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  chipText: { fontSize: 11, color: "#3a7d44", fontWeight: "600" },
});

const inf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 3 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,15,20,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#F8F9FA", borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "88%", paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 0 },

  // Profile header
  profileWrap: {
    alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    marginBottom: 0,
  },
  closeBtnAbs: {
    position: "absolute", top: 12, right: 16,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  closeBtnAbs2: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  profileAvatar: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  profileAvatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
  profileDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: "#fff",
  },
  profileNome: { fontSize: 20, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 6 },
  profileRoleRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  profileRolePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5,
  },
  profileRoleText: { fontSize: 12, fontWeight: "700" },
  profileMaterias: { flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 4 },

  // Scroll
  sheetScroll: { flex: 1, minHeight: 0 },
  sheetScrollContent: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 12 },

  // Section header
  secHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 },
  secHeaderDot: { width: 4, height: 18, borderRadius: 2, backgroundColor: "#3a7d44" },
  secHeaderText: { fontSize: 14, fontWeight: "800", color: "#111827", flex: 1 },
  secBadge: { backgroundColor: "#F0FDF4", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "#BBF7D0" },
  secBadgeText: { fontSize: 12, fontWeight: "700", color: "#3a7d44" },

  // Empty
  empty: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#BBF7D0" },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  emptySubText: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },

  // Dia header
  diaHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 2 },
  diaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3a7d44" },
  diaHeaderText: { fontSize: 12, fontWeight: "800", color: "#3a7d44", textTransform: "uppercase", letterSpacing: 0.6, flex: 1 },
  diaLine: { flex: 1, height: 1, backgroundColor: "#DCFCE7" },

  // Bloqueio card
  bloqueioCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#FEE2E2", overflow: "hidden",
    shadowColor: "#ef4444", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  bloqueioAccent: { width: 4, alignSelf: "stretch", backgroundColor: "#ef4444" },
  bloqueioTimeBadge: {
    alignItems: "center", paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: "#FFF5F5", gap: 2,
  },
  bloqueioHoraStart: { fontSize: 14, fontWeight: "800", color: "#1a1a2e" },
  bloqueioTimeSep: { width: 16, height: 1.5, backgroundColor: "#fca5a5", borderRadius: 1 },
  bloqueioHoraEnd: { fontSize: 11, fontWeight: "700", color: "#ef4444" },
  bloqueioDesc: { fontSize: 12, color: "#6B7280", flex: 1 },
  bloqueioSemDesc: { fontSize: 11, color: "#D1D5DB", fontStyle: "italic" },

  // Permissão card
  permCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    marginTop: 12, borderWidth: 1, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  permIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  permTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  permDesc: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  // Ações
  acoesWrap: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  acaoEditar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  acaoEditarText: { fontSize: 14, fontWeight: "700", color: "#3a7d44" },
  acaoDesativar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: "#FFF7ED", borderWidth: 1.5, borderColor: "#FED7AA",
  },
  acaoDesativarText: { fontSize: 14, fontWeight: "700", color: "#f97316" },
  acaoReativar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  acaoReativarText: { fontSize: 14, fontWeight: "700", color: "#3a7d44" },

  // Aliases para compatibilidade
  sheetHeader: {},
  sheetTitle: {},
  sheetSubtitle: {},
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
});
