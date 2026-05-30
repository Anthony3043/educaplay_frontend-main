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
const DOT_PULSE   = 400;
const DOT_STAGGER = 180;

export default function SplashScreen() {
  const router   = useRouter();
  const { usuario } = useAuth();
  const usuarioRef  = useRef(usuario);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);

  // ── Animações de entrada ────────────────────────────────
  const logoScale   = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const nameY       = useSharedValue(20);
  const nameOpacity = useSharedValue(0);
  const mascoteY    = useSharedValue(40);
  const mascoteScale = useSharedValue(0.88);
  const tagOpacity  = useSharedValue(0);

  // Dots
  const d1 = useSharedValue(0.2);
  const d2 = useSharedValue(0.2);
  const d3 = useSharedValue(0.2);

  useEffect(() => {
    // Logo entra com spring
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 200 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 350 }));

    // Nome slide-up
    nameY.value       = withDelay(280, withTiming(0,   { duration: 420, easing: Easing.out(Easing.cubic) }));
    nameOpacity.value = withDelay(280, withTiming(1,   { duration: 420 }));

    // Mascote emerge
    mascoteY.value     = withDelay(160, withTiming(0,   { duration: 600, easing: Easing.out(Easing.back(1.05)) }));
    mascoteScale.value = withDelay(160, withSpring(1,  { damping: 14, stiffness: 100 }));

    // Tagline
    tagOpacity.value = withDelay(520, withTiming(1, { duration: 380 }));

    // Dots pulsam
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1,   { duration: DOT_PULSE }),
          withTiming(0.2, { duration: DOT_PULSE }),
        ), -1
      );
    d1.value = withDelay(700, pulse());
    d2.value = withDelay(700 + DOT_STAGGER, pulse());
    d3.value = withDelay(700 + DOT_STAGGER * 2, pulse());

    // Navega após SPLASH_DURATION
    const timer = setTimeout(() => {
      const u = usuarioRef.current;
      router.replace(
        u ? (u.papel === "Professor" ? "/professor/home-professor" : "/supervisao/home")
          : "/auth/Login"
      );
    }, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  const logoStyle     = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const nameStyle     = useAnimatedStyle(() => ({ opacity: nameOpacity.value, transform: [{ translateY: nameY.value }] }));
  const mascoteStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: mascoteY.value }, { scale: mascoteScale.value }] }));
  const tagStyle      = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));
  const d1Style = useAnimatedStyle(() => ({ opacity: d1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: d2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={s.container}>

      {/* ── Camadas de profundidade ── */}
      <View style={s.depthCircleBack} />
      <View style={s.depthCircleFront} />

      {/* ── Arco decorativo superior ── */}
      <View style={s.arcTop} />

      {/* ── Logo badge ── */}
      <View style={s.topBlock}>
        <Animated.View style={[s.logoBadge, logoStyle]}>
          <Image
            source={require("@/assets/images/logo_icon.png")}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── Nome ── */}
        <Animated.View style={nameStyle}>
          <Text style={s.appName}>
            Educa<Text style={s.appNameAccent}>Play</Text>
          </Text>
        </Animated.View>

        {/* ── Tagline ── */}
        <Animated.View style={tagStyle}>
          <View style={s.divider} />
          <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>
        </Animated.View>
      </View>

      {/* ── Mascote no centro ── */}
      <View style={s.mascoteWrap}>
        {/* Halo atrás do mascote */}
        <View style={s.halo} />
        <Animated.Image
          source={require("@/assets/images/ze_bloco.png")}
          style={[s.mascote, mascoteStyle]}
          resizeMode="contain"
        />
        {/* Sombra elíptica */}
        <View style={s.shadow} />
      </View>

      {/* ── Dots ── */}
      <View style={s.dotsRow}>
        <Animated.View style={[s.dot, d1Style]} />
        <Animated.View style={[s.dot, d2Style]} />
        <Animated.View style={[s.dot, d3Style]} />
      </View>

      {/* ── Arco inferior ── */}
      <View style={s.arcBottom} />
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────
const styles = StyleSheet;

const s = styles.create({
  container: {
    flex: 1,
    backgroundColor: "#3a7d44",
    alignItems: "center",
    overflow: "hidden",
  },

  // ── Profundidade ──────────────────────────────────────────
  depthCircleBack: {
    position: "absolute",
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -width * 0.4,
    alignSelf: "center",
  },
  depthCircleFront: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -width * 0.2,
    alignSelf: "center",
  },

  // ── Arcos decorativos ─────────────────────────────────────
  arcTop: {
    position: "absolute",
    top: -height * 0.18,
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
  },
  arcBottom: {
    position: "absolute",
    bottom: -height * 0.1,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignSelf: "center",
  },

  // ── Bloco de identidade (topo) ────────────────────────────
  topBlock: {
    alignItems: "center",
    paddingTop: height * 0.12,
    gap: 12,
    zIndex: 2,
  },

  // Logo badge — ícone em quadrado branco arredondado
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    // shadow verde suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  logoImg: {
    width: 46,
    height: 46,
  },

  // Nome
  appName: {
    fontSize: 44,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  appNameAccent: {
    color: "rgba(255,255,255,0.55)",
  },

  // Separador + tagline
  divider: {
    width: 32,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    alignSelf: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // ── Mascote ───────────────────────────────────────────────
  mascoteWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 80,
    zIndex: 2,
  },
  halo: {
    position: "absolute",
    bottom: 60,
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.31,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  mascote: {
    width: width * 0.64,
    height: width * 0.64,
  },
  shadow: {
    width: width * 0.38,
    height: 12,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginTop: -4,
  },

  // ── Dots ──────────────────────────────────────────────────
  dotsRow: {
    position: "absolute",
    bottom: 48,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    zIndex: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});
