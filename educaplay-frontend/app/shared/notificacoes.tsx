import { styles as s } from "@/styles/configuracoesstyles";
import { Colors } from "@/src/constants/colors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StatusBar,
  Switch, Text, TouchableOpacity, View, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../src/services/api";
import { agendarLembretes, cancelarLembretes } from "../hooks/useNotifications";
import { useAuth } from "../context/AuthContext";


type Notificacao = { id: string; icon: string; titulo: string; mensagem: string; lida: boolean; createdAt: string };
type Tab = "recebidas" | "preferencias";

const PREFS_ITEMS = [
  { id: "cronograma", ionicon: "calendar-outline" as const, title: "Atualizações de Cronograma", subtitle: "Avisos quando um horário for alterado" },
  { id: "professores", ionicon: "people-outline" as const, title: "Professores", subtitle: "Novos cadastros e alterações" },
  { id: "salas", ionicon: "grid-outline" as const, title: "Salas", subtitle: "Conflitos e disponibilidade de salas" },
  { id: "lembretes", ionicon: "alarm-outline" as const, title: "Lembretes", subtitle: "Lembrete diário de horários" },
  { id: "sistema", ionicon: "construct-outline" as const, title: "Atualizações do sistema", subtitle: "Novidades e melhorias do app" },
];

function formatarTempo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const PREFS_KEY = '@educaplay_notif_prefs';
const PREFS_DEFAULT = { cronograma: true, professores: true, salas: false, lembretes: true, sistema: false };

export default function NotificacoesScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [tab, setTab] = useState<Tab>("recebidas");
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(PREFS_DEFAULT);

  useEffect(() => {
    carregar();
    carregarPrefs();
  }, []);

  const carregarPrefs = async () => {
    try {
      const salvo = await AsyncStorage.getItem(PREFS_KEY);
      if (salvo) setPrefs(JSON.parse(salvo));
    } catch {}
  };

  const salvarPref = async (id: string, valor: boolean) => {
    const novas = { ...prefs, [id]: valor };
    setPrefs(novas);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(novas));

    if (id === 'lembretes' && usuario?.papel === 'Professor') {
      if (valor) {
        try {
          const res = await api.get('/supervisao/cronogramas');
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
      const res = await api.get("/shared/notificacoes");
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
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
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

  const limparTodas = () =>
    Alert.alert("Limpar notificações", "Deseja remover todas as notificações?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: async () => {
        try {
          await api.delete("/shared/notificacoes");
          setNotifs([]);
        } catch {}
      }},
    ]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notificações</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={ls.tabRow}>
        <TouchableOpacity style={[ls.tabBtn, tab === "recebidas" && ls.tabBtnActive]} onPress={() => setTab("recebidas")}>
          <Text style={[ls.tabBtnText, tab === "recebidas" && ls.tabBtnTextActive]}>
            Recebidas {naoLidas > 0 ? `(${naoLidas})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ls.tabBtn, tab === "preferencias" && ls.tabBtnActive]} onPress={() => setTab("preferencias")}>
          <Text style={[ls.tabBtnText, tab === "preferencias" && ls.tabBtnTextActive]}>Preferências</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 10 }} showsVerticalScrollIndicator={false}>
        {tab === "recebidas" ? (
          carregando ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3a7d44" /> : (
            <>
              {notifs.length > 0 && (
                <View style={ls.acoes}>
                  <TouchableOpacity onPress={marcarTodasLidas} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="checkmark-done-outline" size={14} color={Colors.primary} /><Text style={ls.acaoText}>Marcar todas como lidas</Text></TouchableOpacity>
                  <TouchableOpacity onPress={limparTodas} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="trash-outline" size={14} color={Colors.error} /><Text style={[ls.acaoText, { color: Colors.error }]}>Limpar tudo</Text></TouchableOpacity>
                </View>
              )}
              {notifs.length === 0 ? (
                <View style={ls.empty}>
                  <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                  <Text style={ls.emptyTitle}>Nenhuma notificação</Text>
                  <Text style={ls.emptySubtitle}>Você está em dia com tudo!</Text>
                </View>
              ) : (
                notifs.map((notif) => (
                  <TouchableOpacity key={notif.id} style={[ls.notifCard, !notif.lida && ls.notifCardUnread]}
                    activeOpacity={0.75} onPress={() => marcarLida(notif.id)}>
                    <View style={ls.notifIconWrapper}>
                      <Text style={{ fontSize: 22 }}>{notif.icon}</Text>
                      {!notif.lida && <View style={ls.unreadDot} />}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[ls.notifTitulo, !notif.lida && { color: Colors.textPrimary, fontWeight: "700" }]}>{notif.titulo}</Text>
                      <Text style={ls.notifMensagem}>{notif.mensagem}</Text>
                      <Text style={ls.notifTempo}>{formatarTempo(notif.createdAt)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deletar(notif.id)} style={ls.deleteBtn}>
                      <Ionicons name="close" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </>
          )
        ) : (
          <>
            <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginBottom: 4 }}>PREFERÊNCIAS</Text>
            {PREFS_ITEMS.map((item) => (
              <View key={item.id} style={[s.configItem, { justifyContent: "space-between" }]}>
                <View style={s.configIcon}><Ionicons name={item.ionicon} size={20} color="#1a1a2e" /></View>
                <View style={s.configContent}>
                  <Text style={s.configTitle}>{item.title}</Text>
                  <Text style={s.configSubtitle}>{item.subtitle}</Text>
                </View>
                <Switch value={prefs[item.id]} onValueChange={(val) => salvarPref(item.id, val)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={prefs[item.id] ? Colors.primary : Colors.textMuted} />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  tabRow: { flexDirection: "row", backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  tabBtnTextActive: { color: Colors.primary },
  acoes: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  acaoText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  notifCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.border },
  notifCardUnread: { borderColor: Colors.primaryLight, backgroundColor: Colors.primarySurface },
  notifIconWrapper: { position: "relative", width: 36, alignItems: "center", paddingTop: 2 },
  unreadDot: { position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.surface },
  notifTitulo: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  notifMensagem: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  notifTempo: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted },
});
