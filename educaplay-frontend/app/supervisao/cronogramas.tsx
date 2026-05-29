import { styles as s } from "@/styles/Cronogramasstyles";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

type Sala = {
  id: string;
  nome: string;
  turma?: string | null;
  capacidade?: string | null;
};

const TABS = [
  { id: "home",          ionicon: "home-outline" as const,    label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

export default function CronogramasScreen() {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [activeTab, setActiveTab] = useState("cronograma");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get("/salas");
      setSalas(res.data);
    } catch {
      // silently fail
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push("/supervisao/home");
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 42 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecione a Sala</Text>

            {salas.length === 0 ? (
              <View style={cs.empty}>
                <View style={cs.emptyIconWrap}>
                  <Ionicons name="business-outline" size={36} color="#3a7d44" />
                </View>
                <Text style={cs.emptyTitle}>Nenhuma sala cadastrada</Text>
                <Text style={cs.emptyHint}>Cadastre salas em "Salas" para criar cronogramas por turma.</Text>
              </View>
            ) : (
              <>
                <View style={cs.gridHeader}>
                  <Text style={cs.gridCount}>{salas.length} sala{salas.length > 1 ? "s" : ""}</Text>
                  <Text style={cs.gridSub}>Selecione para ver o cronograma</Text>
                </View>
                <View style={cs.grid}>
                  {salas.map((sala, idx) => {
                    const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2","#d97706","#059669"];
                    const cor = CORES[idx % CORES.length];
                    const inicial = sala.nome.trim()[0]?.toUpperCase() ?? "S";
                    return (
                      <TouchableOpacity
                        key={sala.id}
                        style={cs.card}
                        onPress={() => router.push({ pathname: "/supervisao/CronogramaSala", params: { salaId: sala.id, salaNome: sala.nome, salaTurma: sala.turma ?? "" } })}
                        activeOpacity={0.78}
                      >
                        <Ionicons name="business-outline" size={80} color={cor + "0E"} style={{ position: "absolute", top: -10, right: -10 }} />
                        <View style={[cs.cardAccent, { backgroundColor: cor }]} />
                        <View style={[cs.cardBadge, { backgroundColor: cor + "18", borderColor: cor + "35" }]}>
                          <Text style={[cs.cardBadgeText, { color: cor }]}>{inicial}</Text>
                        </View>
                        <View style={cs.cardBody}>
                          <Text style={cs.cardNome} numberOfLines={1}>{sala.nome}</Text>
                          {sala.turma ? <View style={[cs.turmaPill, { backgroundColor: cor + "15" }]}><Text style={[cs.cardTurma, { color: cor }]}>{sala.turma}</Text></View> : null}
                          {sala.capacidade ? (
                            <View style={cs.cardCap}>
                              <Ionicons name="people-outline" size={11} color="#9CA3AF" />
                              <Text style={cs.cardCapText}>{sala.capacidade} carteiras</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[cs.cardArrow, { backgroundColor: cor }]}>
                          <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: "#E8F5EA", alignItems: "center", justifyContent: "center", marginBottom: 4, borderWidth: 1.5, borderColor: "#BBF7D0" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#6B7280", textAlign: "center" },
  emptyHint: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },

  gridHeader: { marginBottom: 14 },
  gridCount: { fontSize: 22, fontWeight: "800", color: "#111827" },
  gridSub: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  grid: { gap: 12 },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20, overflow: "hidden",
    paddingVertical: 16, paddingRight: 14, paddingLeft: 0,
    gap: 0, borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardAccent: { width: 5, alignSelf: "stretch", marginRight: 14 },
  cardBadge: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginRight: 14, borderWidth: 1.5,
  },
  cardBadgeText: { fontSize: 22, fontWeight: "800" },
  cardBody: { flex: 1, gap: 4 },
  cardNome: { fontSize: 16, fontWeight: "800", color: "#111827" },
  turmaPill: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  cardTurma: { fontSize: 11, fontWeight: "700" },
  cardCap: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardCapText: { fontSize: 11, color: "#9CA3AF" },
  cardArrow: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: 8 },
});
