import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "@/src/constants/colors";

const PRIVACIDADE_ITEMS = [
  {
    id: "analytics",
    icon: "📊",
    title: "Análise de uso",
    subtitle: "Compartilhar dados anônimos para melhorar o app",
  },
  {
    id: "crash",
    icon: "🛡️",
    title: "Relatórios de erro",
    subtitle: "Enviar relatórios automáticos de falhas",
  },
  {
    id: "biometria",
    icon: "🔐",
    title: "Autenticação biométrica",
    subtitle: "Usar digital ou Face ID para entrar",
  },
];

export default function PrivacidadeScreen() {
  const router = useRouter();
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    analytics: true,
    crash: true,
    biometria: false,
  });

  const toggle = (id: string) =>
    setSwitches((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleExcluirConta = () => {
    Alert.alert(
      "Excluir conta",
      "Tem certeza? Esta ação é irreversível e todos os seus dados serão apagados.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>

          <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginBottom: 4 }}>
            CONTROLE DE DADOS
          </Text>

          {PRIVACIDADE_ITEMS.map((item) => (
            <View
              key={item.id}
              style={[s.configItem, { justifyContent: "space-between" }]}
            >
              <View style={s.configIcon}>
                <Text style={s.configIconText}>{item.icon}</Text>
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
                <Text style={s.configSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={switches[item.id]}
                onValueChange={() => toggle(item.id)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={switches[item.id] ? Colors.primary : Colors.textMuted}
              />
            </View>
          ))}

          <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginTop: 12, marginBottom: 4 }}>
            AÇÕES
          </Text>

          <TouchableOpacity
            style={[s.configItem]}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Dados exportados", "Seus dados foram enviados para o e-mail cadastrado.")}
          >
            <View style={s.configIcon}>
              <Text style={s.configIconText}>📤</Text>
            </View>
            <View style={s.configContent}>
              <Text style={s.configTitle}>Exportar meus dados</Text>
              <Text style={s.configSubtitle}>Receba uma cópia dos seus dados por e-mail</Text>
            </View>
            <Text style={s.configArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.configItem, { borderColor: Colors.error }]}
            activeOpacity={0.7}
            onPress={handleExcluirConta}
          >
            <View style={[s.configIcon, { backgroundColor: Colors.errorBg }]}>
              <Text style={s.configIconText}>🗑️</Text>
            </View>
            <View style={s.configContent}>
              <Text style={[s.configTitle, { color: Colors.error }]}>Excluir minha conta</Text>
              <Text style={s.configSubtitle}>Remove permanentemente todos os dados</Text>
            </View>
            <Text style={s.configArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
