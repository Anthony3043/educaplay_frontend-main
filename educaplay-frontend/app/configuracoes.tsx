import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import type { Href } from "expo-router";
import { useAuth } from "../context/AuthContext";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "cronograma", icon: "📅", label: "Cronograma" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações" },
];

const CONFIG_ITEMS: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: Href;
}> = [
  {
    id: "perfil",
    title: "Meu Perfil",
    subtitle: "Editar informações pessoais",
    icon: "👤",
    route: "/perfil",
  },
  {
    id: "notificacoes",
    title: "Notificações",
    subtitle: "Gerenciar preferências",
    icon: "🔔",
    route: "/notificacoes",
  },
  {
    id: "privacidade",
    title: "Privacidade",
    subtitle: "Controlar acesso",
    icon: "🔒",
    route: "/privacidade",
  },
  {
    id: "sobre",
    title: "Sobre",
    subtitle: "Versão e informações",
    icon: "ℹ️",
    route: "/sobre",
  },
];

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { logout, usuario } = useAuth();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const isProfessor = usuario?.papel === "Professor";

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.push(isProfessor ? "/home-professor" : "/home");
    } else if (tabId === "cronograma") {
      router.push(isProfessor ? "/cronogramas-professor" : "/cronogramas");
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Configurações */}
        <View style={s.section}>
          {CONFIG_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.configItem}
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route)}
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
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={s.btnLogout} activeOpacity={0.85} onPress={async () => { await logout(); router.replace("/Login"); }}>
          <Text style={s.btnLogoutText}>Sair</Text>
        </TouchableOpacity>
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
              <Text style={[s.tabIcon, isActive && s.tabIconActive]}>
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
