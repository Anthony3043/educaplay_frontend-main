import { styles as s } from "../styles/ProfessoresStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../src/services/api";

type Professor = {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  instituicao: string | null;
  foto?: string | null;
};

export default function ProfessoresScreen() {
  const router = useRouter();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get("/professores")
      .then((res) => setProfessores(res.data))
      .catch(() => Alert.alert("Erro", "Não foi possível carregar os professores."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
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
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTitle}>Nenhum professor cadastrado</Text>
              <Text style={s.emptySubtitle}>
                Os professores aparecerão aqui{"\n"}conforme se cadastrarem no aplicativo.
              </Text>
            </View>
          ) : (
            professores.map((prof) => (
              <View key={prof.id} style={s.professorCard}>
                <View style={s.professorAvatar}>
                  {prof.foto ? (
                    <Image source={{ uri: prof.foto }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
                  ) : (
                    <Text style={s.professorAvatarText}>👤</Text>
                  )}
                </View>
                <View style={s.professorInfo}>
                  <Text style={s.professorNome}>{prof.nome}</Text>
                  {prof.cargo ? (
                    <Text style={{ fontSize: 12, color: "#7a7f9a" }}>{prof.cargo}</Text>
                  ) : null}
                  {prof.instituicao ? (
                    <Text style={{ fontSize: 12, color: "#7a7f9a" }}>🏫 {prof.instituicao}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
