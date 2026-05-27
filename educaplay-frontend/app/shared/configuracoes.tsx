import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import type { Href } from "expo-router";
import { useAuth } from "../context/AuthContext";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const TABS = [
  { id: "home", ionicon: "home-outline" as const, label: "Home" },
  { id: "cronograma", ionicon: "calendar-outline" as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline" as const, label: "Configurações" },
];

const CONFIG_ITEMS: {
  id: string;
  title: string;
  subtitle: string;
  ionicon: "person-outline" | "notifications-outline" | "lock-closed-outline" | "information-circle-outline";
  route?: Href;
}[] = [
  {
    id: "perfil",
    title: "Meu Perfil",
    subtitle: "Editar informações pessoais",
    ionicon: "person-outline",
    route: "/shared/perfil",
  },
  {
    id: "notificacoes",
    title: "Notificações",
    subtitle: "Gerenciar preferências",
    ionicon: "notifications-outline",
    route: "/shared/notificacoes",
  },
  {
    id: "privacidade",
    title: "Privacidade",
    subtitle: "Controlar acesso",
    ionicon: "lock-closed-outline",
    route: "/shared/privacidade",
  },
  {
    id: "sobre",
    title: "Sobre",
    subtitle: "Versão e informações",
    ionicon: "information-circle-outline",
    route: "/shared/sobre",
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
      router.push(isProfessor ? "/professor/home-professor" : "/supervisao/home");
    } else if (tabId === "cronograma") {
      router.push(isProfessor ? "/professor/cronogramas-professor" : "/supervisao/cronogramas");
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
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
                <Ionicons name={item.ionicon} size={20} color="#1a1a2e" />
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
                <Text style={s.configSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbbcc8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={s.btnLogout} activeOpacity={0.85} onPress={async () => { await logout(); router.replace("/auth/Login"); }}>
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
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#888"} />
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
