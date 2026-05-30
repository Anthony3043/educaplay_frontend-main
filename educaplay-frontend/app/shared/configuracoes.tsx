import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import type { Href } from "expo-router";
import { useAuth } from "../../context/AuthContext";
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
  { id: "home",          ionicon: "home-outline"     as const, label: "Home" },
  { id: "cronograma",    ionicon: "calendar-outline"  as const, label: "Cronograma" },
  { id: "configuracoes", ionicon: "settings-outline"  as const, label: "Configurações" },
];

const CONFIG_ITEMS: {
  id: string; title: string; subtitle: string;
  ionicon: "person-outline" | "notifications-outline" | "lock-closed-outline" | "information-circle-outline";
  color: string; bg: string;
  route?: Href;
}[] = [
  { id: "perfil",        title: "Meu Perfil",   subtitle: "Editar informações pessoais",  ionicon: "person-outline",               color: "#3a7d44", bg: "#F0FDF4", route: "/shared/perfil" },
  { id: "notificacoes",  title: "Notificações", subtitle: "Gerenciar preferências",       ionicon: "notifications-outline",        color: "#3b82f6", bg: "#EFF6FF", route: "/shared/notificacoes" },
  { id: "privacidade",   title: "Privacidade",  subtitle: "Controlar acesso",             ionicon: "lock-closed-outline",          color: "#8b5cf6", bg: "#F5F3FF", route: "/shared/privacidade" },
  { id: "sobre",         title: "Sobre",        subtitle: "Versão e informações",         ionicon: "information-circle-outline",   color: "#6B7280", bg: "#F9FAFB", route: "/shared/sobre" },
];

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { logout, usuario } = useAuth();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const isProfessor = usuario?.papel === "Professor";

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") router.push(isProfessor ? "/professor/home-professor" : "/supervisao/home");
    else if (tabId === "cronograma") router.push(isProfessor ? "/professor/cronogramas-professor" : "/supervisao/cronogramas");
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={s.sectionLabel}>Conta e preferências</Text>

        {/* Itens agrupados num único card */}
        <View style={s.section}>
          {CONFIG_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[s.configItem, idx < CONFIG_ITEMS.length - 1 && s.configItemBorder]}
              activeOpacity={0.72}
              onPress={() => item.route && router.push(item.route)}
            >
              <View style={[s.configIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.ionicon} size={20} color={item.color} />
              </View>
              <View style={s.configContent}>
                <Text style={s.configTitle}>{item.title}</Text>
                <Text style={s.configSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Sessão</Text>

        {/* Logout — card próprio com destaque vermelho sutil */}
        <View style={s.logoutSection}>
          <TouchableOpacity
            style={s.btnLogout}
            activeOpacity={0.8}
            onPress={async () => { await logout(); router.replace("/auth/Login"); }}
          >
            <View style={s.btnLogoutIcon}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={s.btnLogoutText}>Sair da conta</Text>
            <Ionicons name="chevron-forward" size={18} color="#FECACA" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={s.tabItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
              <Ionicons name={tab.ionicon} size={22} color={isActive ? "#3a7d44" : "#9CA3AF"} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
