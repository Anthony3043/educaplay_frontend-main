import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
      Alert.alert("Erro", "Não foi possível carregar os dados.");
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
      <StatusBar barStyle="dark-content" />

      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Pontos do Dia</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Seletor de dia */}
      <View style={st.diasBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.diasScroll}>
          {DIAS.map((dia) => (
            <TouchableOpacity
              key={dia}
              style={[st.diaChip, diaSelecionado === dia && st.diaChipAtivo]}
              onPress={() => carregarDia(dia)}
              activeOpacity={0.75}
            >
              <Text style={[st.diaChipText, diaSelecionado === dia && st.diaChipTextAtivo]}>
                {dia}
              </Text>
            </TouchableOpacity>
          ))}
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
          <View style={st.resumoRow}>
            <View style={[st.resumoCard, { borderColor: "#86efac", backgroundColor: "#e8f5ea" }]}>
              <Text style={[st.resumoNum, { color: "#3a7d44" }]}>{bateram.length}</Text>
              <Text style={[st.resumoLabel, { color: "#3a7d44" }]}>Bateram ponto</Text>
            </View>
            <View style={[st.resumoCard, { borderColor: "#fca5a5", backgroundColor: "#fef2f2" }]}>
              <Text style={[st.resumoNum, { color: "#ef4444" }]}>{naoBateram.length}</Text>
              <Text style={[st.resumoLabel, { color: "#ef4444" }]}>Não bateram</Text>
            </View>
            <View style={[st.resumoCard, { borderColor: "#d1d5db", backgroundColor: "#f9fafb" }]}>
              <Text style={[st.resumoNum, { color: "#6b7280" }]}>{itens.length}</Text>
              <Text style={[st.resumoLabel, { color: "#6b7280" }]}>Total de aulas</Text>
            </View>
          </View>

          {/* Não bateram */}
          {naoBateram.length > 0 && (
            <>
              <View style={st.secaoHeader}>
                <View style={[st.secaoDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[st.secaoTitulo, { color: "#ef4444" }]}>Não bateram ponto</Text>
              </View>
              {naoBateram.map((item) => (
                <View key={item.aulaId} style={[st.card, st.cardErro]}>
                  <View style={st.cardInfo}>
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
                            <Text style={st.cardSala} numberOfLines={1}>
                              {item.sala.nome}{item.sala.turma ? ` — ${item.sala.turma}` : ""}
                            </Text>
                          </View>
                        )}
                      </View>
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
                      : <>
                          <Ionicons name="notifications-outline" size={14} color="#fff" />
                          <Text style={st.btnNotificarText}>Notificar</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Bateram */}
          {bateram.length > 0 && (
            <>
              <View style={st.secaoHeader}>
                <View style={[st.secaoDot, { backgroundColor: "#3a7d44" }]} />
                <Text style={[st.secaoTitulo, { color: "#3a7d44" }]}>Bateram ponto</Text>
              </View>
              {bateram.map((item) => (
                <View key={item.aulaId} style={[st.card, st.cardOk]}>
                  <View style={st.cardTop}>
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
                          <Text style={st.cardSala} numberOfLines={1}>
                            {item.sala.nome}{item.sala.turma ? ` — ${item.sala.turma}` : ""}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={st.okBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#3a7d44" />
                      {item.pontoTimestamp && (
                        <Text style={st.okHora}>{formatarHora(item.pontoTimestamp)}</Text>
                      )}
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
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },

  diasBox: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  diasScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  diaChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0F0F0", borderWidth: 1.5, borderColor: "transparent",
  },
  diaChipAtivo: { backgroundColor: "#e8f5ea", borderColor: "#3a7d44" },
  diaChipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  diaChipTextAtivo: { color: "#3a7d44" },

  vazio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  vazioTitulo: { fontSize: 16, fontWeight: "700", color: "#bbb" },
  vazioSub: { fontSize: 13, color: "#ccc", textAlign: "center" },

  scroll: { padding: 16, gap: 8, paddingBottom: 40 },

  resumoRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  resumoCard: {
    flex: 1, alignItems: "center", borderRadius: 14, padding: 12,
    borderWidth: 1.5, gap: 2,
  },
  resumoNum: { fontSize: 22, fontWeight: "800" },
  resumoLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  secaoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  secaoDot: { width: 10, height: 10, borderRadius: 5 },
  secaoTitulo: { fontSize: 14, fontWeight: "700" },

  card: {
    borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardErro: { backgroundColor: "#fffafa", borderColor: "#fca5a5" },
  cardOk: { backgroundColor: "#f9fffe", borderColor: "#bbf7d0" },
  cardInfo: { gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  horaBadge: {
    alignItems: "center", borderRadius: 10, paddingVertical: 8,
    paddingHorizontal: 6, minWidth: 52, gap: 2,
  },
  horaText: { fontSize: 13, fontWeight: "800" },
  horaEndText: { fontSize: 10, fontWeight: "600" },
  cardSubject: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 2 },
  cardProfessor: { fontSize: 12, color: "#555", fontWeight: "600" },
  cardSalaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardSala: { fontSize: 11, color: "#aaa", flex: 1 },
  okBadge: { alignItems: "center", gap: 3 },
  okHora: { fontSize: 10, color: "#3a7d44", fontWeight: "600" },

  btnNotificar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#ef4444", borderRadius: 10, paddingVertical: 9,
  },
  btnNotificarText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Modal feedback
  fbOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  fbBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 28, alignItems: "center", gap: 10 },
  fbIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  fbTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  fbMensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
  fbBtn: { marginTop: 8, width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  fbBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
