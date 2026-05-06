import { styles as s } from "@/styles/EditarHorarioStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getProfessoresDisponiveis,
  Professor,
} from "@/data/professoresData";

// =============================================================
//  Quando o backend existir, substitua apenas estas funções:
//    - salvarHorario()  →  PUT /api/horarios/:id
// =============================================================

type TipoSlot = "aula" | "intervalo";

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
  }>();

  const isIntervalOriginal = params.isInterval === "true";

  // Estado do formulário
  const [tipoSlot, setTipoSlot] = useState<TipoSlot>(
    isIntervalOriginal ? "intervalo" : "aula"
  );
  const [materia, setMateria] = useState(
    isIntervalOriginal ? "" : params.subject
  );
  const [professorSelecionado, setProfessorSelecionado] =
    useState<Professor | null>(null);

  // Professores disponíveis para este horário/turno
  const professoresDisponiveis = getProfessoresDisponiveis(
    params.turno,
    params.id,
    undefined // professor atual não tem id no mock, mas quando vier do backend passe o id aqui
  );

  const handleSalvar = () => {
    if (tipoSlot === "aula") {
      if (!materia.trim()) {
        Alert.alert("Atenção", "Informe o nome da matéria.");
        return;
      }
      if (!professorSelecionado) {
        Alert.alert("Atenção", "Selecione um professor.");
        return;
      }
    }

    // TODO (backend): PUT /api/horarios/:id  com o body abaixo
    const payload = {
      id: params.id,
      turno: params.turno,
      timeStart: params.timeStart,
      timeEnd: params.timeEnd,
      isInterval: tipoSlot === "intervalo",
      subject: tipoSlot === "intervalo" ? "Intervalo" : materia.trim(),
      teacher: tipoSlot === "intervalo" ? "" : professorSelecionado?.nome ?? "",
    };

    console.log("Salvar horário →", payload);

    Alert.alert("Salvo!", "Horário atualizado com sucesso.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Horário</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSalvar}>
          <Text style={s.saveBtnText}>✓</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner do horário */}
        <View style={s.horarioBanner}>
          <Text style={{ fontSize: 28 }}>🕐</Text>
          <View>
            <Text style={s.horarioBannerTime}>
              {params.timeStart} – {params.timeEnd}
            </Text>
            <Text style={s.horarioBannerSub}>
              Turno {params.turno.charAt(0).toUpperCase() + params.turno.slice(1)}
            </Text>
          </View>
        </View>

        {/* Toggle Aula / Intervalo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tipo do horário</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, tipoSlot === "aula" && s.toggleBtnActive]}
              onPress={() => setTipoSlot("aula")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.toggleBtnText,
                  tipoSlot === "aula" && s.toggleBtnTextActive,
                ]}
              >
                📖 Aula
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.toggleBtn,
                tipoSlot === "intervalo" && s.toggleBtnActive,
              ]}
              onPress={() => setTipoSlot("intervalo")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.toggleBtnText,
                  tipoSlot === "intervalo" && s.toggleBtnTextActive,
                ]}
              >
                ☕ Intervalo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {tipoSlot === "intervalo" ? (
          /* Aviso de intervalo */
          <View style={s.intervaloBanner}>
            <Text style={{ fontSize: 24 }}>☕</Text>
            <Text style={s.intervaloBannerText}>
              Este horário será marcado como intervalo. Nenhum professor ou
              matéria será atribuído.
            </Text>
          </View>
        ) : (
          <>
            {/* Campo matéria */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Matéria</Text>
              <TextInput
                style={s.inputCard}
                value={materia}
                onChangeText={setMateria}
                placeholder="Ex: Matemática, Português..."
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Seleção de professor */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>
                Professor disponível ({professoresDisponiveis.length})
              </Text>

              {professoresDisponiveis.length === 0 ? (
                <View style={s.emptyProfessores}>
                  <Text style={{ fontSize: 32 }}>😔</Text>
                  <Text style={s.emptyProfessoresText}>
                    Todos os professores já estão alocados neste horário.
                  </Text>
                </View>
              ) : (
                professoresDisponiveis.map((prof) => {
                  const selected = professorSelecionado?.id === prof.id;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[
                        s.professorCard,
                        selected && s.professorCardSelected,
                      ]}
                      onPress={() =>
                        setProfessorSelecionado(selected ? null : prof)
                      }
                      activeOpacity={0.75}
                    >
                      <View style={s.professorAvatar}>
                        <Text style={s.professorAvatarText}>👨‍🏫</Text>
                      </View>
                      <View style={s.professorInfo}>
                        <Text style={s.professorNome}>{prof.nome}</Text>
                        <Text style={s.professorMaterias}>
                          {prof.materias.join(" · ")}
                        </Text>
                      </View>
                      {selected && (
                        <Text style={s.professorCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
