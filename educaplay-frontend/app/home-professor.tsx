import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
import { homeStyles as s } from "../styles/homeStyles";
import { useAuth } from "../context/AuthContext";
import api from "../src/services/api";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.72;

const DICAS = [
  "Registre sua disponibilidade\ncom antecedência para evitar conflitos!",
  "Consulte o cronograma regularmente\npara se manter atualizado.",
  "Atualize seus horários disponíveis\nsempre que houver mudanças.",
  "Verifique se suas aulas estão\ncorretas no cronograma.",
  "Mantenha seu perfil atualizado\npara facilitar a alocação.",
  "Em caso de dúvidas, entre em\ncontato com a supervisão.",
];

const MENU_ITEMS = [
  {
    id: "disponibilidade",
    ionicon: "calendar-outline" as const,
    iconBg: "#e8f5ea",
    title: "Minha Agenda",
    subtitle: "Informe seus horários\ndisponíveis",
    route: "/indisponibilidade",
  },
  {
    id: "cronogramas",
    ionicon: "calendar-outline" as const,
    iconBg: "#e8f0fe",
    title: "Cronogramas",
    subtitle: "Veja as aulas\natribuídas a você",
    route: "/cronogramas-professor",
  },
];

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "agenda", ionicon: "calendar-outline" as const, label: "Minha Agenda" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

const DRAWER_ITEMS = [
  { ionicon: "home-outline" as const, label: "Home", route: "/home-professor" },
  { ionicon: "calendar-outline" as const, label: "Minha Agenda", route: "/indisponibilidade" },
  { ionicon: "calendar-outline" as const, label: "Cronogramas", route: "/cronogramas-professor" },
  { ionicon: "person-outline" as const, label: "Perfil", route: "/perfil" },
  { ionicon: "settings-outline" as const, label: "Configurações", route: "/configuracoes" },
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
  const cargo = usuario?.cargo ?? usuario?.papel ?? "";
  const [naoLidas, setNaoLidas] = useState(0);

  const carregarNotifs = useCallback(async () => {
    try {
      const res = await api.get("/notificacoes");
      setNaoLidas(res.data.filter((n: any) => !n.lida).length);
    } catch {}
  }, []);

  useEffect(() => { carregarNotifs(); }, [carregarNotifs]);

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
    if (tabId === "agenda") router.push("/indisponibilidade" as any);
    else if (tabId === "configuracoes") router.push("/configuracoes");
    else if (tabId === "home") router.push("/home-professor" as any);
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

        <TouchableOpacity style={{ position: "absolute", right: 16 }} onPress={() => router.push("/notificacoes")}>
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
            <Text style={s.bannerGreeting}>Olá, {userName}! <Text style={s.bannerEmoji}>👋</Text></Text>
            <Text style={s.bannerSubtitle}>
              Que bom ver você por aqui.{"\n"}
              Veja suas aulas e{"\n"}
              gerencie sua agenda!
            </Text>
          </View>
          <Image source={require("@/assets/images/ze_bloco_menu_supervisao.png")} style={s.bannerMascote} resizeMode="contain" />
        </View>

        <View style={s.divider} />

        {/* Menu Principal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Menu Principal</Text>
          <View style={[s.menuGrid, { justifyContent: "center" }]}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.menuCard, { maxWidth: "48%" }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[s.menuCardIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.ionicon} size={28} color="#1a1a2e" />
                </View>
                <Text style={s.menuCardTitle}>{item.title}</Text>
                <Text style={s.menuCardSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Ver Cronograma */}
        <TouchableOpacity style={s.btnCriar} onPress={() => router.push("/cronogramas-professor")} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
          <Text style={s.btnCriarText}>Ver Cronograma</Text>
        </TouchableOpacity>

        {/* Dica do Zé Bloquinho */}
        <TouchableOpacity style={s.dicaCard} onPress={handleDicaPress} activeOpacity={0.85}>
          <Image source={require("@/assets/images/ze_bloco_dicas.png")} style={s.dicaMascote} resizeMode="contain" />
          <View style={s.dicaTextArea}>
            <Text style={s.dicaTitle}>Dica do Zé Bloquinho <Text style={s.dicaTitleEmoji}>💡</Text></Text>
            <Animated.Text style={[s.dicaText, { opacity: dicaOpacity }]}>{dicaTexto}</Animated.Text>
            <Text style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>Toque para ver outra dica →</Text>
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
            <View style={s.drawerHeader}>
              {usuario?.foto ? (
                <Image source={{ uri: usuario.foto }} style={s.drawerAvatar} resizeMode="cover" />
              ) : (
                <View style={[s.drawerAvatar, { backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="person-outline" size={28} color="#3a7d44" />
                </View>
              )}
              <Text style={s.drawerTitle}>{userName}</Text>
              <Text style={s.drawerSubtitle}>{cargo}</Text>
            </View>

            <View style={s.drawerDivider} />

            {DRAWER_ITEMS.map((item) => (
              <TouchableOpacity key={item.route} style={s.drawerItem} onPress={() => handleDrawerNav(item.route)} activeOpacity={0.7}>
                <Ionicons name={item.ionicon} size={22} color="#1a1a2e" style={s.drawerItemIcon} />
                <Text style={s.drawerItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={s.drawerDivider} />

            <TouchableOpacity
              style={s.drawerLogout}
              onPress={() => { closeDrawer(); setTimeout(() => router.replace("/Login"), 260); }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" style={s.drawerItemIcon} />
              <Text style={[s.drawerItemLabel, { color: "#ef4444" }]}>Sair</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}
