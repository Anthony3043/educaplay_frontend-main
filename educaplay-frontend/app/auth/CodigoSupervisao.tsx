import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { loginStyles as s } from "../styles/loginStyles";
import api from "../src/services/api";

export default function CodigoSupervisaoScreen() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [codigoVisivel, setCodigoVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const submitting = useRef(false);

  const handleValidar = async () => {
    if (submitting.current || carregando) return;
    setErro("");

    if (!codigo.trim()) {
      setErro("Informe o código de supervisão.");
      return;
    }

    submitting.current = true;
    setCarregando(true);
    try {
      await api.post("/auth/validar-codigo-supervisao", { codigo: codigo.trim() });
      router.push({ pathname: "/auth/Register", params: { codigoSupervisao: codigo.trim() } });
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErro("Código incorreto. Verifique com a sua instituição.");
      } else {
        Alert.alert("Erro", "Não foi possível validar o código. Tente novamente.");
      }
    } finally {
      setCarregando(false);
      submitting.current = false;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Área superior */}
          <View style={[s.topArea, { paddingBottom: 16 }]}>
            <Image source={require("@/assets/images/design_foil.png")} style={s.foilImage} resizeMode="cover" />
            <View style={[s.logoRow, { zIndex: 1 }]}>
              <Image source={require("@/assets/images/logo_icon.png")} style={s.logoImage} resizeMode="contain" />
              <Text style={s.logoText}>Educa<Text style={s.logoTextAccent}>Play</Text></Text>
            </View>
            <Text style={[s.tagline, { zIndex: 1 }]}>Organize hoje, ensine melhor amanhã.</Text>
          </View>

          {/* Ícone centralizado */}
          <View style={cs.iconSection}>
            <View style={cs.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#3a7d44" />
            </View>
          </View>

          {/* Card do formulário */}
          <View style={[s.card, cs.card]}>
            <Text style={s.welcomeTitle}>Área da Supervisão</Text>
            <Text style={s.welcomeSubtitle}>
              Digite o código fornecido pela sua instituição para continuar
            </Text>

            {/* Campo código */}
            <Text style={s.label}>Código de supervisão</Text>
            <View style={[s.inputWrapper, erro ? { borderColor: "#ef4444", borderWidth: 1.5 } : null]}>
              <Ionicons name="key-outline" size={18} color="#888" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Digite o código da instituição"
                placeholderTextColor="#bbbcc8"
                value={codigo}
                onChangeText={(t) => { setCodigo(t); setErro(""); }}
                secureTextEntry={!codigoVisivel}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleValidar}
              />
              <TouchableOpacity onPress={() => setCodigoVisivel(!codigoVisivel)}>
                <Ionicons name={codigoVisivel ? "eye-off-outline" : "eye-outline"} size={20} color="#888" style={s.eyeIcon} />
              </TouchableOpacity>
            </View>

            {erro ? (
              <View style={cs.erroRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                <Text style={cs.erroText}>{erro}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.btnEntrar, carregando && { opacity: 0.7 }]}
              onPress={handleValidar}
              activeOpacity={0.85}
              disabled={carregando}
            >
              {carregando ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={s.btnEntrarText}>Continuar</Text>
                  <Text style={s.btnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={[s.createAccountRow, { marginTop: 4 }]}>
              <Text style={s.createAccountText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={s.createAccountLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  iconSection: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#f0faf2",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e8f5ea",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#b7dfbe",
  },
  card: {
    marginTop: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  erroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 2,
  },
  erroText: {
    fontSize: 12,
    color: "#ef4444",
  },
});
