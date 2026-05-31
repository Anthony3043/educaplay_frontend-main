import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
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
  'Bata o ponto ao chegar na escola!\nAbra o cronograma, selecione o dia\ne toque em "Bater Ponto".',
  "O ponto só é aceito se você\nestiver dentro do raio da escola.\nCertifique-se de estar no local.",
  'Se já bateu o ponto, o badge\nverde aparece automaticamente\nno card da aula.',
  "No Mapa de Sala você vê onde\ncada aluno senta. Se tiver\npermissão, pode editar os nomes.",
  "Seu cronograma mostra todas as\naulas atribuídas a você por dia\ne por turno.",
  "Mantenha sua disponibilidade\natualizada para a supervisão\nalocar suas aulas corretamente.",
];

const MENU_ITEMS = [
  {
    id: "disponibilidade",
    ionicon: "calendar-outline" as const,
    color: "#2d9e4f",
    title: "Minha Agenda",
    subtitle: "Informe seus horários\ndisponíveis",
    route: "/professor/indisponibilidade",
  },
  {
    id: "cronogramas",
    ionicon: "school-outline" as const,
    color: "#4361ee",
    title: "Cronogramas",
    subtitle: "Veja as aulas\natribuídas a você",
    route: "/professor/cronogramas-professor",
  },
  {
    id: "mapa-sala",
    ionicon: "grid-outline" as const,
    color: "#f4831f",
    title: "Mapa de Sala",
    subtitle: "Visualize o mapa\nde carteiras",
    route: "/professor/mapa-sala",
  },
];

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "agenda", ionicon: "calendar-outline" as const, label: "Minha Agenda" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

const DRAWER_ITEMS = [
  { ionicon: "home-outline" as const,         label: "Home",         route: "/professor/home-professor",      color: "#3a7d44", bg: "#F0FDF4" },
  { ionicon: "calendar-outline" as const,     label: "Minha Agenda", route: "/professor/indisponibilidade",  color: "#f59e0b", bg: "#FFFBEB" },
  { ionicon: "school-outline" as const,       label: "Cronogramas",  route: "/professor/cronogramas-professor", color: "#3b82f6", bg: "#EFF6FF" },
  { ionicon: "grid-outline" as const,         label: "Mapa de Sala", route: "/professor/mapa-sala",          color: "#8b5cf6", bg: "#F5F3FF" },
  { ionicon: "person-outline" as const,       label: "Perfil",       route: "/shared/perfil",                color: "#3a7d44", bg: "#F0FDF4" },
  { ionicon: "settings-outline" as const,     label: "Configurações",route: "/shared/configuracoes",         color: "#6B7280", bg: "#F9FAFB" },
];

export default function HomeProfessorScreen() {
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
  const cargo = usuario?.papel === "Supervisao" ? "Supervisão" : (usuario?.papel ?? "");
  const materias = usuario?.materias ?? [];
  const [naoLidas, setNaoLidas] = useState(0);

  const carregarNotifs = useCallback(async () => {
    try {
      const res = await api.get("/notificacoes");
      setNaoLidas(res.data.filter((n: any) => !n.lida).length);
    } catch {}
  }, []);

  useEffect(() => { carregarNotifs(); }, [carregarNotifs]);
  useFocusEffect(useCallback(() => { carregarNotifs(); }, [carregarNotifs]));

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

  const handleDicaPress = () => animateTroca((dicaIndex + 1) % DICAS.length);

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
    if (tabId === "agenda") router.push("/professor/indisponibilidade" as any);
    else if (tabId === "configuracoes") router.push("/shared/configuracoes");
    else if (tabId === "home") router.push("/professor/home-professor" as any);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerIconBtn} onPress={openDrawer} activeOpacity={0.7}>
          <Ionicons name="menu" size={22} color="#1a1a2e" />
        </TouchableOpacity>

        <View style={s.headerLogo}>
          <Image source={require("@/assets/images/logo_icon.png")} style={s.headerLogoImage} resizeMode="contain" />
          <Text style={s.headerLogoText}>
            Educa<Text style={s.headerLogoAccent}>Play</Text>
          </Text>
        </View>

        <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push("/shared/notificacoes")} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#1a1a2e" />
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
          <View style={s.bannerDeco1} />
          <View style={s.bannerDeco2} />
          <View style={s.bannerTextArea}>
            <View style={s.bannerBadge}>
              <Ionicons name="school-outline" size={12} color="rgba(255,255,255,0.92)" />
              <Text style={s.bannerBadgeText}>Professor</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.bannerGreeting}>Olá, {userName}!</Text>
              <Text style={{ fontSize: 22 }}>✨</Text>
            </View>
            <Text style={s.bannerSubtitle}>
              Que bom ver você por aqui.{"\n"}
              Veja suas aulas e{"\n"}
              gerencie sua agenda!
            </Text>
          </View>
          <Image source={require("@/assets/images/ze_bloco_menu_supervisao.png")} style={s.bannerMascote} resizeMode="contain" />
        </View>

        {/* Menu Principal */}
        <View style={[s.section, { paddingHorizontal: 0 }]}>
          <Text style={[s.sectionTitle, { paddingHorizontal: 18 }]}>Menu Principal</Text>
          <View style={s.menuBentoGrid}>
            {/* Card destaque */}
            <TouchableOpacity
              style={[s.menuCardFeatured, { backgroundColor: MENU_ITEMS[0].color, shadowColor: MENU_ITEMS[0].color }]}
              onPress={() => router.push(MENU_ITEMS[0].route as any)}
              activeOpacity={0.84}
            >
              <Ionicons name={MENU_ITEMS[0].ionicon} size={130} color="rgba(255,255,255,0.08)" style={s.menuCardGhostIcon} />
              <View style={s.menuFeaturedIconWrap}>
                <Ionicons name={MENU_ITEMS[0].ionicon} size={30} color="#fff" />
              </View>
              <View style={s.menuFeaturedBody}>
                <Text style={s.menuFeaturedTitle}>{MENU_ITEMS[0].title}</Text>
                <Text style={s.menuFeaturedSubtitle}>{MENU_ITEMS[0].subtitle}</Text>
              </View>
              <View style={s.menuFeaturedArrow}>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </TouchableOpacity>

            {/* Linha: Cronogramas + Mapa de Sala */}
            <View style={s.menuBentoRow}>
              {MENU_ITEMS.slice(1).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.menuCard, { backgroundColor: item.color, shadowColor: item.color }]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.84}
                >
                  <Ionicons name={item.ionicon} size={96} color="rgba(255,255,255,0.09)" style={s.menuCardGhostIcon} />
                  <View style={s.menuCardGlint} />
                  <View style={s.menuCardArrowBadge}>
                    <Ionicons name="chevron-forward" size={11} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View style={s.menuCardIconWrap}>
                    <Ionicons name={item.ionicon} size={26} color="#fff" />
                  </View>
                  <View style={s.menuCardBody}>
                    <Text style={s.menuCardTitle}>{item.title}</Text>
                    <Text style={s.menuCardSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dica do Zé Bloquinho */}
        <TouchableOpacity style={s.dicaCard} onPress={handleDicaPress} activeOpacity={0.88}>
          <View style={s.dicaMascoteWrap}>
            <Image source={require("@/assets/images/ze_bloco_dicas.png")} style={s.dicaMascote} resizeMode="contain" />
          </View>
          <View style={s.dicaTextArea}>
            <View style={s.dicaBadgeRow}>
              <View style={s.dicaBadge}>
                <Ionicons name="bulb-outline" size={12} color="#d97706" />
                <Text style={s.dicaBadgeText}>Dica do Zé</Text>
              </View>
              <Text style={s.dicaCounter}>{dicaIndex + 1}/{DICAS.length}</Text>
            </View>
            <Animated.Text style={[s.dicaText, { opacity: dicaOpacity }]}>{dicaTexto}</Animated.Text>
            <View style={s.dicaFooter}>
              <Ionicons name="finger-print-outline" size={10} color="#f59e0b" />
              <Text style={s.dicaFooterText}>Toque para outra dica</Text>
            </View>
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

      {/* Drawer */}
      {drawerOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View style={[s.drawerOverlay, { opacity: overlayOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[s.drawer, { transform: [{ translateX: drawerX }] }]}>
            {/* Header */}
            <View style={s.drawerHeader}>
              <View style={s.drawerHeaderDeco1} />
              <View style={s.drawerHeaderDeco2} />
              {usuario?.foto ? (
                <Image source={{ uri: usuario.foto }} style={s.drawerAvatar} resizeMode="cover" />
              ) : (
                <View style={s.drawerAvatarPlaceholder}>
                  <Ionicons name="person-outline" size={26} color="#fff" />
                </View>
              )}
              <Text style={s.drawerTitle}>{userName}</Text>
              <View style={s.drawerRolePill}>
                <Text style={s.drawerSubtitle}>{cargo}</Text>
              </View>
              {materias.length > 0 && (
                <View style={dm.chipsRow}>
                  {materias.map((m, idx) => (
                    <View key={idx} style={dm.chip}>
                      <Text style={dm.chipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Itens */}
            <ScrollView style={s.drawerScroll} showsVerticalScrollIndicator={false}>
              {DRAWER_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={s.drawerItem}
                  onPress={() => handleDrawerNav(item.route)}
                  activeOpacity={0.72}
                >
                  <View style={[s.drawerItemIconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.ionicon} size={18} color={item.color} />
                  </View>
                  <Text style={s.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={s.drawerDivider} />

              <TouchableOpacity
                style={s.drawerLogout}
                onPress={() => { closeDrawer(); setTimeout(() => router.replace("/auth/Login"), 260); }}
                activeOpacity={0.72}
              >
                <View style={s.drawerLogoutIconWrap}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </View>
                <Text style={[s.drawerItemLabel, { color: "#ef4444" }]}>Sair</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const dm = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
