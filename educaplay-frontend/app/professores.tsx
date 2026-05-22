import { styles as s } from "../styles/ProfessoresStyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import api from "../src/services/api";

type Professor = {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  instituicao: string | null;
  foto?: string | null;
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

  // Modal state
  const [modalVisivel, setModalVisivel] = useState(false);
  const [profSelecionado, setProfSelecionado] = useState<Professor | null>(null);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false);

  useEffect(() => {
    api.get("/professores")
      .then((res) => setProfessores(res.data))
      .catch(() => Alert.alert("Erro", "Não foi possível carregar os professores."))
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
      Alert.alert("Erro", "Não foi possível carregar os horários de indisponibilidade.");
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

  const bloqueiosPorDia = DIAS.reduce<Record<string, Bloqueio[]>>((acc, dia) => {
    acc[dia] = bloqueios.filter((b) => b.diaSemana === dia);
    return acc;
  }, {});
  const semDia = bloqueios.filter((b) => !b.diaSemana);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Professores</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.counter}>
            {professores.length} {professores.length === 1 ? "professor cadastrado" : "professores cadastrados"}
          </Text>

          {professores.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>Nenhum professor cadastrado</Text>
              <Text style={s.emptySubtitle}>
                Os professores aparecerão aqui{"\n"}conforme se cadastrarem no aplicativo.
              </Text>
            </View>
          ) : (
            professores.map((prof) => (
              <TouchableOpacity
                key={prof.id}
                style={s.professorCard}
                onPress={() => abrirModal(prof)}
                activeOpacity={0.75}
              >
                <View style={s.professorAvatar}>
                  {prof.foto ? (
                    <Image source={{ uri: prof.foto }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person-circle-outline" size={48} color="#bbb" />
                  )}
                </View>
                <View style={s.professorInfo}>
                  <Text style={s.professorNome}>{prof.nome}</Text>
                  {prof.cargo ? (
                    <Text style={{ fontSize: 12, color: "#7a7f9a" }}>{prof.cargo}</Text>
                  ) : null}
                  {prof.instituicao ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="school-outline" size={13} color="#7a7f9a" />
                      <Text style={{ fontSize: 12, color: "#7a7f9a" }}>{prof.instituicao}</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal de indisponibilidades */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={fecharModal}
      >
        <View style={m.overlay}>
          <View style={m.sheet}>
            {/* Handle */}
            <View style={m.handle} />

            {/* Header */}
            <View style={m.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={m.sheetTitle}>{profSelecionado?.nome}</Text>
                <Text style={m.sheetSubtitle}>Horários de indisponibilidade</Text>
              </View>
              <TouchableOpacity onPress={fecharModal} style={m.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#1a1a2e" />
              </TouchableOpacity>
            </View>

            <ScrollView style={m.sheetScroll} contentContainerStyle={m.sheetScrollContent} showsVerticalScrollIndicator={false}>
              {carregandoBloqueios ? (
                <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#3a7d44" />
              ) : bloqueios.length === 0 ? (
                <View style={m.empty}>
                  <Ionicons name="calendar-outline" size={40} color="#ccc" />
                  <Text style={m.emptyText}>Nenhum bloqueio cadastrado.</Text>
                  <Text style={m.emptySubText}>Este professor não tem horários de indisponibilidade registrados.</Text>
                </View>
              ) : (
                <>
                  {DIAS.map((dia) =>
                    bloqueiosPorDia[dia].length === 0 ? null : (
                      <View key={dia} style={{ marginBottom: 12 }}>
                        <View style={m.diaHeader}>
                          <Ionicons name="calendar-outline" size={14} color="#3a7d44" />
                          <Text style={m.diaHeaderText}>{dia}</Text>
                        </View>
                        {bloqueiosPorDia[dia].map((b) => (
                          <BloqueioRow key={b.id} b={b} />
                        ))}
                      </View>
                    )
                  )}
                  {semDia.length > 0 && (
                    <View style={{ marginBottom: 4 }}>
                      <View style={m.diaHeader}>
                        <Ionicons name="time-outline" size={14} color="#888" />
                        <Text style={[m.diaHeaderText, { color: "#888" }]}>Sem dia específico</Text>
                      </View>
                      {semDia.map((b) => (
                        <BloqueioRow key={b.id} b={b} />
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BloqueioRow({ b }: { b: Bloqueio }) {
  return (
    <View style={m.bloqueioCard}>
      <View style={m.bloqueioIconWrap}>
        <Ionicons name="ban-outline" size={16} color="#ef4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={m.bloqueioHorario}>{b.timeStart} – {b.timeEnd}</Text>
        {b.descricao ? <Text style={m.bloqueioDesc}>{b.descricao}</Text> : null}
      </View>
    </View>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "75%",
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  sheetSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sheetScroll: { flex: 1, minHeight: 0 },
  sheetScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#999" },
  emptySubText: { fontSize: 13, color: "#bbb", textAlign: "center" },
  diaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  diaHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3a7d44",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bloqueioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE4E4",
  },
  bloqueioIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFE4E4",
    alignItems: "center",
    justifyContent: "center",
  },
  bloqueioHorario: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  bloqueioDesc: { fontSize: 12, color: "#666", marginTop: 2 },
});
