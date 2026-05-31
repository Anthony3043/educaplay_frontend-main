import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
  "Configure o local da escola antes\nde liberar o bater ponto para\nos professores!",
  'Acesse "Pontos do Dia" para ver\nquem registrou presença e notificar\nquem faltou com um toque.',
  "Professores nunca são excluídos:\ndesative-os para preservar o\nhistórico de aulas e pontos.",
  "Você pode permitir que professores\neditem o mapa de sala — basta\nativar a permissão no perfil deles.",
  "Cada sala tem seu próprio mapa\nde carteiras. Ajuste o número de\ncolunas conforme o layout real.",
  "Defina o raio de tolerância do\nGPS com cuidado — muito pequeno\npode impedir o ponto ser batido.",
  "Após cadastrar as salas, atribua-as\nàs aulas no cronograma para que\no mapa de sala funcione.",
];

const MENU_ITEMS = [
  { id: "cronogramas", ionicon: "calendar-outline" as const, color: "#2d9e4f", title: "Cronogramas", subtitle: "Crie e gerencie\nos horários", route: "/supervisao/cronogramas" },
  { id: "professores", ionicon: "people-outline" as const, color: "#4361ee", title: "Professores", subtitle: "Cadastre e visualize\nos professores", route: "/supervisao/professores" },
  { id: "salas", ionicon: "grid-outline" as const, color: "#f4831f", title: "Salas", subtitle: "Cadastre e gerencie\nas salas da escola", route: "/supervisao/salas" },
  { id: "config-escola", ionicon: "location-outline" as const, color: "#e63946", title: "Local da Escola", subtitle: "Configure o GPS\npara bater ponto", route: "/supervisao/configuracao-escola" },
  { id: "pontos-dia", ionicon: "finger-print-outline" as const, color: "#7b2d8b", title: "Pontos do Dia", subtitle: "Veja quem bateu\nou não o ponto", route: "/supervisao/pontos-dia" },
];

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "cronograma", ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

const DRAWER_ITEMS = [
  { ionicon: "home-outline" as const,          label: "Home",            route: "/supervisao/home",                 color: "#3a7d44", bg: "#F0FDF4" },
  { ionicon: "calendar-outline" as const,      label: "Cronogramas",     route: "/supervisao/cronogramas",         color: "#3b82f6", bg: "#EFF6FF" },
  { ionicon: "people-outline" as const,        label: "Professores",     route: "/supervisao/professores",         color: "#8b5cf6", bg: "#F5F3FF" },
  { ionicon: "grid-outline" as const,          label: "Salas",           route: "/supervisao/salas",               color: "#f59e0b", bg: "#FFFBEB" },
  { ionicon: "location-outline" as const,      label: "Local da Escola", route: "/supervisao/configuracao-escola", color: "#0891b2", bg: "#ECFEFF" },
  { ionicon: "finger-print-outline" as const,  label: "Pontos do Dia",   route: "/supervisao/pontos-dia",          color: "#ef4444", bg: "#FEF2F2" },
  { ionicon: "person-outline" as const,        label: "Perfil",          route: "/shared/perfil",                  color: "#3a7d44", bg: "#F0FDF4" },
  { ionicon: "settings-outline" as const,      label: "Configurações",   route: "/shared/configuracoes",           color: "#6B7280", bg: "#F9FAFB" },
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
  const [alertasProf, setAlertasProf] = useState<any[]>([]);
  const [modalAlertas, setModalAlertas] = useState(false);
  const [alertaIdx, setAlertaIdx] = useState(0);
  // Modal substituto
  const [modalSubstituto, setModalSubstituto] = useState(false);
  const [alertaParaSubstituir, setAlertaParaSubstituir] = useState<any>(null);
  // { [dia]: AulaItem[] } — aulas + disponíveis por dia
  const [aulasPorDia, setAulasPorDia] = useState<Record<string, any[]>>({});
  const [diaSelecionadoSub, setDiaSelecionadoSub] = useState<string>("");
  const [carregandoDia, setCarregandoDia] = useState(false);
  const [salvandoSubstituto, setSalvandoSubstituto] = useState(false);
  const DIAS_SEMANA_SUB = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

  const carregarNotifs = useCallback(async () => {
    try {
      const res = await api.get("/notificacoes");
      setNaoLidas(res.data.filter((n: any) => !n.lida).length);
    } catch {}
  }, []);

  useEffect(() => { carregarNotifs(); }, [carregarNotifs]);

  // Verifica avisos ao focar E a cada 30s enquanto a tela está ativa
  const [sucessoSubstituto, setSucessoSubstituto] = useState<{nome: string; aulas: number; temMais?: boolean} | null>(null);

  const getDiaSemanaHoje = () => {
    const map: Record<number, string> = { 1:"Segunda", 2:"Terça", 3:"Quarta", 4:"Quinta", 5:"Sexta", 6:"Sábado" };
    return map[new Date().getDay()] ?? null;
  };

  const carregarAulasDia = async (alerta: any, dia: string) => {
    setCarregandoDia(true);
    try {
      const params: any = { professorAbsenteId: alerta.professor.id, diaSemana: dia };
      if (alerta.horarioChegada) params.horarioChegada = alerta.horarioChegada;
      const res = await api.get("/avisos-professor/professores-disponiveis", { params });
      const aulas = res.data.map((a: any) => ({ ...a, substitutoEscolhido: null }));
      setAulasPorDia(prev => ({ ...prev, [dia]: aulas }));
    } catch {}
    finally { setCarregandoDia(false); }
  };

  const abrirSubstituto = async (alerta: any) => {
    if (!alerta.professor?.id) {
      alert("Não foi possível identificar o professor. Tente novamente.");
      return;
    }
    setAlertaParaSubstituir(alerta);
    setAulasPorDia({});
    // Usa o dia do alerta, ou hoje como fallback
    const diaInicial = alerta.diaSemana ?? getDiaSemanaHoje() ?? "Segunda";
    setDiaSelecionadoSub(diaInicial);
    setModalSubstituto(true);
    await carregarAulasDia(alerta, diaInicial);
  };

  const mudarDiaSub = async (dia: string) => {
    setDiaSelecionadoSub(dia);
    if (!aulasPorDia[dia]) {
      await carregarAulasDia(alertaParaSubstituir, dia);
    }
  };

  const selecionarSubstituto = (dia: string, aulaId: string, prof: any) => {
    setAulasPorDia(prev => ({
      ...prev,
      [dia]: (prev[dia] ?? []).map(a =>
        a.aulaId === aulaId
          ? { ...a, substitutoEscolhido: a.substitutoEscolhido?.id === prof.id ? null : prof }
          : a
      ),
    }));
  };

  const fecharModalSubstituto = () => {
    setModalSubstituto(false);
    // Reabre alertas se ainda há alertas pendentes
    if (alertasProf.length > 0) setModalAlertas(true);
  };

  const confirmarSubstituto = async () => {
    // Coleta todas as substituições de todos os dias
    const substituicoes: any[] = [];
    Object.entries(aulasPorDia).forEach(([, aulas]) => {
      aulas.filter(a => a.substitutoEscolhido).forEach(a => {
        substituicoes.push({
          aulaId: a.aulaId,
          professorOriginalId: alertaParaSubstituir?.professor?.id,
          professorSubstitutoId: a.substitutoEscolhido.id,
        });
      });
    });
    if (substituicoes.length === 0) return;
    setSalvandoSubstituto(true);
    try {
      const res = await api.post("/avisos-professor/substituir", { substituicoes });
      setModalSubstituto(false);
      const nomes = [...new Set(substituicoes.map(s => {
        const prof = Object.values(aulasPorDia).flat().find(a => a.aulaId === s.aulaId)?.substitutoEscolhido;
        return prof?.nome?.split(" ")[0];
      }).filter(Boolean))].join(", ");
      // Remove este alerta da fila e guarda se ainda há mais
      const restantes = alertasProf.filter((a: any) => a !== alertaParaSubstituir);
      setAlertasProf(restantes);
      setAlertaIdx(0);
      setSucessoSubstituto({ nome: nomes, aulas: res.data?.aulasSubstituidas ?? 0, temMais: restantes.length > 0 });
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao substituir professor.");
    } finally {
      setSalvandoSubstituto(false);
    }
  };

  const carregarAlertas = useCallback(async () => {
    try {
      const res = await api.get("/avisos-professor/recentes");
      if (res.data?.length > 0) {
        setAlertasProf(res.data);
        setAlertaIdx(0);
        setModalAlertas(true);
      }
    } catch {}
  }, []);

  // Poll contínuo a cada 15s — independente de foco/navegação
  useEffect(() => {
    carregarAlertas();
    const intervalo = setInterval(carregarAlertas, 15000);
    return () => clearInterval(intervalo);
  }, [carregarAlertas]);

  // Poll imediato ao voltar para a tela
  useFocusEffect(useCallback(() => { carregarAlertas(); }, [carregarAlertas]));

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
              <Ionicons name="ribbon-outline" size={12} color="rgba(255,255,255,0.92)" />
              <Text style={s.bannerBadgeText}>Supervisão</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.bannerGreeting}>Olá, {userName}!</Text>
              <Text style={{ fontSize: 22 }}>✨</Text>
            </View>
            <Text style={s.bannerSubtitle}>Bem-vindo à supervisão.{"\n"}Vamos organizar um{"\n"}dia incrível de aulas!</Text>
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

            {/* Linha 1: Professores + Salas */}
            <View style={s.menuBentoRow}>
              {MENU_ITEMS.slice(1, 3).map((item) => (
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

            {/* Linha 2: Local da Escola + Pontos do Dia */}
            <View style={s.menuBentoRow}>
              {MENU_ITEMS.slice(3).map((item) => (
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

      {/* Modal de alertas de professores */}
      <Modal visible={modalAlertas} transparent animationType="fade" onRequestClose={() => setModalAlertas(false)}>
        <View style={al.overlay}>
          <View style={al.box}>
            {alertasProf[alertaIdx] && (() => {
              const alerta = alertasProf[alertaIdx];
              const isAusencia = alerta.tipo === "ausencia";
              const cor = isAusencia ? "#ef4444" : "#f97316";
              const bg = isAusencia ? "#fef2f2" : "#FFF7ED";
              return (
                <>
                  <View style={[al.iconWrap, { backgroundColor: bg }]}>
                    <Ionicons
                      name={isAusencia ? "close-circle-outline" : "time-outline"}
                      size={32}
                      color={cor}
                    />
                  </View>
                  <View style={[al.badge, { backgroundColor: bg }]}>
                    <Text style={[al.badgeText, { color: cor }]}>
                      {isAusencia ? "Ausência" : "Atraso"}
                    </Text>
                  </View>
                  <Text style={al.profNome}>{alerta.professor?.nome ?? "Professor"}</Text>
                  {alerta.horarioChegada ? (
                    <View style={al.horarioRow}>
                      <Ionicons name="time-outline" size={14} color="#f97316" />
                      <Text style={al.horarioText}>Chegada prevista: <Text style={{ fontWeight: "800" }}>{alerta.horarioChegada}</Text></Text>
                    </View>
                  ) : null}
                  <Text style={al.motivo}>"{alerta.motivo}"</Text>
                  <Text style={al.dataText}>{alerta.criadoEm ? new Date(alerta.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}</Text>

                  {alertasProf.length > 1 && (
                    <Text style={al.counter}>{alertaIdx + 1} de {alertasProf.length}</Text>
                  )}

                  {/* Botão adicionar substituto */}
                  <TouchableOpacity
                    style={al.btnSubstituto}
                    onPress={() => { setModalAlertas(false); abrirSubstituto(alerta); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="person-add-outline" size={16} color="#3a7d44" />
                    <Text style={al.btnSubstitutoText}>Adicionar substituto</Text>
                  </TouchableOpacity>

                  <View style={al.botoesRow}>
                    {alertaIdx < alertasProf.length - 1 ? (
                      <>
                        <TouchableOpacity style={al.btnSecundario} onPress={() => setAlertaIdx(i => i + 1)} activeOpacity={0.8}>
                          <Text style={al.btnSecundarioText}>Próximo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[al.btnPrimario, { backgroundColor: cor }]} onPress={() => setModalAlertas(false)} activeOpacity={0.85}>
                          <Text style={al.btnPrimarioText}>Fechar</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={[al.btnPrimario, { backgroundColor: cor, flex: 1 }]} onPress={() => setModalAlertas(false)} activeOpacity={0.85}>
                        <Text style={al.btnPrimarioText}>Entendido</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Modal de seleção de substituto */}
      <Modal visible={modalSubstituto} transparent animationType="slide" onRequestClose={fecharModalSubstituto}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={sb.sheet}>
            <View style={sb.handle} />
            <View style={sb.header}>
              <View style={sb.headerIcon}>
                <Ionicons name="person-add-outline" size={20} color="#3a7d44" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sb.headerTitle}>Escolher substituto</Text>
                <Text style={sb.headerSub} numberOfLines={1}>
                  Substituindo: {alertaParaSubstituir?.professor?.nome}
                </Text>
              </View>
              <TouchableOpacity onPress={fecharModalSubstituto} style={sb.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Abas: só os dias do alerta (ou todos se não tiver dia) */}
            {(() => {
              const diasDoAlerta = alertaParaSubstituir?.diaSemana
                ? [alertaParaSubstituir.diaSemana]
                : DIAS_SEMANA_SUB;
              return diasDoAlerta.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sb.diasTabsRow}>
                  {diasDoAlerta.map((dia: string) => {
                    const ativo = dia === diaSelecionadoSub;
                    const temSub = (aulasPorDia[dia] ?? []).some((a: any) => a.substitutoEscolhido);
                    return (
                      <TouchableOpacity
                        key={dia}
                        style={[sb.diaTab, ativo && sb.diaTabAtivo]}
                        onPress={() => mudarDiaSub(dia)}
                        activeOpacity={0.75}
                      >
                        <Text style={[sb.diaTabText, ativo && sb.diaTabTextAtivo]}>{dia.slice(0,3).toUpperCase()}</Text>
                        {temSub && <View style={sb.diaTabDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null;
            })()}

            <ScrollView contentContainerStyle={sb.lista} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {carregandoDia && (
                <View style={sb.emptyWrap}>
                  <ActivityIndicator color="#3a7d44" />
                  <Text style={sb.emptyText}>Carregando...</Text>
                </View>
              )}
              {!carregandoDia && (aulasPorDia[diaSelecionadoSub] ?? []).length === 0 && (
                <View style={sb.emptyWrap}>
                  <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                  <Text style={sb.emptyText}>Sem aulas em {diaSelecionadoSub}</Text>
                  <Text style={sb.emptySub}>Escolha outro dia</Text>
                </View>
              )}
              {!carregandoDia && (aulasPorDia[diaSelecionadoSub] ?? []).map((aula: any) => (
                <View key={aula.aulaId} style={sb.aulaBloco}>
                  <View style={sb.aulaHeader}>
                    <View style={sb.aulaTimeBadge}>
                      <Text style={sb.aulaTimeText}>{aula.timeStart} – {aula.timeEnd}</Text>
                    </View>
                    <Text style={sb.aulaSubject} numberOfLines={1}>{aula.subject}</Text>
                    {aula.substitutoEscolhido && <Ionicons name="checkmark-circle" size={18} color="#3a7d44" />}
                  </View>
                  {aula.professoresDisponiveis.length === 0 ? (
                    <Text style={sb.aulaVazio}>Nenhum professor livre neste horário</Text>
                  ) : (
                    <View style={sb.profList}>
                      {aula.professoresDisponiveis.map((prof: any, idx: number) => {
                        const CORES = ["#3a7d44","#4361ee","#f4831f","#8b5cf6","#e11d48","#0891b2"];
                        const cor = CORES[idx % CORES.length];
                        const sel = aula.substitutoEscolhido?.id === prof.id;
                        return (
                          <TouchableOpacity
                            key={prof.id}
                            style={[sb.profRow2, sel && { backgroundColor: cor + "10", borderColor: cor + "40" }]}
                            onPress={() => selecionarSubstituto(diaSelecionadoSub, aula.aulaId, prof)}
                            activeOpacity={0.75}
                          >
                            <View style={[sb.profAvatar2, { backgroundColor: cor + "20" }]}>
                              {prof.foto
                                ? <Image source={{ uri: prof.foto }} style={{ width: 36, height: 36, borderRadius: 11 }} resizeMode="cover" />
                                : <Text style={[sb.profInitial, { color: cor, fontSize: 16 }]}>{prof.nome[0]?.toUpperCase()}</Text>
                              }
                              {sel && <View style={[sb.profCheckBadge, { backgroundColor: cor }]}><Ionicons name="checkmark" size={9} color="#fff" /></View>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[sb.profNomeCompleto, sel && { color: cor, fontWeight: "700" }]} numberOfLines={1}>{prof.nome}</Text>
                              {prof.materias?.length > 0 && (
                                <Text style={sb.profMaterias2} numberOfLines={1}>{prof.materias.join(" · ")}</Text>
                              )}
                            </View>
                            {sel && <Ionicons name="checkmark-circle" size={20} color={cor} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={sb.footer}>
              <TouchableOpacity style={sb.cancelBtn} onPress={() => setModalSubstituto(false)} activeOpacity={0.75}>
                <Text style={sb.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sb.confirmBtn, (salvandoSubstituto || !Object.values(aulasPorDia).flat().some(a => a.substitutoEscolhido)) && { opacity: 0.5 }]}
                onPress={confirmarSubstituto}
                disabled={salvandoSubstituto || !Object.values(aulasPorDia).flat().some(a => a.substitutoEscolhido)}
                activeOpacity={0.85}
              >
                {salvandoSubstituto ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-outline" size={18} color="#fff" /><Text style={sb.confirmText}>Confirmar</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pop-up de sucesso da substituição */}
      <Modal visible={!!sucessoSubstituto} transparent animationType="fade" onRequestClose={() => { const t = sucessoSubstituto?.temMais; setSucessoSubstituto(null); if (t) setModalAlertas(true); }}>
        <View style={sb.successOverlay}>
          <View style={sb.successBox}>
            <View style={sb.successIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color="#3a7d44" />
            </View>
            <Text style={sb.successTitle}>Substituição confirmada!</Text>
            <Text style={sb.successMsg}>
              <Text style={{ fontWeight: "800" }}>{sucessoSubstituto?.aulas ?? 0} aula(s)</Text> transferida(s) para{"\n"}
              <Text style={{ fontWeight: "800" }}>{sucessoSubstituto?.nome}</Text>.
            </Text>
            {sucessoSubstituto?.temMais && (
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textAlign: "center" }}>
                Ainda há avisos pendentes de outros dias.
              </Text>
            )}
            <TouchableOpacity style={sb.successBtn} onPress={() => {
              const temMais = sucessoSubstituto?.temMais;
              setSucessoSubstituto(null);
              if (temMais) setModalAlertas(true);
            }} activeOpacity={0.85}>
              <Text style={sb.successBtnText}>{sucessoSubstituto?.temMais ? "Ver próximo" : "Fechar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Drawer overlay + painel */}
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
                <Text style={s.drawerSubtitle}>{usuario?.papel === "Supervisao" ? "Supervisão" : usuario?.papel ?? ""}</Text>
              </View>
            </View>

            {/* Itens com icon wrap colorido */}
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

const al = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  box: {
    width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 28,
    alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  profNome: { fontSize: 20, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  horarioRow: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFF7ED", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  horarioText: { fontSize: 13, color: "#f97316" },
  motivo: { fontSize: 13, color: "#555", textAlign: "center", lineHeight: 20, fontStyle: "italic", paddingHorizontal: 8 },
  dataText: { fontSize: 11, color: "#bbb" },
  counter: { fontSize: 11, color: "#aaa", fontWeight: "600" },
  botoesRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  btnSecundario: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  btnSecundarioText: { fontSize: 14, fontWeight: "600", color: "#555" },
  btnPrimario: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  btnPrimarioText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnSubstituto: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    width: "100%", paddingVertical: 11, borderRadius: 14, marginTop: 4,
    backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  btnSubstitutoText: { fontSize: 13, fontWeight: "700", color: "#3a7d44" },
});

const sb = StyleSheet.create({
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%", paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#BBF7D0" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 12, color: "#6B7280", paddingHorizontal: 20, paddingBottom: 8 },
  diasTabsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  diaTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#E5E7EB", borderWidth: 2, borderColor: "transparent",
    alignItems: "center", gap: 3,
  },
  diaTabAtivo: { backgroundColor: "#3a7d44", borderColor: "#2d6a4f" },
  diaTabText: { fontSize: 12, fontWeight: "800", color: "#374151" },
  diaTabTextAtivo: { color: "#fff" },
  diaTabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  lista: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 6 },
  profRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: "#F1F5F9", backgroundColor: "#fff" },
  profAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  profInitial: { fontSize: 18, fontWeight: "800" },
  profNome: { fontSize: 15, fontWeight: "700", color: "#111827" },
  profMaterias: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  profCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", backgroundColor: "#F9FAFB" },
  cancelText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: "#3a7d44", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: "#3a7d44", shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  confirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  // Por aula
  aulaBloco: { backgroundColor: "#F9FAFB", borderRadius: 16, padding: 12, gap: 10, borderWidth: 1, borderColor: "#F1F5F9" },
  aulaHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  aulaTimeBadge: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  aulaTimeText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  aulaSubject: { flex: 1, fontSize: 13, fontWeight: "700", color: "#111827" },
  aulaVazio: { fontSize: 12, color: "#9CA3AF", fontStyle: "italic", textAlign: "center", paddingVertical: 4 },
  aulaProfsRow: { gap: 8, paddingVertical: 2 },
  profCard: { alignItems: "center", gap: 5, width: 58, backgroundColor: "#fff", borderRadius: 12, padding: 8, borderWidth: 1.5, borderColor: "transparent" },
  profCheckBadge: { position: "absolute", bottom: -2, right: -2, width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },
  // Lista de professores (substitui scroll horizontal)
  profList: { gap: 6 },
  profRow2: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14, padding: 10,
    borderWidth: 1.5, borderColor: "#F1F5F9",
  },
  profAvatar2: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  profNomeCompleto: { fontSize: 14, fontWeight: "600", color: "#111827" },
  profMaterias2: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  // Sucesso
  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  successBox: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  successIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#BBF7D0", marginBottom: 4 },
  successTitle: { fontSize: 18, fontWeight: "800", color: "#111827", textAlign: "center" },
  successMsg: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  successBtn: { width: "100%", backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8, shadowColor: "#3a7d44", shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  successBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
