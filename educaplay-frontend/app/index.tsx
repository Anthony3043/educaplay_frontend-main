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

// As animações começam imediatamente ao montar o componente.
// A splash nativa cobre os primeiros ~2 s; quando some, o Zé Bloco
// já está totalmente visível — sem tela em branco entre as duas.
const SPLASH_DURATION = 3500;

const DOT_PULSE = 380;
const DOT_STAGGER = 200;

export default function SplashScreen() {
  const router = useRouter();

  const headerOpacity = useSharedValue(0);
  const mascoteOpacity = useSharedValue(0);
  const mascoteScale = useSharedValue(0.88);
  const taglineOpacity = useSharedValue(0);
  const dot1Opacity = useSharedValue(0.2);
  const dot2Opacity = useSharedValue(0.2);
  const dot3Opacity = useSharedValue(0.2);

  useEffect(() => {
    // Logo + nome
    headerOpacity.value = withTiming(1, { duration: 500 });

    // Mascote — escala suave, sem bounce
    mascoteOpacity.value = withDelay(150, withTiming(1, { duration: 600 }));
    mascoteScale.value = withDelay(
      150,
      withSpring(1, { damping: 20, stiffness: 100 }),
    );

    // Tagline
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));

    // Pontos pulsam em sequência
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: DOT_PULSE }),
          withTiming(0.2, { duration: DOT_PULSE }),
        ),
        -1,
      );

    dot1Opacity.value = withDelay(800, pulse());
    dot2Opacity.value = withDelay(800 + DOT_STAGGER, pulse());
    dot3Opacity.value = withDelay(800 + DOT_STAGGER * 2, pulse());

    const timer = setTimeout(() => router.replace("/Login"), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const mascoteStyle = useAnimatedStyle(() => ({
    opacity: mascoteOpacity.value,
    transform: [{ scale: mascoteScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const d1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  return (
    <View style={s.container}>
      {/* Elipse decorativa atrás do mascote */}
      <View style={s.ellipse} />

      {/* Logo + nome do app */}
      <Animated.View style={[s.header, headerStyle]}>
        <Image
          source={require("@/assets/images/logo_icon.png")}
          style={s.logoImage}
          resizeMode="contain"
        />
        <Text style={s.appName}>
          Educa<Text style={s.accent}>Play</Text>
        </Text>
      </Animated.View>

      {/* Zé Bloco centralizado */}
      <Animated.Image
        source={require("@/assets/images/ze_bloco.png")}
        style={[s.mascote, mascoteStyle]}
        resizeMode="contain"
      />

      {/* Tagline */}
      <Animated.Text style={[s.tagline, taglineStyle]}>
        Organize hoje, ensine melhor amanhã.
      </Animated.Text>

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

  // Elipse verde mais escura atrás do mascote para dar profundidade
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
