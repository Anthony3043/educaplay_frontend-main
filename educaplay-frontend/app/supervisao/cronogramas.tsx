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
      const res = await api.get("/supervisao/salas");
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
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cronogramas</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecione a Sala</Text>

            {salas.length === 0 ? (
              <View style={cs.empty}>
                <Ionicons name="business-outline" size={52} color="#ccc" />
                <Text style={cs.emptyTitle}>Nenhuma sala cadastrada</Text>
                <Text style={cs.emptyHint}>
                  Cadastre salas na seção "Salas" para criar cronogramas por sala.
                </Text>
              </View>
            ) : (
              <View style={cs.grid}>
                {salas.map((sala) => (
                  <TouchableOpacity
                    key={sala.id}
                    style={cs.card}
                    onPress={() =>
                      router.push({
                        pathname: "/supervisao/CronogramaSala",
                        params: {
                          salaId: sala.id,
                          salaNome: sala.nome,
                          salaTurma: sala.turma ?? "",
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={cs.cardIcon}>
                      <Ionicons name="business-outline" size={28} color="#3a7d44" />
                    </View>
                    <Text style={cs.cardNome} numberOfLines={2}>{sala.nome}</Text>
                    {sala.turma ? (
                      <Text style={cs.cardTurma} numberOfLines={1}>{sala.turma}</Text>
                    ) : null}
                    {sala.capacidade ? (
                      <View style={cs.cardCap}>
                        <Ionicons name="people-outline" size={11} color="#aaa" />
                        <Text style={cs.cardCapText}>{sala.capacidade}</Text>
                      </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginTop: 6 }} />
                  </TouchableOpacity>
                ))}
              </View>
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
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#aaa", textAlign: "center" },
  emptyHint: { fontSize: 13, color: "#ccc", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8F5EA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    gap: 4,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E8F5EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  cardNome: { fontSize: 14, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  cardTurma: { fontSize: 12, color: "#3a7d44", fontWeight: "600", textAlign: "center" },
  cardCap: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardCapText: { fontSize: 11, color: "#aaa" },
});
