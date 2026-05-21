import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/src/constants/colors";

const SOBRE_ITEMS = [
  { id: "versao", icon: "📱", title: "Versão do app", value: "1.0.0" },
];

const LINKS = [
  {
    id: "termos",
    icon: "📄",
    title: "Termos de uso",
    subtitle: "Leia nossos termos e condições",
    url: "https://educaplay.com.br/termos",
  },
  {
    id: "politica",
    icon: "🔒",
    title: "Política de privacidade",
    subtitle: "Como tratamos seus dados",
    url: "https://educaplay.com.br/privacidade",
  },
  {
    id: "suporte",
    icon: "💬",
    title: "Suporte",
    subtitle: "Entre em contato com nossa equipe",
    url: "mailto:suporte@educaplay.com.br",
  },
];

export default function SobreScreen() {
  const router = useRouter();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o link.")
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sobre</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Logo e nome */}
        <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
          <Image
            source={require("@/assets/images/logo_icon.png")}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: "800", color: Colors.textPrimary }}>
            Educa<Text style={{ color: Colors.primary }}>Play</Text>
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: "center", paddingHorizontal: 32 }}>
            Organize hoje, ensine melhor amanhã.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>

          <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginBottom: 4 }}>
            INFORMAÇÕES
          </Text>

          {SOBRE_ITEMS.map((item) => (
            <View key={item.id} style={s.configItem}>
              <View style={s.configIcon}>
                <Text style={s.configIconText}>{item.icon}</Text>
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
              </View>
              <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600" }}>
                {item.value}
              </Text>
            </View>
          ))}

          <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginTop: 12, marginBottom: 4 }}>
            LINKS
          </Text>

          {LINKS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.configItem}
              activeOpacity={0.7}
              onPress={() => handleLink(item.url)}
            >
              <View style={s.configIcon}>
                <Text style={s.configIconText}>{item.icon}</Text>
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
                <Text style={s.configSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={s.configArrow}>›</Text>
            </TouchableOpacity>
          ))}

          <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 24, marginBottom: 8 }}>
            © 2025 EducaPlay. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
