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

type Status = "batido" | "na_hora" | "atrasado" | "falta" | "pendente";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_SEMANA: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

const STATUS_CONFIG: Record<Status, { label: string; cor: string; bg: string; bordaBg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  batido:   { label: "Batido",    cor: "#16a34a", bg: "#f0fdf4", bordaBg: "#bbf7d0", icon: "checkmark-circle"     },
  na_hora:  { label: "Na hora",   cor: "#d97706", bg: "#fffbeb", bordaBg: "#fde68a", icon: "time"                 },
  atrasado: { label: "Atrasado",  cor: "#ea580c", bg: "#fff7ed", bordaBg: "#fed7aa", icon: "alert-circle"         },
  falta:    { label: "Falta",     cor: "#dc2626", bg: "#fef2f2", bordaBg: "#fca5a5", icon: "close-circle"         },
  pendente: { label: "Pendente",  cor: "#6366f1", bg: "#f5f3ff", bordaBg: "#c4b5fd", icon: "ellipse-outline"      },
};

function toMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function getStatus(item: ItemResumo, diaSelecionado: string): Status {
  if (item.pontoBatido) return "batido";

  const hoje = new Date();
  const hojeNum = hoje.getDay();
  const diaNum = DIAS_SEMANA[diaSelecionado] ?? -1;

  // Dia passado desta semana → falta
  if (diaNum < hojeNum) return "falta";
  // Dia futuro desta semana → pendente
  if (diaNum > hojeNum) return "pendente";

  // É hoje → avaliar pelo horário
  const agora = hoje.getHours() * 60 + hoje.getMinutes();
  const inicio = toMinutos(item.timeStart);
  const fim    = toMinutos(item.timeEnd);
  const GRACA  = 30; // minutos de tolerância após fim da aula

  if (agora < inicio)               return "pendente";
  if (agora <= inicio + 15)         return "na_hora";
  if (agora <= fim + GRACA)         return "atrasado";
  return "falta";
}

type GrupoHorario = {
  timeStart: string;
  timeEnd: string;
  itens: (ItemResumo & { status: Status })[];
};

function agruparPorHorario(itens: ItemResumo[], dia: string): GrupoHorario[] {
  const mapa: Record<string, GrupoHorario> = {};
  itens.forEach((item) => {
    const key = `${item.timeStart}-${item.timeEnd}`;
    if (!mapa[key]) mapa[key] = { timeStart: item.timeStart, timeEnd: item.timeEnd, itens: [] };
    mapa[key].itens.push({ ...item, status: getStatus(item, dia) });
  });
  return Object.values(mapa).sort((a, b) => toMinutos(a.timeStart) - toMinutos(b.timeStart));
}

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
      setFeedback({ visivel: true, tipo: "sucesso", mensagem: `${item.professor.nome} foi notificado.` });
    } catch {
      setFeedback({ visivel: true, tipo: "erro", mensagem: "Não foi possível enviar a notificação." });
    } finally {
      setNotificando(null);
    }
  };

  const formatarHora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const grupos = diaSelecionado ? agruparPorHorario(itens, diaSelecionado) : [];

  // Contagens para o resumo
  const contagens = itens.reduce((acc, item) => {
    const s = getStatus(item, diaSelecionado ?? "");
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {} as Record<Status, number>);

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
          <Text style={st.vazioSub}>Veja o status dos pontos de cada aula</Text>
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

          {/* Resumo com legenda de cores */}
          <View style={st.resumoCard}>
            <View style={st.resumoRow}>
              {(["batido", "na_hora", "atrasado", "falta", "pendente"] as Status[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const count = contagens[s] ?? 0;
                return (
                  <View key={s} style={st.resumoItem}>
                    <View style={[st.resumoDot, { backgroundColor: cfg.cor }]} />
                    <Text style={[st.resumoNum, { color: cfg.cor }]}>{count}</Text>
                    <Text style={st.resumoLabel}>{cfg.label}</Text>
                  </View>
                );
              })}
            </View>
            {itens.length > 0 && (
              <View style={st.progressBarBg}>
                <View style={[st.progressBarFg, { width: `${Math.round(((contagens.batido ?? 0) / itens.length) * 100)}%` as any }]} />
              </View>
            )}
            <Text style={st.resumoPct}>
              {Math.round(((contagens.batido ?? 0) / itens.length) * 100)}% de presença confirmada
            </Text>
          </View>

          {/* Grupos por horário */}
          {grupos.map((grupo) => (
            <View key={`${grupo.timeStart}-${grupo.timeEnd}`}>
              {/* Header do grupo */}
              <View style={st.grupoHeader}>
                <View style={st.grupoHoraBadge}>
                  <Ionicons name="time-outline" size={13} color="#3a7d44" />
                  <Text style={st.grupoHoraText}>{grupo.timeStart}</Text>
                  <Text style={st.grupoHoraSep}>–</Text>
                  <Text style={st.grupoHoraText}>{grupo.timeEnd}</Text>
                </View>
                <View style={st.grupoLinha} />
                <Text style={st.grupoCount}>{grupo.itens.length} aula{grupo.itens.length !== 1 ? "s" : ""}</Text>
              </View>

              {/* Cards do grupo */}
              {grupo.itens.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                const podeNotificar = item.status === "falta" || item.status === "atrasado";
                return (
                  <View key={item.aulaId} style={[st.card, { borderColor: cfg.bordaBg, backgroundColor: cfg.bg }]}>
                    <View style={[st.cardBarLeft, { backgroundColor: cfg.cor }]} />
                    <View style={{ flex: 1, padding: 12 }}>
                      <View style={st.cardTop}>
                        {/* Badge de status */}
                        <View style={[st.statusBadge, { backgroundColor: cfg.cor + "18" }]}>
                          <Ionicons name={cfg.icon} size={16} color={cfg.cor} />
                          <Text style={[st.statusLabel, { color: cfg.cor }]}>{cfg.label}</Text>
                        </View>
                        {/* Hora que bateu */}
                        {item.pontoTimestamp && (
                          <View style={st.horaBatidaBadge}>
                            <Ionicons name="checkmark" size={11} color="#16a34a" />
                            <Text style={st.horaBatidaText}>{formatarHora(item.pontoTimestamp)}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={st.cardSubject} numberOfLines={1}>{item.subject}</Text>
                      <View style={st.cardInfoRow}>
                        <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                        <Text style={st.cardProfessor} numberOfLines={1}>{item.professor.nome}</Text>
                      </View>
                      {item.sala && (
                        <View style={st.cardInfoRow}>
                          <Ionicons name="business-outline" size={12} color="#9CA3AF" />
                          <Text style={st.cardSala} numberOfLines={1}>
                            {item.sala.nome}{item.sala.turma ? ` — ${item.sala.turma}` : ""}
                          </Text>
                        </View>
                      )}

                      {podeNotificar && (
                        <TouchableOpacity
                          style={[st.btnNotificar, { backgroundColor: cfg.cor }, notificando === item.aulaId && { opacity: 0.6 }]}
                          onPress={() => handleNotificar(item)}
                          disabled={notificando === item.aulaId}
                          activeOpacity={0.8}
                        >
                          {notificando === item.aulaId
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Ionicons name="send-outline" size={13} color="#fff" /><Text style={st.btnNotificarText}>Notificar professor</Text></>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

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
  diaChipAtivo: { backgroundColor: "#3a7d44", borderColor: "#3a7d44", shadowColor: "#3a7d44", shadowOpacity: 0.3, elevation: 4 },
  diaAbrev: { fontSize: 10, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.5 },
  diaChipText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  diaChipTextAtivo: { color: "#fff" },

  vazio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  vazioTitulo: { fontSize: 17, fontWeight: "700", color: "#9CA3AF" },
  vazioSub: { fontSize: 13, color: "#D1D5DB", textAlign: "center", lineHeight: 19 },

  scroll: { padding: 16, gap: 10, paddingBottom: 40 },

  // Resumo
  resumoCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  resumoRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  resumoItem: { flex: 1, alignItems: "center", gap: 2 },
  resumoDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  resumoNum: { fontSize: 20, fontWeight: "800", lineHeight: 24 },
  resumoLabel: { fontSize: 9, fontWeight: "600", color: "#9CA3AF", textAlign: "center" },
  progressBarBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  progressBarFg: { height: 6, backgroundColor: "#16a34a", borderRadius: 3 },
  resumoPct: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 6, textAlign: "center" },

  // Grupo de horário
  grupoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 6 },
  grupoHoraBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f0fdf4", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  grupoHoraText: { fontSize: 12, fontWeight: "800", color: "#16a34a" },
  grupoHoraSep: { fontSize: 11, color: "#86efac" },
  grupoLinha: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  grupoCount: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },

  // Card de ponto
  card: {
    borderRadius: 16, borderWidth: 1.5, overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    marginBottom: 8,
  },
  cardBarLeft: { width: 5, alignSelf: "stretch" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  horaBatidaBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0fdf4", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  horaBatidaText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  cardSubject: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 },
  cardInfoRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  cardProfessor: { fontSize: 12, color: "#374151", fontWeight: "600", flex: 1 },
  cardSala: { fontSize: 11, color: "#9CA3AF", flex: 1 },

  btnNotificar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 10, paddingVertical: 9, marginTop: 8,
    elevation: 2,
  },
  btnNotificarText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  fbOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  fbBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 28, alignItems: "center", gap: 10 },
  fbIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  fbTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  fbMensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
  fbBtn: { marginTop: 8, width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  fbBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
