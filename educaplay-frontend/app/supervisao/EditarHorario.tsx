import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type Professor = { id: string; nome: string; materias: string[] };
type TipoSlot = "aula" | "intervalo";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function EditarHorarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    timeStart: string;
    timeEnd: string;
    subject: string;
    teacher: string;
    turno: string;
    isInterval: string;
    diaSemana: string;
  }>();

  const isIntervalOriginal = params.isInterval === "true";
  const [tipoSlot, setTipoSlot] = useState<TipoSlot>(isIntervalOriginal ? "intervalo" : "aula");
  const [diaSemana, setDiaSemana] = useState<string | null>(params.diaSemana || null);
  const [materia, setMateria] = useState(isIntervalOriginal ? "" : params.subject);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const mostrar = (titulo: string, mensagem: string, tipo: "erro" | "aviso" = "aviso") => setModalInfo({ visivel: true, titulo, mensagem, tipo });

  useEffect(() => {
    api.get("/professores")
      .then((rp) => setProfessores(rp.data))
      .catch(() => mostrar("Erro", "Não foi possível carregar os professores.", "erro"))
      .finally(() => setCarregando(false));
  }, []);

  const handleSalvar = async () => {
    if (tipoSlot === "aula") {
      if (!materia.trim()) { mostrar("Atenção", "Informe o nome da matéria."); return; }
      if (!professorSelecionado) { mostrar("Atenção", "Selecione um professor."); return; }
    }
    setSalvando(true);
    try {
      await api.put(`/aulas/${params.id}`, {
        subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
        timeStart: params.timeStart,
        timeEnd: params.timeEnd,
        isInterval: tipoSlot === "intervalo",
        diaSemana: diaSemana || null,
        professorId: tipoSlot === "intervalo" ? null : professorSelecionado?.id,
        salaId: null,
      });
      router.back();
    } catch {
      mostrar("Erro", "Não foi possível salvar o horário.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    setModalConfirmar(false);
    try {
      await api.delete(`/aulas/${params.id}`);
      router.back();
    } catch {
      mostrar("Erro", "Não foi possível excluir.", "erro");
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Horário</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSalvar} disabled={salvando} activeOpacity={0.7}>
          {salvando ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de horário */}
        <View style={ehEx.horarioBanner}>
          <View style={ehEx.horarioIconBox}>
            <Ionicons name="time-outline" size={22} color="#3a7d44" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ehEx.horarioLabel}>Horário da aula</Text>
            <Text style={ehEx.horarioValue}>{params.timeStart} – {params.timeEnd}</Text>
          </View>
          <View style={ehEx.lockBadge}>
            <Ionicons name="lock-closed-outline" size={13} color="#9CA3AF" />
            <Text style={ehEx.lockText}>Fixo</Text>
          </View>
        </View>

        {/* Tipo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tipo do horário</Text>
          <View style={ehEx.tipoRow}>
            <TouchableOpacity
              style={[ehEx.tipoBtn, tipoSlot === "aula" && ehEx.tipoBtnActive]}
              onPress={() => setTipoSlot("aula")}
              activeOpacity={0.8}
            >
              <View style={[ehEx.tipoBtnIcon, { backgroundColor: tipoSlot === "aula" ? "#3a7d44" : "#F3F4F6" }]}>
                <Ionicons name="book-outline" size={18} color={tipoSlot === "aula" ? "#fff" : "#9CA3AF"} />
              </View>
              <Text style={[ehEx.tipoBtnText, tipoSlot === "aula" && ehEx.tipoBtnTextActive]}>Aula</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ehEx.tipoBtn, tipoSlot === "intervalo" && ehEx.tipoBtnActive]}
              onPress={() => setTipoSlot("intervalo")}
              activeOpacity={0.8}
            >
              <View style={[ehEx.tipoBtnIcon, { backgroundColor: tipoSlot === "intervalo" ? "#92400e" : "#F3F4F6" }]}>
                <Ionicons name="cafe-outline" size={18} color={tipoSlot === "intervalo" ? "#fff" : "#9CA3AF"} />
              </View>
              <Text style={[ehEx.tipoBtnText, tipoSlot === "intervalo" && { color: "#92400e", fontWeight: "800" }]}>Intervalo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tipoSlot === "intervalo" ? (
          <View style={ehEx.intervaloBanner}>
            <View style={ehEx.intervaloBannerIcon}>
              <Ionicons name="cafe-outline" size={20} color="#92400e" />
            </View>
            <Text style={ehEx.intervaloBannerText}>
              Marcado como intervalo. Sem professor ou matéria.
            </Text>
          </View>
        ) : (
          <>
            {/* Matéria */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Matéria</Text>
              <TextInput
                style={ehEx.materiaInput}
                value={materia}
                onChangeText={setMateria}
                placeholder="Ex: Matemática, Português..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Professor */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Professor</Text>
              {carregando ? (
                <ActivityIndicator color="#3a7d44" style={{ marginTop: 16 }} />
              ) : professores.length === 0 ? (
                <View style={s.emptyProfessores}>
                  <Ionicons name="person-outline" size={32} color="#D1D5DB" />
                  <Text style={s.emptyProfessoresText}>Nenhum professor cadastrado.</Text>
                </View>
              ) : (
                professores.map((prof, idx) => {
                  const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2"];
                  const cor = CORES[idx % CORES.length];
                  const inicial = prof.nome.trim()[0]?.toUpperCase() ?? "P";
                  const selected = professorSelecionado?.id === prof.id;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[s.professorCard, selected && s.professorCardSelected]}
                      onPress={() => setProfessorSelecionado(selected ? null : prof)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.professorAvatar, { backgroundColor: cor + "20" }]}>
                        <Text style={{ fontSize: 18, fontWeight: "800", color: cor }}>{inicial}</Text>
                      </View>
                      <View style={s.professorInfo}>
                        <Text style={s.professorNome}>{prof.nome}</Text>
                        {prof.materias.length > 0 && (
                          <Text style={s.professorMaterias} numberOfLines={1}>{prof.materias.join(" · ")}</Text>
                        )}
                      </View>
                      {selected && (
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        <TouchableOpacity onPress={() => setModalConfirmar(true)} style={ehDel.btn} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={17} color="#ef4444" />
          <Text style={ehDel.btnText}>Excluir este horário</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal info */}
      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={ehMod.overlay}>
          <View style={ehMod.box}>
            <View style={[ehMod.iconWrap, { backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : "#FEF3C7" }]}>
              <Ionicons name={modalInfo.tipo === "erro" ? "alert-circle" : "information-circle"} size={30} color={modalInfo.tipo === "erro" ? "#ef4444" : "#f59e0b"} />
            </View>
            <Text style={ehMod.titulo}>{modalInfo.titulo}</Text>
            <Text style={ehMod.mensagem}>{modalInfo.mensagem}</Text>
            <TouchableOpacity style={[ehMod.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : "#3a7d44" }]} onPress={() => setModalInfo(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={ehMod.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal visible={modalConfirmar} transparent animationType="fade" onRequestClose={() => setModalConfirmar(false)}>
        <View style={ehMod.overlay}>
          <View style={ehMod.box}>
            <View style={[ehMod.iconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="trash-outline" size={30} color="#ef4444" />
            </View>
            <Text style={ehMod.titulo}>Excluir horário</Text>
            <Text style={ehMod.mensagem}>Tem certeza? Esta ação não pode ser desfeita.</Text>
            <View style={ehMod.botoesRow}>
              <TouchableOpacity style={ehMod.btnCancelar} onPress={() => setModalConfirmar(false)} activeOpacity={0.8}>
                <Text style={ehMod.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ehMod.btn, { backgroundColor: "#ef4444", flex: 1 }]} onPress={confirmarExclusao} activeOpacity={0.85}>
                <Text style={ehMod.btnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const eh = StyleSheet.create({
  diasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent" },
  chipActive: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "#3a7d44" },
});

const ehEx = StyleSheet.create({
  horarioBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  horarioIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  horarioLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  horarioValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  lockText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },

  tipoRow: { flexDirection: "row", gap: 10 },
  tipoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tipoBtnActive: { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" },
  tipoBtnIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipoBtnText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF", flex: 1 },
  tipoBtnTextActive: { color: "#3a7d44", fontWeight: "800" },

  intervaloBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFF8F0", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#FDE68A",
  },
  intervaloBannerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  intervaloBannerText: { flex: 1, fontSize: 13, color: "#92400e", fontWeight: "500", lineHeight: 18 },

  materiaInput: {
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: "#111827", fontWeight: "500",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
});

const ehDel = StyleSheet.create({
  btn: {
    marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 16, paddingVertical: 15,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  btnText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});

const ehMod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  titulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  mensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21, marginBottom: 4 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  botoesRow: { flexDirection: "row", gap: 10, width: "100%" },
  btnCancelar: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  cancelarText: { fontSize: 15, fontWeight: "600", color: "#555" },
});
