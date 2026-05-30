import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  if (digitos.length <= 1) return digitos;
  if (digitos.length === 2) {
    if (parseInt(digitos, 10) > 23) return `0${digitos[0]}:${digitos[1]}`;
    return digitos;
  }
  const hh = digitos.slice(0, 2);
  const mm = digitos.slice(2);
  if (parseInt(hh, 10) > 23) return `0${hh[0]}:${hh[1]}${mm}`;
  return `${hh}:${mm}`;
};

const finalizarHorario = (valor: string, setter: (v: string) => void) => {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return;
  const h = digitos.slice(0, 2).padStart(2, "0");
  const m = digitos.slice(2, 4).padEnd(2, "0");
  setter(`${h}:${m}`);
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
  const [modalDeletar, setModalDeletar] = useState<{ visivel: boolean; id: string | null }>({ visivel: false, id: null });
  const [modalAviso, setModalAviso] = useState<{ visivel: boolean; tipo: "aviso" | "erro" | "sucesso"; titulo: string; mensagem: string }>({ visivel: false, tipo: "aviso", titulo: "", mensagem: "" });

  // Aviso de atraso / ausência
  const [modalAvisar, setModalAvisar] = useState(false);
  const [tipoAviso, setTipoAviso] = useState<"atraso" | "ausencia">("ausencia");
  const [horarioChegada, setHorarioChegada] = useState("");
  const [motivoAviso, setMotivoAviso] = useState("");
  const [enviandoAviso, setEnviandoAviso] = useState(false);

  const mostrarAviso = (tipo: "aviso" | "erro" | "sucesso", titulo: string, mensagem: string) =>
    setModalAviso({ visivel: true, tipo, titulo, mensagem });

  const handleEnviarAviso = async () => {
    if (!motivoAviso.trim()) {
      mostrarAviso("aviso", "Motivo obrigatório", "Informe o motivo do aviso à supervisão.");
      return;
    }
    if (tipoAviso === "atraso" && !horarioChegada.trim()) {
      mostrarAviso("aviso", "Horário obrigatório", "Informe o horário previsto de chegada.");
      return;
    }
    setEnviandoAviso(true);
    try {
      await api.post("/avisos-professor", {
        tipo: tipoAviso,
        horarioChegada: tipoAviso === "atraso" ? horarioChegada.trim() : null,
        motivo: motivoAviso.trim(),
      });
      setModalAvisar(false);
      setMotivoAviso("");
      setHorarioChegada("");
      setTipoAviso("ausencia");
      mostrarAviso("sucesso", "Aviso enviado!", "A supervisão foi notificada sobre sua situação.");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Não foi possível enviar o aviso.";
      mostrarAviso("erro", "Erro ao enviar", msg);
    } finally {
      setEnviandoAviso(false);
    }
  };

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/bloqueios");
      setBloqueios(res.data);
    } catch {
      mostrarAviso("erro", "Erro", "Não foi possível carregar os bloqueios.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAdicionar = async () => {
    if (!timeStart.trim() || !timeEnd.trim()) {
      mostrarAviso("aviso", "Campos obrigatórios", "Preencha o horário de início e de término.");
      return;
    }
    if (timeStart < "07:00") {
      mostrarAviso("aviso", "Horário inválido", "O horário de início não pode ser antes das 07:00, pois as aulas começam a partir desta hora.");
      return;
    }
    if (timeEnd <= timeStart) {
      mostrarAviso("aviso", "Horário inválido", "O horário de término deve ser posterior ao horário de início.");
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
        mostrarAviso("sucesso", "Bloqueio adicionado", `${removidas} aula(s) que conflitavam com este horário foram removidas do cronograma. A supervisão foi notificada.`);
      }
    } catch (err: any) {
      mostrarAviso("erro", "Erro ao salvar", err?.response?.data?.error || "Não foi possível salvar o bloqueio. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = (id: string) => setModalDeletar({ visivel: true, id });

  const confirmarDeletar = async () => {
    const id = modalDeletar.id;
    setModalDeletar({ visivel: false, id: null });
    if (!id) return;
    try {
      await api.delete(`/bloqueios/${id}`);
      setBloqueios((prev) => prev.filter((b) => b.id !== id));
    } catch {
      mostrarAviso("erro", "Erro", "Não foi possível remover.");
    }
  };

  const bloqueiosPorDia = DIAS.reduce<Record<string, Bloqueio[]>>((acc, dia) => {
    acc[dia] = bloqueios.filter((b) => b.diaSemana === dia);
    return acc;
  }, {});
  const semDia = bloqueios.filter((b) => !b.diaSemana);

  const totalAtivos = bloqueios.length;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Minha Agenda</Text>
          <Text style={s.headerSub}>
            {carregando ? "Carregando..." : totalAtivos === 0 ? "Nenhum bloqueio cadastrado" : `${totalAtivos} bloqueio${totalAtivos > 1 ? "s" : ""} ativo${totalAtivos > 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity style={s.avisoBtn} onPress={() => setModalAvisar(true)} activeOpacity={0.8}>
          <Ionicons name="alert-circle-outline" size={15} color="#3a7d44" />
          <Text style={s.avisoBtnText}>Avisar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={{ flex: 1 }}>
        {carregando ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Stats banner */}
            {!carregando && (
              <View style={s.statsBanner}>
                <Ionicons name="ban-outline" size={90} color="rgba(239,68,68,0.07)" style={{ position: "absolute", top: -12, right: -12 }} />
                <View style={s.statsBannerLeft}>
                  <Text style={s.statsBannerNum}>{totalAtivos}</Text>
                  <Text style={s.statsBannerLabel}>{totalAtivos === 1 ? "bloqueio" : "bloqueios"}</Text>
                </View>
                <View style={s.statsBannerDivider} />
                <View style={s.statsBannerRight}>
                  <Text style={s.statsBannerDiasTitle}>Por dia</Text>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
                    {DIAS.map((dia) => {
                      const tem = bloqueios.some((b) => b.diaSemana === dia);
                      return (
                        <View key={dia} style={[s.statsDiaPill, tem && s.statsDiaPillAtivo]}>
                          <Text style={[s.statsDiaText, tem && s.statsDiaTextAtivo]}>{dia[0]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Formulário de adição */}
            <View style={s.formCard}>
              {/* Título da seção */}
              <View style={s.formHeader}>
                <View style={s.formHeaderIcon}>
                  <Ionicons name="add" size={18} color="#3a7d44" />
                </View>
                <Text style={s.formHeaderTitle}>Adicionar bloqueio</Text>
              </View>

              {/* Info hint */}
              <View style={s.hint}>
                <Ionicons name="information-circle-outline" size={14} color="#3a7d44" />
                <Text style={s.hintText}>
                  A supervisão será avisada se tentar te alocar neste período.
                </Text>
              </View>

              {/* Seleção de dia */}
              <Text style={s.label}>Dia da semana <Text style={s.labelOpt}>(opcional)</Text></Text>
              <View style={s.diasRow}>
                {DIAS.map((dia) => {
                  const ativo = diaSemana === dia;
                  return (
                    <TouchableOpacity
                      key={dia}
                      style={[s.diaChip, ativo && s.diaChipActive]}
                      onPress={() => setDiaSemana(ativo ? null : dia)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.diaChipText, ativo && s.diaChipTextActive]}>
                        {dia.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Horários */}
              <Text style={s.label}>Horário <Text style={s.labelOpt}>(a partir das 07:00)</Text></Text>
              <View style={s.timeRow}>
                <View style={s.timeBox}>
                  <View style={s.timeIconWrap}>
                    <Ionicons name="time-outline" size={14} color="#3a7d44" />
                    <Text style={s.timeLabel}>Início</Text>
                  </View>
                  <TextInput
                    style={s.timeInput}
                    value={timeStart}
                    onChangeText={(t) => setTimeStart(formatarHorario(t))}
                    onBlur={() => finalizarHorario(timeStart, setTimeStart)}
                    placeholder="07:00"
                    placeholderTextColor="#BBBBBB"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={s.timeDash}>
                  <View style={s.timeDashLine} />
                  <Ionicons name="arrow-forward" size={14} color="#bbb" />
                  <View style={s.timeDashLine} />
                </View>

                <View style={s.timeBox}>
                  <View style={s.timeIconWrap}>
                    <Ionicons name="time-outline" size={14} color="#ef4444" />
                    <Text style={[s.timeLabel, { color: "#ef4444" }]}>Término</Text>
                  </View>
                  <TextInput
                    style={s.timeInput}
                    value={timeEnd}
                    onChangeText={(t) => setTimeEnd(formatarHorario(t))}
                    onBlur={() => finalizarHorario(timeEnd, setTimeEnd)}
                    placeholder="09:00"
                    placeholderTextColor="#BBBBBB"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Motivo */}
              <Text style={s.label}>Motivo <Text style={s.labelOpt}>(opcional)</Text></Text>
              <TextInput
                style={s.input}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Ex: Escola Estadual São João"
                placeholderTextColor="#BBBBBB"
              />

              {/* Botão adicionar */}
              <TouchableOpacity
                style={[s.addBtn, salvando && { opacity: 0.6 }]}
                onPress={handleAdicionar}
                disabled={salvando}
                activeOpacity={0.85}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={s.addBtnText}>Adicionar bloqueio</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Lista de bloqueios */}
            <View style={s.listaCard}>
              <View style={s.formHeader}>
                <View style={[s.formHeaderIcon, { backgroundColor: "#fef2f2" }]}>
                  <Ionicons name="ban-outline" size={16} color="#ef4444" />
                </View>
                <Text style={s.formHeaderTitle}>Meus bloqueios</Text>
                {totalAtivos > 0 && (
                  <View style={s.countBadge}>
                    <Text style={s.countBadgeText}>{totalAtivos}</Text>
                  </View>
                )}
              </View>

              {bloqueios.length === 0 ? (
                <View style={s.empty}>
                  <View style={s.emptyIconWrap}>
                    <Ionicons name="calendar-outline" size={32} color="#aaa" />
                  </View>
                  <Text style={s.emptyTitle}>Tudo livre!</Text>
                  <Text style={s.emptyText}>Você não tem nenhum horário bloqueado.</Text>
                </View>
              ) : (
                <>
                  {DIAS.map((dia) =>
                    bloqueiosPorDia[dia].length === 0 ? null : (
                      <View key={dia} style={{ marginBottom: 16 }}>
                        <View style={s.diaHeader}>
                          <View style={s.diaDot} />
                          <Text style={s.diaHeaderText}>{dia}</Text>
                          <View style={s.diaHeaderLine} />
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
                        <View style={[s.diaDot, { backgroundColor: "#888" }]} />
                        <Text style={[s.diaHeaderText, { color: "#888" }]}>Sem dia específico</Text>
                        <View style={[s.diaHeaderLine, { backgroundColor: "#eee" }]} />
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

      {/* Modal avisar supervisão */}
      <Modal visible={modalAvisar} transparent animationType="slide" onRequestClose={() => setModalAvisar(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={av.overlay}>
            <View style={av.sheet}>
              <View style={av.handle} />

              <View style={av.header}>
                <View style={av.headerIcon}>
                  <Ionicons name="alert-circle-outline" size={22} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={av.headerTitle}>Avisar Supervisão</Text>
                  <Text style={av.headerSub}>Informe sua situação para hoje</Text>
                </View>
                <TouchableOpacity onPress={() => setModalAvisar(false)} style={av.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#555" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={av.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Toggle tipo */}
                <Text style={av.label}>O que deseja informar?</Text>
                <View style={av.tipoRow}>
                  <TouchableOpacity
                    style={[av.tipoBtn, tipoAviso === "ausencia" && av.tipoBtnAusencia]}
                    onPress={() => { setTipoAviso("ausencia"); setHorarioChegada(""); }}
                    activeOpacity={0.8}
                  >
                    <View style={[av.tipoBtnIconWrap, { backgroundColor: tipoAviso === "ausencia" ? "#fef2f2" : "#F3F4F6" }]}>
                      <Ionicons name="close-circle-outline" size={24} color={tipoAviso === "ausencia" ? "#ef4444" : "#bbb"} />
                    </View>
                    <Text style={[av.tipoBtnText, tipoAviso === "ausencia" && { color: "#ef4444", fontWeight: "800" }]}>Não vou{"\n"}comparecer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[av.tipoBtn, tipoAviso === "atraso" && av.tipoBtnAtraso]}
                    onPress={() => setTipoAviso("atraso")}
                    activeOpacity={0.8}
                  >
                    <View style={[av.tipoBtnIconWrap, { backgroundColor: tipoAviso === "atraso" ? "#FFF7ED" : "#F3F4F6" }]}>
                      <Ionicons name="time-outline" size={24} color={tipoAviso === "atraso" ? "#f97316" : "#bbb"} />
                    </View>
                    <Text style={[av.tipoBtnText, tipoAviso === "atraso" && { color: "#f97316", fontWeight: "800" }]}>Vou{"\n"}atrasar</Text>
                  </TouchableOpacity>
                </View>

                {/* Horário de chegada — só atraso */}
                {tipoAviso === "atraso" && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={av.label}>Horário previsto de chegada <Text style={{ color: "#ef4444" }}>*</Text></Text>
                    <View style={av.timeBox}>
                      <Ionicons name="time-outline" size={20} color="#f97316" />
                      <TextInput
                        style={av.timeInput}
                        value={horarioChegada}
                        onChangeText={(t) => setHorarioChegada(formatarHorario(t))}
                        onBlur={() => finalizarHorario(horarioChegada, setHorarioChegada)}
                        placeholder="08:30"
                        placeholderTextColor="#ddd"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>
                )}

                {/* Motivo */}
                <Text style={av.label}>Motivo <Text style={{ color: "#ef4444" }}>*</Text></Text>
                <TextInput
                  style={av.motivoInput}
                  value={motivoAviso}
                  onChangeText={setMotivoAviso}
                  placeholder={tipoAviso === "ausencia"
                    ? "Ex: Problema de saúde, emergência familiar..."
                    : "Ex: Trânsito intenso, consulta médica..."}
                  placeholderTextColor="#bbb"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Botão enviar */}
                <TouchableOpacity
                  style={[
                    av.enviarBtn,
                    { backgroundColor: tipoAviso === "ausencia" ? "#ef4444" : "#f97316" },
                    enviandoAviso && { opacity: 0.6 },
                  ]}
                  onPress={handleEnviarAviso}
                  disabled={enviandoAviso}
                  activeOpacity={0.85}
                >
                  {enviandoAviso ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                      <Text style={av.enviarBtnText}>Enviar aviso à supervisão</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal aviso / erro / sucesso */}
      <Modal visible={modalAviso.visivel} transparent animationType="fade" onRequestClose={() => setModalAviso((m) => ({ ...m, visivel: false }))}>
        <View style={s.mdOverlay}>
          <View style={s.mdBox}>
            <View style={[s.mdIconWrap, {
              backgroundColor:
                modalAviso.tipo === "sucesso" ? "#e8f5ea" :
                modalAviso.tipo === "erro" ? "#fef2f2" : "#fffbeb",
            }]}>
              <Ionicons
                name={
                  modalAviso.tipo === "sucesso" ? "checkmark-circle" :
                  modalAviso.tipo === "erro" ? "alert-circle" : "warning-outline"
                }
                size={32}
                color={
                  modalAviso.tipo === "sucesso" ? "#3a7d44" :
                  modalAviso.tipo === "erro" ? "#ef4444" : "#f59e0b"
                }
              />
            </View>
            <Text style={s.mdTitulo}>{modalAviso.titulo}</Text>
            <Text style={s.mdSub}>{modalAviso.mensagem}</Text>
            <TouchableOpacity
              style={[s.mdOkBtn, {
                backgroundColor:
                  modalAviso.tipo === "sucesso" ? "#3a7d44" :
                  modalAviso.tipo === "erro" ? "#ef4444" : "#f59e0b",
              }]}
              onPress={() => setModalAviso((m) => ({ ...m, visivel: false }))}
              activeOpacity={0.85}
            >
              <Text style={s.mdOkBtnText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal visible={modalDeletar.visivel} transparent animationType="fade" onRequestClose={() => setModalDeletar({ visivel: false, id: null })}>
        <View style={s.mdOverlay}>
          <View style={s.mdBox}>
            <View style={s.mdIconWrap}>
              <Ionicons name="trash-outline" size={30} color="#ef4444" />
            </View>
            <Text style={s.mdTitulo}>Remover bloqueio</Text>
            <Text style={s.mdSub}>Deseja remover este horário de indisponibilidade?</Text>
            <View style={s.mdBtns}>
              <TouchableOpacity style={s.mdCancelar} onPress={() => setModalDeletar({ visivel: false, id: null })} activeOpacity={0.8}>
                <Text style={s.mdCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mdRemover} onPress={confirmarDeletar} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={15} color="#fff" />
                <Text style={s.mdRemoverText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BloqueioItem({ b, onDelete }: { b: Bloqueio; onDelete: (id: string) => void }) {
  return (
    <View style={s.bloqueioCard}>
      <View style={s.bloqueioAccent} />
      <View style={s.bloqueioTimeBadge}>
        <Text style={s.bloqueioTimeStart}>{b.timeStart}</Text>
        <View style={s.bloqueioTimeSep} />
        <Text style={s.bloqueioTimeEnd}>{b.timeEnd}</Text>
      </View>
      <View style={s.bloqueioInfo}>
        {b.descricao ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Ionicons name="business-outline" size={11} color="#aaa" />
            <Text style={s.bloqueioDesc} numberOfLines={1}>{b.descricao}</Text>
          </View>
        ) : (
          <Text style={s.bloqueioSemMotivo}>Sem motivo informado</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onDelete(b.id)} style={s.deleteBtn} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={17} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#3a7d44",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1, fontWeight: "500" },
  avisoBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  avisoBtnText: { fontSize: 13, fontWeight: "700", color: "#3a7d44" },

  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  // Form card
  formCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  formHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  formHeaderIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center",
  },
  formHeaderTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a2e", flex: 1 },
  countBadge: {
    backgroundColor: "#ef4444", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  hint: {
    flexDirection: "row", alignItems: "flex-start", gap: 7,
    backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginBottom: 16,
  },
  hintText: { flex: 1, fontSize: 12, color: "#2d6a4f", lineHeight: 17 },

  label: { fontSize: 12, color: "#555", fontWeight: "700", marginBottom: 8, letterSpacing: 0.1 },
  labelOpt: { fontWeight: "400", color: "#aaa" },

  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  diaChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 22,
    backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "transparent",
  },
  diaChipActive: { backgroundColor: "#3a7d44", borderColor: "#3a7d44", shadowColor: "#3a7d44", shadowOpacity: 0.28, shadowRadius: 6, elevation: 3 },
  diaChipText: { fontSize: 13, fontWeight: "700", color: "#777" },
  diaChipTextActive: { color: "#fff" },

  // Time row
  timeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  timeBox: {
    flex: 1, backgroundColor: "#F7F9FC", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E8E8E8", overflow: "hidden",
  },
  timeIconWrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4,
  },
  timeLabel: { fontSize: 11, fontWeight: "700", color: "#3a7d44", textTransform: "uppercase", letterSpacing: 0.4 },
  timeInput: {
    fontSize: 22, fontWeight: "800", color: "#1a1a2e",
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 2,
  },
  timeDash: { alignItems: "center", gap: 4 },
  timeDashLine: { width: 1, height: 10, backgroundColor: "#ddd" },

  input: {
    backgroundColor: "#F7F9FC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E8E8E8",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1a1a2e", marginBottom: 16,
  },

  addBtn: {
    backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#3a7d44", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Lista card
  listaCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },

  empty: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#888" },
  emptyText: { fontSize: 13, color: "#bbb", textAlign: "center" },

  diaHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 10, marginTop: 2,
  },
  diaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3a7d44" },
  diaHeaderText: { fontSize: 12, fontWeight: "800", color: "#3a7d44", textTransform: "uppercase", letterSpacing: 0.6 },
  diaHeaderLine: { flex: 1, height: 1, backgroundColor: "#e8f5ea" },

  bloqueioCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: "#FFE4E4",
    overflow: "hidden",
    shadowColor: "#ef4444", shadowOpacity: 0.1, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  bloqueioAccent: { width: 5, alignSelf: "stretch", backgroundColor: "#ef4444" },
  bloqueioTimeBadge: {
    alignItems: "center", paddingVertical: 14, paddingHorizontal: 14,
    gap: 3, backgroundColor: "#FFF5F5",
  },
  bloqueioTimeStart: { fontSize: 15, fontWeight: "800", color: "#1a1a2e" },
  bloqueioTimeSep: { width: 18, height: 2, backgroundColor: "#f87171", borderRadius: 1 },
  bloqueioTimeEnd: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  bloqueioInfo: { flex: 1, paddingVertical: 12, paddingRight: 4 },
  bloqueioHorario: {},
  bloqueioDesc: { fontSize: 12, color: "#888", flex: 1 },
  bloqueioSemMotivo: { fontSize: 11, color: "#ccc", fontStyle: "italic", marginTop: 2 },
  deleteBtn: { padding: 14 },

  // Stats banner
  statsBanner: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 16,
    shadowColor: "#ef4444", shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    overflow: "hidden",
    borderWidth: 1.5, borderColor: "#FFE4E4",
  },
  statsBannerLeft: { alignItems: "center", gap: 1, minWidth: 48 },
  statsBannerNum: { fontSize: 34, fontWeight: "800", color: "#ef4444", lineHeight: 38 },
  statsBannerLabel: { fontSize: 11, fontWeight: "600", color: "#aaa" },
  statsBannerDivider: { width: 1, height: 44, backgroundColor: "#F0F0F0" },
  statsBannerRight: { flex: 1 },
  statsBannerDiasTitle: { fontSize: 11, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  statsDiaPill: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  statsDiaPillAtivo: { backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fca5a5" },
  statsDiaText: { fontSize: 11, fontWeight: "800", color: "#ccc" },
  statsDiaTextAtivo: { color: "#ef4444" },

  // Modal deletar
  mdOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  mdBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 26, alignItems: "center", gap: 8 },
  mdIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  mdTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  mdSub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19, marginBottom: 4 },
  mdBtns: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  mdCancelar: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  mdCancelarText: { fontSize: 14, fontWeight: "600", color: "#555" },
  mdRemover: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#ef4444", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  mdRemoverText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  mdOkBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
  mdOkBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const av = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    height: "82%", paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a2e" },
  headerSub: { fontSize: 12, color: "#aaa", marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  tipoRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  tipoBtn: {
    flex: 1, alignItems: "center", gap: 10,
    backgroundColor: "#F8F9FA", borderRadius: 18, paddingVertical: 18,
    borderWidth: 2, borderColor: "transparent",
  },
  tipoBtnAusencia: { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  tipoBtnAtraso: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  tipoBtnIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  tipoBtnText: { fontSize: 13, fontWeight: "600", color: "#aaa", textAlign: "center", lineHeight: 18 },
  timeBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFF7ED", borderRadius: 16, borderWidth: 2, borderColor: "#FED7AA",
    paddingHorizontal: 18, paddingVertical: 6,
  },
  timeInput: { fontSize: 36, fontWeight: "800", color: "#1a1a2e", flex: 1, padding: 0 },
  motivoInput: {
    backgroundColor: "#F7F9FC", borderRadius: 14, borderWidth: 1.5, borderColor: "#E8E8E8",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1a1a2e",
    minHeight: 96, marginBottom: 20, lineHeight: 20,
  },
  enviarBtn: {
    borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  enviarBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
