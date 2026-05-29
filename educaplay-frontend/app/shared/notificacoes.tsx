import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../src/services/api";
import { agendarLembretes, cancelarLembretes } from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";

type Notificacao = {
  id: string;
  icon: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
};
type Tab = "recebidas" | "preferencias";

const PREFS_ITEMS = [
  {
    id: "ponto",
    ionicon: "finger-print-outline" as const,
    title: "Registro de Ponto",
    subtitle: "Avisos quando o ponto não for registrado",
    cor: "#ef4444",
    bg: "#fef2f2",
  },
  {
    id: "cronograma",
    ionicon: "calendar-outline" as const,
    title: "Cronograma",
    subtitle: "Alterações e atualizações de horários",
    cor: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    id: "mapaSala",
    ionicon: "grid-outline" as const,
    title: "Mapa de Sala",
    subtitle: "Mudanças no mapa de carteiras da sala",
    cor: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    id: "lembretes",
    ionicon: "alarm-outline" as const,
    title: "Lembretes de Aula",
    subtitle: "Lembrete diário antes do início das aulas",
    cor: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    id: "sistema",
    ionicon: "sparkles-outline" as const,
    title: "Novidades do App",
    subtitle: "Atualizações e melhorias do EducaPlay",
    cor: "#3a7d44",
    bg: "#e8f5ea",
  },
];

const PREFS_KEY = "@educaplay_notif_prefs";
const PREFS_DEFAULT: Record<string, boolean> = {
  ponto: true,
  cronograma: true,
  mapaSala: false,
  lembretes: true,
  sistema: false,
};

function formatarTempo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [tab, setTab] = useState<Tab>("recebidas");
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(PREFS_DEFAULT);
  const [modalLimpar, setModalLimpar] = useState(false);

  useEffect(() => {
    carregar();
    carregarPrefs();
  }, []);

  const carregarPrefs = async () => {
    try {
      const salvo = await AsyncStorage.getItem(PREFS_KEY);
      if (salvo) setPrefs({ ...PREFS_DEFAULT, ...JSON.parse(salvo) });
    } catch {}
  };

  const salvarPref = async (id: string, valor: boolean) => {
    const novas = { ...prefs, [id]: valor };
    setPrefs(novas);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(novas));
    if (id === "lembretes" && usuario?.papel === "Professor") {
      if (valor) {
        try {
          const res = await api.get("/cronogramas");
          const minhasAulas = res.data.flatMap((c: any) =>
            c.aulas.filter((a: any) => a.professorId === usuario.id && !a.isInterval)
          );
          await agendarLembretes(minhasAulas);
        } catch {}
      } else {
        await cancelarLembretes();
      }
    }
  };

  const carregar = async () => {
    try {
      const res = await api.get("/notificacoes");
      setNotifs(res.data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as notificações.");
    } finally {
      setCarregando(false);
    }
  };

  const naoLidas = notifs.filter((n) => !n.lida).length;

  const marcarLida = async (id: string) => {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } catch {}
  };

  const marcarTodasLidas = async () => {
    try {
      await api.patch("/notificacoes/todas/lidas");
      setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch {}
  };

  const deletar = async (id: string) => {
    try {
      await api.delete(`/notificacoes/${id}`);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const limparTodas = () => setModalLimpar(true);

  const confirmarLimpar = async () => {
    setModalLimpar(false);
    try {
      await api.delete("/notificacoes");
      setNotifs([]);
    } catch {}
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={st.headerTitle}>Notificações</Text>
          {naoLidas > 0 && tab === "recebidas" && (
            <Text style={st.headerSub}>{naoLidas} não lida{naoLidas > 1 ? "s" : ""}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs pill */}
      <View style={st.tabsWrap}>
        <View style={st.tabsPill}>
          <TouchableOpacity
            style={[st.tabPillBtn, tab === "recebidas" && st.tabPillBtnActive]}
            onPress={() => setTab("recebidas")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={14}
              color={tab === "recebidas" ? "#fff" : "#888"}
            />
            <Text style={[st.tabPillText, tab === "recebidas" && st.tabPillTextActive]}>
              Recebidas{naoLidas > 0 ? ` (${naoLidas})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.tabPillBtn, tab === "preferencias" && st.tabPillBtnActive]}
            onPress={() => setTab("preferencias")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={14}
              color={tab === "preferencias" ? "#fff" : "#888"}
            />
            <Text style={[st.tabPillText, tab === "preferencias" && st.tabPillTextActive]}>
              Preferências
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {tab === "recebidas" ? (
          carregando ? (
            <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#3a7d44" />
          ) : (
            <>
              {notifs.length > 0 && (
                <View style={st.acoesRow}>
                  <TouchableOpacity style={st.acaoBtnSec} onPress={marcarTodasLidas} activeOpacity={0.75}>
                    <Ionicons name="checkmark-done-outline" size={14} color="#3a7d44" />
                    <Text style={st.acaoTextSec}>Marcar todas como lidas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.acaoBtnDanger} onPress={limparTodas} activeOpacity={0.75}>
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    <Text style={st.acaoTextDanger}>Limpar tudo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {notifs.length === 0 ? (
                <View style={st.empty}>
                  <View style={st.emptyIconWrap}>
                    <Ionicons name="notifications-off-outline" size={36} color="#aaa" />
                  </View>
                  <Text style={st.emptyTitle}>Tudo em dia!</Text>
                  <Text style={st.emptySub}>Você não tem nenhuma notificação no momento.</Text>
                </View>
              ) : (
                notifs.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[st.card, !notif.lida && st.cardUnread]}
                    onPress={() => marcarLida(notif.id)}
                    activeOpacity={0.78}
                  >
                    {!notif.lida && <View style={st.cardAccent} />}
                    <View style={st.cardIconWrap}>
                      <Text style={{ fontSize: 22 }}>{notif.icon}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={[st.cardTitulo, !notif.lida && st.cardTituloUnread]} numberOfLines={1}>
                          {notif.titulo}
                        </Text>
                        <Text style={st.cardTempo}>{formatarTempo(notif.createdAt)}</Text>
                      </View>
                      <Text style={st.cardMensagem} numberOfLines={3}>{notif.mensagem}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deletar(notif.id)} style={st.deleteBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Ionicons name="close" size={15} color="#ccc" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </>
          )
        ) : (
          <>
            <View style={st.prefsHeader}>
              <Ionicons name="options-outline" size={16} color="#888" />
              <Text style={st.prefsHeaderText}>
                Escolha quais notificações deseja receber no aplicativo.
              </Text>
            </View>

            {PREFS_ITEMS.map((item) => (
              <View key={item.id} style={st.prefCard}>
                <View style={[st.prefIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.ionicon} size={20} color={item.cor} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.prefTitle}>{item.title}</Text>
                  <Text style={st.prefSubtitle}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={prefs[item.id] ?? false}
                  onValueChange={(val) => salvarPref(item.id, val)}
                  trackColor={{ false: "#e5e7eb", true: item.cor + "55" }}
                  thumbColor={prefs[item.id] ? item.cor : "#bbb"}
                />
              </View>
            ))}

            <View style={st.prefsRodape}>
              <Ionicons name="information-circle-outline" size={13} color="#aaa" />
              <Text style={st.prefsRodapeText}>
                Preferências salvas localmente neste dispositivo.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal limpar tudo */}
      <Modal visible={modalLimpar} transparent animationType="fade" onRequestClose={() => setModalLimpar(false)}>
        <View style={st.mlOverlay}>
          <View style={st.mlBox}>
            <View style={st.mlIconWrap}>
              <Ionicons name="trash-outline" size={30} color="#ef4444" />
            </View>
            <Text style={st.mlTitulo}>Limpar notificações</Text>
            <Text style={st.mlSub}>Todas as notificações serão removidas permanentemente.</Text>
            <View style={st.mlBtns}>
              <TouchableOpacity style={st.mlCancelar} onPress={() => setModalLimpar(false)} activeOpacity={0.8}>
                <Text style={st.mlCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.mlConfirmar} onPress={confirmarLimpar} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={15} color="#fff" />
                <Text style={st.mlConfirmarText}>Limpar tudo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  header: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#EFEFEF",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  headerSub: { fontSize: 11, color: "#3a7d44", fontWeight: "600", marginTop: 1 },

  tabsWrap: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  tabsPill: {
    flexDirection: "row", backgroundColor: "#F0F0F0",
    borderRadius: 12, padding: 3, gap: 2,
  },
  tabPillBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  tabPillBtnActive: { backgroundColor: "#3a7d44" },
  tabPillText: { fontSize: 13, fontWeight: "600", color: "#888" },
  tabPillTextActive: { color: "#fff" },

  scroll: { padding: 16, gap: 10, paddingBottom: 40 },

  acoesRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#EFEFEF",
  },
  acaoBtnSec: { flexDirection: "row", alignItems: "center", gap: 5 },
  acaoTextSec: { fontSize: 12, fontWeight: "600", color: "#3a7d44" },
  acaoBtnDanger: { flexDirection: "row", alignItems: "center", gap: 5 },
  acaoTextDanger: { fontSize: 12, fontWeight: "600", color: "#ef4444" },

  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: "#EFEFEF",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: "hidden",
  },
  cardUnread: {
    backgroundColor: "#fff",
    borderColor: "#bbf7d0",
    shadowOpacity: 0.08,
    elevation: 4,
  },
  cardAccent: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: "#3a7d44", borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center",
  },
  cardTitulo: { fontSize: 13, fontWeight: "600", color: "#666", flex: 1, marginRight: 8 },
  cardTituloUnread: { color: "#1a1a2e", fontWeight: "700" },
  cardMensagem: { fontSize: 12, color: "#888", lineHeight: 17 },
  cardTempo: { fontSize: 11, color: "#bbb", fontWeight: "500", flexShrink: 0 },
  deleteBtn: { paddingTop: 2 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#555" },
  emptySub: { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 19 },

  prefsHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fff", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#EFEFEF",
  },
  prefsHeaderText: { flex: 1, fontSize: 12, color: "#888", lineHeight: 17 },

  prefCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#EFEFEF",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  prefIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  prefTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  prefSubtitle: { fontSize: 12, color: "#888", lineHeight: 16 },

  prefsRodape: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 4,
  },
  prefsRodapeText: { fontSize: 11, color: "#bbb" },

  // Modal limpar tudo
  mlOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  mlBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 26, alignItems: "center", gap: 8 },
  mlIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  mlTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  mlSub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19, marginBottom: 4 },
  mlBtns: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  mlCancelar: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  mlCancelarText: { fontSize: 14, fontWeight: "600", color: "#555" },
  mlConfirmar: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#ef4444", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  mlConfirmarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
