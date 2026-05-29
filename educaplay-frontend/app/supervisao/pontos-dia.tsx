import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/services/api";

type ItemResumo = {
  aulaId: string;
  subject: string;
  timeStart: string;
  timeEnd: string;
  professor: { id: string; nome: string; expoPushToken?: string | null };
  sala: { id: string; nome: string; turma?: string | null } | null;
  pontoBatido: boolean;
  pontoTimestamp: string | null;
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type ModalFeedback = { visivel: boolean; tipo: "sucesso" | "erro"; mensagem: string };

export default function PontosDiaScreen() {
  const router = useRouter();
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [notificando, setNotificando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ModalFeedback>({ visivel: false, tipo: "sucesso", mensagem: "" });

  const carregarDia = async (dia: string) => {
    setDiaSelecionado(dia);
    setCarregando(true);
    try {
      const res = await api.get("/ponto/resumo-dia", { params: { diaSemana: dia } });
      setItens(res.data);
    } catch {
      setFeedback({ visivel: true, tipo: "erro", mensagem: "Não foi possível carregar os dados." });
    } finally {
      setCarregando(false);
    }
  };

  const handleNotificar = async (item: ItemResumo) => {
    if (!diaSelecionado) return;
    setNotificando(item.aulaId);
    try {
      await api.post("/ponto/notificar-falta", { aulaId: item.aulaId, diaSemana: diaSelecionado });
      setFeedback({ visivel: true, tipo: "sucesso", mensagem: `${item.professor.nome} foi notificado sobre a falta de ponto.` });
    } catch {
      setFeedback({ visivel: true, tipo: "erro", mensagem: "Não foi possível enviar a notificação. Tente novamente." });
    } finally {
      setNotificando(null);
    }
  };

  const bateram = itens.filter((i) => i.pontoBatido);
  const naoBateram = itens.filter((i) => !i.pontoBatido);

  const formatarHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Pontos do Dia</Text>
        <View style={st.headerBadge}>
          <Ionicons name="finger-print-outline" size={20} color="rgba(255,255,255,0.85)" />
        </View>
      </View>

      {/* Seletor de dia */}
      <View style={st.diasBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.diasScroll}>
          {DIAS.map((dia) => {
            const ativo = diaSelecionado === dia;
            return (
              <TouchableOpacity
                key={dia}
                style={[st.diaChip, ativo && st.diaChipAtivo]}
                onPress={() => carregarDia(dia)}
                activeOpacity={0.75}
              >
                <Text style={[st.diaAbrev, ativo && { color: "#fff" }]}>{dia.slice(0, 3).toUpperCase()}</Text>
                <Text style={[st.diaChipText, ativo && st.diaChipTextAtivo]}>{dia}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!diaSelecionado ? (
        <View style={st.vazio}>
          <Ionicons name="calendar-outline" size={52} color="#ccc" />
          <Text style={st.vazioTitulo}>Selecione um dia</Text>
          <Text style={st.vazioSub}>Veja quais professores bateram ou não o ponto</Text>
        </View>
      ) : carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : itens.length === 0 ? (
        <View style={st.vazio}>
          <Ionicons name="checkmark-circle-outline" size={52} color="#ccc" />
          <Text style={st.vazioTitulo}>Nenhuma aula neste dia</Text>
          <Text style={st.vazioSub}>Não há aulas com professor atribuído em {diaSelecionado}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

          {/* Resumo */}
          <View style={st.resumoCard}>
            <View style={st.resumoRow}>
              <View style={st.resumoItem}>
                <Text style={[st.resumoNum, { color: "#3a7d44" }]}>{bateram.length}</Text>
                <Text style={st.resumoLabel}>Bateram</Text>
              </View>
              <View style={st.resumoSep} />
              <View style={st.resumoItem}>
                <Text style={[st.resumoNum, { color: "#ef4444" }]}>{naoBateram.length}</Text>
                <Text style={st.resumoLabel}>Não bateram</Text>
              </View>
              <View style={st.resumoSep} />
              <View style={st.resumoItem}>
                <Text style={[st.resumoNum, { color: "#374151" }]}>{itens.length}</Text>
                <Text style={st.resumoLabel}>Total</Text>
              </View>
            </View>
            {itens.length > 0 && (
              <View style={st.progressBarBg}>
                <View style={[st.progressBarFg, { width: `${Math.round((bateram.length / itens.length) * 100)}%` as any }]} />
              </View>
            )}
            <Text style={st.resumoPct}>
              {itens.length > 0 ? `${Math.round((bateram.length / itens.length) * 100)}% de presença` : "Sem dados"}
            </Text>
          </View>

          {/* Não bateram */}
          {naoBateram.length > 0 && (
            <>
              <View style={st.secaoHeader}>
                <View style={[st.secaoAccent, { backgroundColor: "#ef4444" }]} />
                <Text style={[st.secaoTitulo, { color: "#ef4444" }]}>Falta de ponto</Text>
                <View style={st.secaoBadge}><Text style={st.secaoBadgeText}>{naoBateram.length}</Text></View>
              </View>
              {naoBateram.map((item) => (
                <View key={item.aulaId} style={[st.card, st.cardErro]}>
                  <View style={[st.cardBarLeft, { backgroundColor: "#ef4444" }]} />
                  <View style={{ flex: 1, padding: 12 }}>
                    <View style={st.cardTop}>
                      <View style={[st.horaBadge, { backgroundColor: "#fef2f2" }]}>
                        <Text style={[st.horaText, { color: "#ef4444" }]}>{item.timeStart}</Text>
                        <Text style={[st.horaEndText, { color: "#fca5a5" }]}>{item.timeEnd}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.cardSubject} numberOfLines={1}>{item.subject}</Text>
                        <Text style={st.cardProfessor}>{item.professor.nome}</Text>
                        {item.sala && (
                          <View style={st.cardSalaRow}>
                            <Ionicons name="business-outline" size={11} color="#aaa" />
                            <Text style={st.cardSala} numberOfLines={1}>{item.sala.nome}{item.sala.turma ? ` — ${item.sala.turma}` : ""}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[st.btnNotificar, notificando === item.aulaId && { opacity: 0.6 }]}
                      onPress={() => handleNotificar(item)}
                      disabled={notificando === item.aulaId}
                      activeOpacity={0.8}
                    >
                      {notificando === item.aulaId
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <><Ionicons name="send-outline" size={13} color="#fff" /><Text style={st.btnNotificarText}>Notificar professor</Text></>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Bateram */}
          {bateram.length > 0 && (
            <>
              <View style={st.secaoHeader}>
                <View style={[st.secaoAccent, { backgroundColor: "#3a7d44" }]} />
                <Text style={[st.secaoTitulo, { color: "#3a7d44" }]}>Presença confirmada</Text>
                <View style={[st.secaoBadge, { backgroundColor: "#e8f5ea" }]}><Text style={[st.secaoBadgeText, { color: "#3a7d44" }]}>{bateram.length}</Text></View>
              </View>
              {bateram.map((item) => (
                <View key={item.aulaId} style={[st.card, st.cardOk]}>
                  <View style={[st.cardBarLeft, { backgroundColor: "#3a7d44" }]} />
                  <View style={{ flex: 1, padding: 12, flexDirection: "row", alignItems: "center" }}>
                    <View style={[st.horaBadge, { backgroundColor: "#e8f5ea" }]}>
                      <Text style={[st.horaText, { color: "#3a7d44" }]}>{item.timeStart}</Text>
                      <Text style={[st.horaEndText, { color: "#86efac" }]}>{item.timeEnd}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cardSubject} numberOfLines={1}>{item.subject}</Text>
                      <Text style={st.cardProfessor}>{item.professor.nome}</Text>
                      {item.sala && (
                        <View style={st.cardSalaRow}>
                          <Ionicons name="business-outline" size={11} color="#aaa" />
                          <Text style={st.cardSala} numberOfLines={1}>{item.sala.nome}{item.sala.turma ? ` — ${item.sala.turma}` : ""}</Text>
                        </View>
                      )}
                    </View>
                    <View style={st.okBadge}>
                      <View style={st.okCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                      {item.pontoTimestamp && <Text style={st.okHora}>{formatarHora(item.pontoTimestamp)}</Text>}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de feedback */}
      <Modal visible={feedback.visivel} transparent animationType="fade" onRequestClose={() => setFeedback((f) => ({ ...f, visivel: false }))}>
        <View style={st.fbOverlay}>
          <View style={st.fbBox}>
            <View style={[st.fbIconWrap, { backgroundColor: feedback.tipo === "sucesso" ? "#e8f5ea" : "#fef2f2" }]}>
              <Ionicons
                name={feedback.tipo === "sucesso" ? "checkmark-circle" : "alert-circle"}
                size={32}
                color={feedback.tipo === "sucesso" ? "#3a7d44" : "#ef4444"}
              />
            </View>
            <Text style={st.fbTitulo}>{feedback.tipo === "sucesso" ? "Notificação enviada" : "Erro"}</Text>
            <Text style={st.fbMensagem}>{feedback.mensagem}</Text>
            <TouchableOpacity
              style={[st.fbBtn, { backgroundColor: feedback.tipo === "sucesso" ? "#3a7d44" : "#ef4444" }]}
              onPress={() => setFeedback((f) => ({ ...f, visivel: false }))}
              activeOpacity={0.85}
            >
              <Text style={st.fbBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center" },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  diasBox: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  diasScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  diaChip: {
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, backgroundColor: "#F8F9FA",
    borderWidth: 1.5, borderColor: "#F1F5F9", gap: 2,
  },
  diaChipAtivo: {
    backgroundColor: "#3a7d44", borderColor: "#3a7d44",
    shadowColor: "#3a7d44", shadowOpacity: 0.3, elevation: 4,
  },
  diaAbrev: { fontSize: 10, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.5 },
  diaChipText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  diaChipTextAtivo: { color: "#fff" },

  vazio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  vazioTitulo: { fontSize: 17, fontWeight: "700", color: "#9CA3AF" },
  vazioSub: { fontSize: 13, color: "#D1D5DB", textAlign: "center", lineHeight: 19 },

  scroll: { padding: 16, gap: 10, paddingBottom: 40 },

  // Resumo unificado
  resumoCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  resumoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  resumoItem: { flex: 1, alignItems: "center" },
  resumoSep: { width: 1, height: 32, backgroundColor: "#F1F5F9" },
  resumoNum: { fontSize: 26, fontWeight: "800", lineHeight: 30 },
  resumoLabel: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  progressBarFg: { height: 6, backgroundColor: "#3a7d44", borderRadius: 3 },
  resumoPct: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 6, textAlign: "center" },

  secaoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 6 },
  secaoAccent: { width: 4, height: 18, borderRadius: 2 },
  secaoTitulo: { fontSize: 14, fontWeight: "800", flex: 1 },
  secaoBadge: { backgroundColor: "#fef2f2", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  secaoBadgeText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },

  card: {
    borderRadius: 16, borderWidth: 1.5, overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardBarLeft: { width: 5, alignSelf: "stretch" },
  cardErro: { backgroundColor: "#fffafa", borderColor: "#fca5a5" },
  cardOk: { backgroundColor: "#f9fffe", borderColor: "#bbf7d0" },
  cardInfo: { gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  horaBadge: {
    alignItems: "center", borderRadius: 10, paddingVertical: 8,
    paddingHorizontal: 6, minWidth: 52, gap: 2,
  },
  horaText: { fontSize: 13, fontWeight: "800" },
  horaEndText: { fontSize: 10, fontWeight: "600" },
  cardSubject: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 },
  cardProfessor: { fontSize: 12, color: "#374151", fontWeight: "600" },
  cardSalaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardSala: { fontSize: 11, color: "#9CA3AF", flex: 1 },
  okBadge: { alignItems: "center", gap: 4 },
  okCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center" },
  okHora: { fontSize: 10, color: "#3a7d44", fontWeight: "700" },

  btnNotificar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#ef4444", borderRadius: 10, paddingVertical: 10,
    shadowColor: "#ef4444", shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  btnNotificarText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Modal feedback
  fbOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  fbBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 28, alignItems: "center", gap: 10 },
  fbIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  fbTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  fbMensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
  fbBtn: { marginTop: 8, width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  fbBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
