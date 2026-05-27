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
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/colors";

const SOBRE_ITEMS = [
  { id: "versao", ionicon: "phone-portrait-outline" as const, title: "Versão do app", value: "1.0.0" },
];

type LinkItem =
  | { id: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; title: string; subtitle: string; type: "url"; url: string }
  | { id: string; ionicon: React.ComponentProps<typeof Ionicons>["name"]; title: string; subtitle: string; type: "nav"; route: string };

const LINKS: LinkItem[] = [
  {
    id: "termos",
    ionicon: "document-text-outline",
    title: "Termos de uso",
    subtitle: "Leia nossos termos e condições",
    type: "nav",
    route: "/shared/termos",
  },
  {
    id: "politica",
    ionicon: "lock-closed-outline",
    title: "Política de privacidade",
    subtitle: "Como tratamos seus dados",
    type: "nav",
    route: "/shared/politica",
  },
  {
    id: "suporte",
    ionicon: "logo-whatsapp",
    title: "Suporte",
    subtitle: "Fale conosco pelo WhatsApp",
    type: "url",
    url: "https://wa.me/5535999657172?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20EducaPlay.",
  },
];

export default function SobreScreen() {
  const router = useRouter();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o link."));
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
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
                <Ionicons name={item.ionicon} size={20} color={Colors.primary} />
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
              onPress={() => item.type === "nav" ? router.push(item.route as any) : handleLink(item.url)}
            >
              <View style={s.configIcon}>
                <Ionicons name={item.ionicon} size={20} color={Colors.primary} />
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
                <Text style={s.configSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbbcc8" />
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
