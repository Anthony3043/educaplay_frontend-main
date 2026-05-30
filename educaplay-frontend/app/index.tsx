import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const SPLASH_DURATION = 3600;

// ─── Partícula decorativa ────────────────────────────────────
function Particle({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `rgba(255,255,255,${opacity})`,
      }}
    />
  );
}

// ─── Splash principal ────────────────────────────────────────
export default function SplashScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const usuarioRef = useRef(usuario);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);

  // Animações
  const topOpacity  = useSharedValue(0);
  const topY        = useSharedValue(-16);
  const mascoteY    = useSharedValue(60);
  const mascoteOp   = useSharedValue(0);
  const d1 = useSharedValue(0.2);
  const d2 = useSharedValue(0.2);
  const d3 = useSharedValue(0.2);

  useEffect(() => {
    // Topo entra primeiro
    topOpacity.value = withTiming(1,  { duration: 500, easing: Easing.out(Easing.cubic) });
    topY.value       = withTiming(0,  { duration: 500, easing: Easing.out(Easing.cubic) });

    // Mascote sobe logo depois
    mascoteY.value   = withDelay(220, withSpring(0, { damping: 16, stiffness: 120 }));
    mascoteOp.value  = withDelay(220, withTiming(1, { duration: 500 }));

    // Dots
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1,   { duration: 420 }),
          withTiming(0.2, { duration: 420 }),
        ), -1
      );
    d1.value = withDelay(700, pulse());
    d2.value = withDelay(700 + 180, pulse());
    d3.value = withDelay(700 + 360, pulse());

    const t = setTimeout(() => {
      const u = usuarioRef.current;
      router.replace(
        u ? (u.papel === "Professor" ? "/professor/home-professor" : "/supervisao/home")
          : "/auth/Login"
      );
    }, SPLASH_DURATION);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const topStyle      = useAnimatedStyle(() => ({ opacity: topOpacity.value, transform: [{ translateY: topY.value }] }));
  const mascoteStyle  = useAnimatedStyle(() => ({ opacity: mascoteOp.value,  transform: [{ translateY: mascoteY.value }] }));
  const d1s = useAnimatedStyle(() => ({ opacity: d1.value }));
  const d2s = useAnimatedStyle(() => ({ opacity: d2.value }));
  const d3s = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={s.container}>

      {/* ── Fundo: grande círculo claro atrás ── */}
      <View style={s.bgGlow} />

      {/* ── Partículas espalhadas ── */}
      <Particle x={width * 0.08}  y={height * 0.07}  size={6}  opacity={0.18} />
      <Particle x={width * 0.85}  y={height * 0.06}  size={4}  opacity={0.14} />
      <Particle x={width * 0.72}  y={height * 0.15}  size={8}  opacity={0.10} />
      <Particle x={width * 0.12}  y={height * 0.22}  size={5}  opacity={0.12} />
      <Particle x={width * 0.88}  y={height * 0.28}  size={6}  opacity={0.10} />
      <Particle x={width * 0.05}  y={height * 0.42}  size={4}  opacity={0.10} />
      <Particle x={width * 0.92}  y={height * 0.48}  size={5}  opacity={0.08} />

      {/* ── IDENTIDADE (terço superior) ── */}
      <Animated.View style={[s.identidade, topStyle]}>

        {/* Logo como ícone de app */}
        <View style={s.logoBadge}>
          <Image
            source={require("@/assets/images/logo_icon.png")}
            style={s.logoImg}
            resizeMode="contain"
          />
        </View>

        {/* Nome */}
        <Text style={s.appName}>
          Educa<Text style={s.appNamePlay}>Play</Text>
        </Text>

        {/* Separador e tagline */}
        <View style={s.taglineBlock}>
          <View style={s.taglineDots}>
            <View style={s.tDot} />
            <View style={[s.tDot, { width: 20 }]} />
            <View style={s.tDot} />
          </View>
          <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>
        </View>
      </Animated.View>

      {/* ── MASCOTE (herói — ocupa 2/3 inferiores) ── */}
      <Animated.View style={[s.mascoteArea, mascoteStyle]}>
        <Image
          source={require("@/assets/images/ze_bloco.png")}
          style={s.mascote}
          resizeMode="contain"
        />
        {/* Sombra elíptica natural */}
        <View style={s.mascoteShadow} />
      </Animated.View>

      {/* ── Arco de "palco" curvado ── */}
      <View style={s.stage} />

      {/* ── Dots ── */}
      <View style={s.dotsRow}>
        <Animated.View style={[s.dot, d1s]} />
        <Animated.View style={[s.dot, d2s]} />
        <Animated.View style={[s.dot, d3s]} />
      </View>

    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    overflow: "hidden",
  },

  // Glow de fundo
  bgGlow: {
    position: "absolute",
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
    backgroundColor: "rgba(255,255,255,0.055)",
    top: -width * 0.7,
    alignSelf: "center",
  },

  // ── Identidade ────────────────────────────────────────────
  identidade: {
    alignItems: "center",
    paddingTop: height * 0.10,
    gap: 10,
    zIndex: 2,
  },

  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 2,
  },
  logoImg: { width: 44, height: 44 },

  appName: {
    fontSize: 46,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.8,
    lineHeight: 50,
  },
  appNamePlay: {
    color: "rgba(255,255,255,0.75)",
  },

  taglineBlock: { alignItems: "center", gap: 7, marginTop: 2 },
  taglineDots: { flexDirection: "row", alignItems: "center", gap: 4 },
  tDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.58)",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  // ── Mascote ───────────────────────────────────────────────
  mascoteArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 72,
    zIndex: 3,
    width: "100%",
  },
  mascote: {
    width: width * 0.78,
    height: width * 0.78,
  },
  mascoteShadow: {
    width: width * 0.42,
    height: 14,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: -8,
  },

  // Palco curvado
  stage: {
    position: "absolute",
    bottom: -height * 0.08,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(0,0,0,0.09)",
    alignSelf: "center",
  },

  // ── Dots ──────────────────────────────────────────────────
  dotsRow: {
    position: "absolute",
    bottom: 44,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    zIndex: 4,
  },
  dot: {
    width: 7, height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
