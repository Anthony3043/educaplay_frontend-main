import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { homeStyles as s } from "../../styles/homeStyles";
import { useAuth } from "../../context/AuthContext";
import api from "../../src/services/api";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.72;

const DICAS = [
  "Configure o local da escola antes\nde liberar o bater ponto para\nos professores!",
  "Acesse "Pontos do Dia" para ver\nquem registrou presença e notificar\nquem faltou com um toque.",
  "Professores nunca são excluídos:\ndesative-os para preservar o\nhistórico de aulas e pontos.",
  "Você pode permitir que professores\neditem o mapa de sala — basta\nativar a permissão no perfil deles.",
  "Cada sala tem seu próprio mapa\nde carteiras. Ajuste o número de\ncolunas conforme o layout real.",
  "Defina o raio de tolerância do\nGPS com cuidado — muito pequeno\npode impedir o ponto ser batido.",
  "Após cadastrar as salas, atribua-as\nàs aulas no cronograma para que\no mapa de sala funcione.",
];

const MENU_ITEMS = [
  { id: "cronogramas", ionicon: "calendar-outline" as const, iconBg: "#e8f5ea", title: "Cronogramas", subtitle: "Crie e gerencie\nos horários", route: "/supervisao/cronogramas" },
  { id: "professores", ionicon: "people-outline" as const, iconBg: "#e8f0fe", title: "Professores", subtitle: "Cadastre e visualize\nos professores", route: "/supervisao/professores" },
  { id: "salas", ionicon: "grid-outline" as const, iconBg: "#fff3e0", title: "Salas", subtitle: "Cadastre e gerencie\nas salas da escola", route: "/supervisao/salas" },
  { id: "config-escola", ionicon: "location-outline" as const, iconBg: "#fef9c3", title: "Local da Escola", subtitle: "Configure o GPS\npara bater ponto", route: "/supervisao/configuracao-escola" },
  { id: "pontos-dia", ionicon: "finger-print-outline" as const, iconBg: "#fce7f3", title: "Pontos do Dia", subtitle: "Veja quem bateu\nou não o ponto", route: "/supervisao/pontos-dia" },
];

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "cronograma", ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

const DRAWER_ITEMS = [
  { ionicon: "home-outline" as const, label: "Home", route: "/supervisao/home" },
  { ionicon: "calendar-outline" as const, label: "Cronogramas", route: "/supervisao/cronogramas" },
  { ionicon: "people-outline" as const, label: "Professores", route: "/supervisao/professores" },
  { ionicon: "grid-outline" as const, label: "Salas", route: "/supervisao/salas" },
  { ionicon: "location-outline" as const, label: "Local da Escola", route: "/supervisao/configuracao-escola" },
  { ionicon: "finger-print-outline" as const, label: "Pontos do Dia", route: "/supervisao/pontos-dia" },
  { ionicon: "person-outline" as const, label: "Perfil", route: "/shared/perfil" },
  { ionicon: "settings-outline" as const, label: "Configurações", route: "/shared/configuracoes" },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [dicaIndex, setDicaIndex] = useState(0);
  const [dicaTexto, setDicaTexto] = useState(DICAS[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dicaOpacity = useRef(new Animated.Value(1)).current;
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { usuario } = useAuth();
  const userName = usuario?.nome?.split(" ")[0] ?? "";
  const [naoLidas, setNaoLidas] = useState(0);

  const carregarNotifs = useCallback(async () => {
    try {
      const res = await api.get("/notificacoes");
      setNaoLidas(res.data.filter((n: any) => !n.lida).length);
    } catch {}
  }, []);

  useEffect(() => { carregarNotifs(); }, [carregarNotifs]);

  // Botão voltar do Android → só sai do app quando esta tela está em foco
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    animateTroca(Math.floor(Math.random() * DICAS.length));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animateTroca = (novoIndex: number) => {
    Animated.timing(dicaOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setDicaTexto(DICAS[novoIndex]);
      setDicaIndex(novoIndex);
      Animated.timing(dicaOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleDicaPress = () => {
    animateTroca((dicaIndex + 1) % DICAS.length);
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerX, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleDrawerNav = (route: string) => {
    closeDrawer();
    setTimeout(() => router.push(route as any), 260);
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "cronograma") router.push("/supervisao/cronogramas");
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
    else if (tabId === "home") router.push("/supervisao/home");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={{ position: "absolute", left: 16 }} onPress={openDrawer}>
          <Ionicons name="menu" size={26} color="#1a1a2e" />
        </TouchableOpacity>

        <View style={s.headerLogo}>
          <Image source={require("@/assets/images/logo_icon.png")} style={s.headerLogoImage} resizeMode="contain" />
          <Text style={s.headerLogoText}>
            Educa<Text style={s.headerLogoAccent}>Play</Text>
          </Text>
        </View>

        <TouchableOpacity style={{ position: "absolute", right: 16 }} onPress={() => { router.push("/shared/notificacoes"); }}>
          <Ionicons name="notifications-outline" size={24} color="#1a1a2e" />
          {naoLidas > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{naoLidas > 9 ? "9+" : naoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerTextArea}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.bannerGreeting}>Olá, {userName}!</Text>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>
            <Text style={s.bannerSubtitle}>Bem-vindo à supervisão.{"\n"}Vamos organizar um{"\n"}dia incrível de aulas!</Text>
          </View>
          <Image source={require("@/assets/images/ze_bloco_menu_supervisao.png")} style={s.bannerMascote} resizeMode="contain" />
        </View>

        {/* Menu Principal */}
        <View style={[s.section, { paddingHorizontal: 0 }]}>
          <Text style={[s.sectionTitle, { paddingHorizontal: 18 }]}>Menu Principal</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.menuGrid, { paddingLeft: 18 }]}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} style={s.menuCard} onPress={() => router.push(item.route as any)} activeOpacity={0.8}>
                <View style={[s.menuCardTop, { backgroundColor: item.iconBg }]}>
                  <View style={s.menuCardIcon}>
                    <Ionicons name={item.ionicon} size={30} color="#1a1a2e" />
                  </View>
                </View>
                <View style={s.menuCardBody}>
                  <Text style={s.menuCardTitle}>{item.title}</Text>
                  <Text style={s.menuCardSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Botão Criar Cronograma */}
        <TouchableOpacity style={s.btnCriar} onPress={() => router.push("/supervisao/cronogramas")} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={s.btnCriarText}>Criar Cronograma</Text>
        </TouchableOpacity>

        {/* Dica do Zé Bloquinho */}
        <TouchableOpacity style={s.dicaCard} onPress={handleDicaPress} activeOpacity={0.85}>
          <Image source={require("@/assets/images/ze_bloco_dicas.png")} style={s.dicaMascote} resizeMode="contain" />
          <View style={s.dicaTextArea}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.dicaTitle}>Dica do Zé Bloquinho</Text>
              <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
            </View>
            <Animated.Text style={[s.dicaText, { opacity: dicaOpacity }]}>{dicaTexto}</Animated.Text>
            <Text style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>Toque para ver outra dica →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={s.tabItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Drawer overlay + painel */}
      {drawerOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View style={[s.drawerOverlay, { opacity: overlayOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[s.drawer, { transform: [{ translateX: drawerX }] }]}>
            {/* Cabeçalho do drawer */}
            <View style={s.drawerHeader}>
              {usuario?.foto ? (
                <Image source={{ uri: usuario.foto }} style={s.drawerAvatar} resizeMode="cover" />
              ) : (
                <View style={[s.drawerAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="person-outline" size={28} color="#fff" />
                </View>
              )}
              <Text style={s.drawerTitle}>{userName}</Text>
              <Text style={s.drawerSubtitle}>{usuario?.papel === "Supervisao" ? "Supervisão" : usuario?.papel ?? ""}</Text>
            </View>

            <View style={s.drawerDivider} />

            {/* Itens do drawer */}
            {DRAWER_ITEMS.map((item) => (
              <TouchableOpacity key={item.route} style={s.drawerItem} onPress={() => handleDrawerNav(item.route)} activeOpacity={0.7}>
                <Ionicons name={item.ionicon} size={22} color="#1a1a2e" style={s.drawerItemIcon} />
                <Text style={s.drawerItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={s.drawerDivider} />

            <TouchableOpacity style={s.drawerLogout} onPress={() => { closeDrawer(); setTimeout(() => router.replace("/auth/Login"), 260); }} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" style={s.drawerItemIcon} />
              <Text style={[s.drawerItemLabel, { color: "#ef4444" }]}>Sair</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}
