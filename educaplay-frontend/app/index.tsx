import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { splashStyles as s } from "../styles/splashStyles";

const SPLASH_DURATION = 2800;

export default function SplashScreen() {
  const router = useRouter();

  // Shared values
  const topOpacity = useSharedValue(0);
  const topTranslateY = useSharedValue(-20);

  const mascoteOpacity = useSharedValue(0);
  const mascoteTranslateY = useSharedValue(50);
  const mascoteScale = useSharedValue(0.85);

  const shadowOpacity = useSharedValue(0);
  const shadowScale = useSharedValue(0.4);

  const loadingOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);

  useEffect(() => {
    // Logo + tagline deslizam de cima
    topOpacity.value = withTiming(1, { duration: 500 });
    topTranslateY.value = withSpring(0, { damping: 14, stiffness: 100 });

    // Estrelinhas piscam
    sparkle1Opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    sparkle2Opacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // Zé Bloco sobe com bounce
    mascoteOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    mascoteTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 11, stiffness: 110, mass: 0.9 }),
    );
    mascoteScale.value = withDelay(
      200,
      withSpring(1, { damping: 9, stiffness: 100 }),
    );

    // Sombra do mascote
    shadowOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    shadowScale.value = withDelay(
      400,
      withSpring(1, { damping: 12, stiffness: 100 }),
    );

    // Loading bar
    loadingOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
    progressWidth.value = withDelay(
      850,
      withTiming(140, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
    );

    // Navega para login
    const timer = setTimeout(() => {
      router.replace('/Login');
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const topAnimStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [{ translateY: topTranslateY.value }],
  }));

  const mascoteAnimStyle = useAnimatedStyle(() => ({
    opacity: mascoteOpacity.value,
    transform: [
      { translateY: mascoteTranslateY.value },
      { scale: mascoteScale.value },
    ],
  }));

  const shadowAnimStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [{ scaleX: shadowScale.value }],
  }));

  const loadingWrapperAnimStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  const loadingBarAnimStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const sparkle1AnimStyle = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
  }));

  const sparkle2AnimStyle = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
  }));

  return (
    <View style={s.container}>
      {/* Círculo verde claro de fundo */}
      <View style={s.bgCircle} />

      {/* Estrelinhas decorativas (amarelo-dourado como no design) */}
      <Animated.Text
        style={[
          s.sparkle,
          sparkle1AnimStyle,
          { fontSize: 18, top: "38%", left: "12%" },
        ]}
      >
        ✦
      </Animated.Text>
      <Animated.Text
        style={[
          s.sparkle,
          sparkle2AnimStyle,
          { fontSize: 13, top: "44%", right: "14%" },
        ]}
      >
        ✦
      </Animated.Text>
      <Animated.Text
        style={[
          s.sparkle,
          sparkle1AnimStyle,
          { fontSize: 10, top: "52%", right: "20%" },
        ]}
      >
        ✦
      </Animated.Text>

      {/* Folhas decorativas — remova se não tiver os assets 
      /*<Image
        source={require('@/assets/images/leaf_left.png')}
        style={s.leafLeft}
        resizeMode="contain"
      />
      <Image
        source={require('@/assets/images/leaf_right.png')}
        style={s.leafRight}
        resizeMode="contain"
      />
      */}

      {/* Logo + tagline */}
      <Animated.View style={[s.topArea, topAnimStyle]}>
        <View style={s.logoRow}>
          <Image
            source={require("@/assets/images/logo_icon.png")}
            style={s.logoImage}
            resizeMode="contain"
          />
          <Text style={s.logoText}>
            Educa<Text style={s.logoTextAccent}>Play</Text>
          </Text>
        </View>
        <Text style={s.tagline}>Organize hoje, ensine melhor amanhã.</Text>
      </Animated.View>

      {/* Zé Bloco */}
      <Animated.View style={[s.mascoteWrapper, mascoteAnimStyle]}>
        <Image
          source={require("@/assets/images/ze_bloco.png")}
          style={s.mascoteImage}
          resizeMode="contain"
        />
        <Animated.View style={[s.mascoteShadow, shadowAnimStyle]} />
      </Animated.View>

      {/* Loading bar */}
      <Animated.View style={[s.loadingWrapper, loadingWrapperAnimStyle]}>
        <View style={s.loadingTrack}>
          <Animated.View style={[s.loadingBar, loadingBarAnimStyle]} />
        </View>
        <Text style={s.loadingText}>Carregando</Text>
      </Animated.View>
    </View>
  );
}
