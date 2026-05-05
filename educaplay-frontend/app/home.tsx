import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { homeStyles as s } from "../styles/HomeStyles";

const MENU_ITEMS = [
  {
    id: "cronogramas",
    icon: "📅",
    iconBg: "#e8f5ea",
    title: "Cronogramas",
    subtitle: "Crie e gerencie\nos horários",
    route: "/cronogramas",
  },
  {
    id: "professores",
    icon: "👥",
    iconBg: "#e8f0fe",
    title: "Professores",
    subtitle: "Cadastre e visualize\nos professores",
    route: "/professores",
  },
  {
    id: "salas",
    icon: "🚪",
    iconBg: "#fff3e0",
    title: "Salas",
    subtitle: "Cadastre e gerencie\nas salas da escola",
    route: "/salas",
  },
];

const TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "cronograma", icon: "📅", label: "Cronograma" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações" },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");

  const userName = "Anthony";

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "cronograma") router.push("/cronogramas");
    else if (tabId === "configuracoes") router.push("/configuracoes");
    else if (tabId === "home") router.push("/home");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={s.headerLogo}>
          <Image
            source={require("@/assets/images/logo_icon.png")}
            style={s.headerLogoImage}
            resizeMode="contain"
          />
          <Text style={s.headerLogoText}>
            Planeja<Text style={s.headerLogoAccent}>Edu</Text>
          </Text>
        </View>

        <TouchableOpacity style={s.notifWrapper}>
          <Text style={s.notifIcon}>🔔</Text>
          <View style={s.notifBadge}>
            <Text style={s.notifBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerTextArea}>
            <Text style={s.bannerGreeting}>
              Olá, {userName}! <Text style={s.bannerEmoji}>👋</Text>
            </Text>
            <Text style={s.bannerSubtitle}>
              Que bom ver você por aqui.{"\n"}
              Vamos organizar um{"\n"}
              dia incrível de aulas!
            </Text>
          </View>
          <Image
            source={require("@/assets/images/ze_bloco_menu_supervisao.png")}
            style={s.bannerMascote}
            resizeMode="contain"
          />
        </View>

        <View style={s.divider} />

        {/* Menu Principal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Menu Principal</Text>
          <View style={s.menuGrid}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.menuCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[s.menuCardIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={s.menuCardIconText}>{item.icon}</Text>
                </View>
                <Text style={s.menuCardTitle}>{item.title}</Text>
                <Text style={s.menuCardSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Criar Cronograma */}
        <TouchableOpacity
          style={s.btnCriar}
          onPress={() => router.push("/cronogramas/novo" as any)}
          activeOpacity={0.85}
        >
          <Text style={s.btnCriarIcon}>＋</Text>
          <Text style={s.btnCriarText}>Criar Cronograma</Text>
        </TouchableOpacity>

        {/* Dica */}
        <View style={s.dicaCard}>
          <Image
            source={require("@/assets/images/ze_bloco_dicas.png")}
            style={s.dicaMascote}
            resizeMode="contain"
          />
          <View style={s.dicaTextArea}>
            <Text style={s.dicaTitle}>
              Dica do Zé Bloquinho <Text style={s.dicaTitleEmoji}>💡</Text>
            </Text>
            <Text style={s.dicaText}>
              Mantenha seus horários sempre{"\n"}
              atualizados e evite conflitos!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabIcon, isActive && { color: "#3a7d44" }]}>
                {tab.icon}
              </Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}