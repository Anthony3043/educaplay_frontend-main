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
const SPLASH = 3600;


export default function SplashScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const ref = useRef(usuario);
  useEffect(() => { ref.current = usuario; }, [usuario]);

  // Valores animados
  const brandOp  = useSharedValue(0);
  const brandY   = useSharedValue(-20);
  const glowS    = useSharedValue(0.6);
  const glowOp   = useSharedValue(0);
  const mascoteY = useSharedValue(80);
  const mascoteO = useSharedValue(0);
  const dotsOp   = useSharedValue(0);
  const d1 = useSharedValue(0.25);
  const d2 = useSharedValue(0.25);
  const d3 = useSharedValue(0.25);

  useEffect(() => {
    // 1. Brand entra
    brandOp.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
    brandY.value  = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) });

    // 2. Glow expande
    glowS.value  = withDelay(100, withTiming(1,   { duration: 800, easing: Easing.out(Easing.cubic) }));
    glowOp.value = withDelay(100, withTiming(0.9, { duration: 600 }));

    // 3. Mascote sobe com bounce suave
    mascoteY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 130, mass: 1.1 }));
    mascoteO.value = withDelay(200, withTiming(1, { duration: 480 }));

    // 4. Dots aparecem
    dotsOp.value = withDelay(700, withTiming(1, { duration: 300 }));

    // Pulse dos dots
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1,    { duration: 440 }),
          withTiming(0.25, { duration: 440 }),
        ), -1
      );
    d1.value = withDelay(750,  pulse());
    d2.value = withDelay(950,  pulse());
    d3.value = withDelay(1150, pulse());

    const t = setTimeout(() => {
      const u = ref.current;
      router.replace(
        u ? (u.papel === "Professor" ? "/professor/home-professor" : "/supervisao/home")
          : "/auth/Login"
      );
    }, SPLASH);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const brandStyle   = useAnimatedStyle(() => ({ opacity: brandOp.value, transform: [{ translateY: brandY.value }] }));
  const glowStyle    = useAnimatedStyle(() => ({ opacity: glowOp.value,  transform: [{ scale: glowS.value }] }));
  const mascoteStyle = useAnimatedStyle(() => ({ opacity: mascoteO.value, transform: [{ translateY: mascoteY.value }] }));
  const dotsStyle    = useAnimatedStyle(() => ({ opacity: dotsOp.value }));
  const d1s = useAnimatedStyle(() => ({ opacity: d1.value }));
  const d2s = useAnimatedStyle(() => ({ opacity: d2.value }));
  const d3s = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={s.container}>

      {/* ══ CAMADAS DE FUNDO ══════════════════════════════════ */}

      {/* Padrão escolar */}
      <Image
        source={require("@/assets/images/school_pattern.png")}
        style={s.schoolPattern}
        resizeMode="cover"
      />

      {/* Vinheta: bordas mais escuras */}
      <View style={s.vignette} />


      {/* Linha diagonal sutil */}
      <View style={s.diagLine} />

      {/* ══ HOLOFOTE por trás do mascote ═══════════════════════ */}
      <Animated.View style={[s.spotlight, glowStyle]} />

      {/* ══ IDENTIDADE ════════════════════════════════════════ */}
      <Animated.View style={[s.brand, brandStyle]}>

        {/* Logo — círculo branco, mais refinado */}
        <View style={s.logoCircle}>
          <View style={s.logoInner}>
            <Image
              source={require("@/assets/images/logo_icon.png")}
              style={s.logoImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Tipografia com contraste extremo de peso */}
        <View style={s.nameBlock}>
          <Text style={s.nameEduca}>EDUCA</Text>
          <Text style={s.namePlay}>Play</Text>
        </View>

        {/* Regra + tagline */}
        <View style={s.tagRow}>
          <View style={s.rule} />
          <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>
          <View style={s.rule} />
        </View>

      </Animated.View>

      {/* ══ MASCOTE ═══════════════════════════════════════════ */}
      <Animated.View style={[s.mascoteWrap, mascoteStyle]}>
        <Image
          source={require("@/assets/images/ze_bloco.png")}
          style={s.mascote}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Arco de palco */}
      <View style={s.stageArc} />

      {/* ══ DOTS ══════════════════════════════════════════════ */}
      <Animated.View style={[s.dotsRow, dotsStyle]}>
        <Animated.View style={[s.dot, d1s]} />
        <Animated.View style={[s.dot, d2s]} />
        <Animated.View style={[s.dot, d3s]} />
      </Animated.View>

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

  // ── Fundo ─────────────────────────────────────────────────
  schoolPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.09,
  },

  vignette: {
    position: "absolute",
    inset: 0,
    // Borda escura: gradiente simulado com View grande
    width: "100%", height: "100%",
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: width * 0.5,
    shadowOpacity: 0.35,
    elevation: 0,
  },

  diagLine: {
    position: "absolute",
    width: width * 1.8,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: height * 0.36,
    left: -width * 0.4,
    transform: [{ rotate: "-12deg" }],
  },

  // Holofote
  spotlight: {
    position: "absolute",
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.475,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: height * 0.06,
    alignSelf: "center",
  },

  // ── Identidade ────────────────────────────────────────────
  brand: {
    alignItems: "center",
    paddingTop: height * 0.095,
    gap: 14,
    zIndex: 2,
  },

  // Logo — dois anéis concêntricos
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  logoImg: { width: 38, height: 38 },

  // Tipografia — contraste de peso extremo
  nameBlock: { alignItems: "center", gap: -6 },
  nameEduca: {
    fontSize: 15,
    fontWeight: "400",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 8,
    textTransform: "uppercase",
  },
  namePlay: {
    fontSize: 56,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -2,
    lineHeight: 58,
    marginTop: -2,
  },

  // Regra horizontal com tagline
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
    textAlign: "center",
    flexShrink: 1,
  },

  // ── Mascote ───────────────────────────────────────────────
  mascoteWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 3,
    width: "100%",
    paddingBottom: 56,
  },
  mascote: {
    width: width * 0.82,
    height: width * 0.82,
  },

  // Arco de palco curvado
  stageArc: {
    position: "absolute",
    bottom: -height * 0.12,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center",
  },

  // ── Dots ──────────────────────────────────────────────────
  dotsRow: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    zIndex: 4,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
});
