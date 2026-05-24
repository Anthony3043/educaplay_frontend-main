import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// A splash nativa some em ~400 ms (MIN_SPLASH_MS em _layout.tsx).
// Todos os elementos já começam visíveis — o usuário vê Ze Bloco
// imediatamente, sem depender de animações de fade funcionando.
const SPLASH_DURATION = 3800;

const DOT_PULSE = 380;
const DOT_STAGGER = 200;

export default function SplashScreen() {
  const router = useRouter();

  // Escala começa levemente menor para uma entrada suave
  const mascoteScale = useSharedValue(0.93);

  const dot1Opacity = useSharedValue(0.2);
  const dot2Opacity = useSharedValue(0.2);
  const dot3Opacity = useSharedValue(0.2);

  useEffect(() => {
    // Ze Bloco cresce suavemente até o tamanho final
    mascoteScale.value = withSpring(1, { damping: 18, stiffness: 90 });

    // Pontos pulsam em sequência
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: DOT_PULSE }),
          withTiming(0.2, { duration: DOT_PULSE }),
        ),
        -1,
      );

    dot1Opacity.value = withDelay(500, pulse());
    dot2Opacity.value = withDelay(500 + DOT_STAGGER, pulse());
    dot3Opacity.value = withDelay(500 + DOT_STAGGER * 2, pulse());

    const timer = setTimeout(() => router.replace("/Login"), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mascoteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascoteScale.value }],
  }));

  const d1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  return (
    <View style={s.container}>
      <View style={s.ellipse} />

      {/* Header: logo + nome — sempre visível, sem animação de opacidade */}
      <View style={s.header}>
        <Image
          source={require("@/assets/images/logo_icon.png")}
          style={s.logoImage}
          resizeMode="contain"
        />
        <Text style={s.appName}>
          Educa<Text style={s.accent}>Play</Text>
        </Text>
      </View>

      {/* Zé Bloco — sempre visível, apenas escala suave */}
      <Animated.Image
        source={require("@/assets/images/ze_bloco.png")}
        style={[s.mascote, mascoteStyle]}
        resizeMode="contain"
      />

      {/* Tagline — sempre visível */}
      <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>

      {/* Pontos de carregamento */}
      <View style={s.dotsRow}>
        <Animated.View style={[s.dot, d1Style]} />
        <Animated.View style={[s.dot, d2Style]} />
        <Animated.View style={[s.dot, d3Style]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    justifyContent: "center",
  },
  ellipse: {
    position: "absolute",
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: "rgba(0,0,0,0.08)",
    bottom: -width * 0.3,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  accent: {
    color: "rgba(255,255,255,0.6)",
  },
  mascote: {
    width: width * 0.58,
    height: width * 0.58,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  dotsRow: {
    position: "absolute",
    bottom: 56,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
});
