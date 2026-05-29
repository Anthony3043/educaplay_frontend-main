import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Linking,
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
  const [modalInfo, setModalInfo] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: "erro" | "aviso" | "sucesso" }>({ visivel: false, titulo: "", mensagem: "", tipo: "aviso" });
  const showInfo = useCallback((titulo: string, mensagem: string, tipo: "erro" | "aviso" | "sucesso" = "aviso") => {
    setModalInfo({ visivel: true, titulo, mensagem, tipo });
  }, []);

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => showInfo("Erro", "Não foi possível abrir o link.", "erro"));
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
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

      <Modal visible={modalInfo.visivel} transparent animationType="fade" onRequestClose={() => setModalInfo(p => ({ ...p, visivel: false }))}>
        <View style={inf.overlay}>
          <View style={inf.box}>
            <View style={[inf.iconCircle, { backgroundColor: modalInfo.tipo === "erro" ? "#FEE2E2" : modalInfo.tipo === "sucesso" ? "#dcfce7" : "#FFF7ED" }]}>
              <Ionicons name={modalInfo.tipo === "erro" ? "close-circle-outline" : modalInfo.tipo === "sucesso" ? "checkmark-circle-outline" : "warning-outline"} size={32} color={modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316"} />
            </View>
            <Text style={[inf.titulo, { color: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]}>{modalInfo.titulo}</Text>
            <Text style={inf.msg}>{modalInfo.mensagem}</Text>
            <TouchableOpacity style={[inf.btn, { backgroundColor: modalInfo.tipo === "erro" ? "#ef4444" : modalInfo.tipo === "sucesso" ? "#3a7d44" : "#f97316" }]} onPress={() => setModalInfo(p => ({ ...p, visivel: false }))} activeOpacity={0.85}>
              <Text style={inf.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const inf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 3 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
