import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Dot de loading pulsante ────────────────────────────────
function PulseDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 380,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { opacity }]} />
  );
}

// ─── Tela principal ─────────────────────────────────────────
export default function AppSplashScreen() {
  // Valores de animação
  const foilOpacity   = useRef(new Animated.Value(0)).current;
  const foilY         = useRef(new Animated.Value(-20)).current;
  const logoScale     = useRef(new Animated.Value(0.4)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(24)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const mascoteY      = useRef(new Animated.Value(60)).current;
  const mascoteOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Sequência orquestrada ──────────────────────────────
    Animated.sequence([
      // 1. Foil verde do topo desce suavemente
      Animated.parallel([
        Animated.timing(foilOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(foilY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 2. Logo bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 10,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 3. Texto slide-up
      Animated.parallel([
        Animated.timing(textY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 4. Tagline + mascote juntos
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(mascoteY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(mascoteOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 5. Loading dots aparecem
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* ── Faixa verde do topo (foil) ── */}
      <Animated.View
        style={[
          styles.foilWrap,
          { opacity: foilOpacity, transform: [{ translateY: foilY }] },
        ]}
      >
        <Image
          source={require('../assets/images/design_foil.png')}
          style={styles.foilImage}
          resizeMode="cover"
        />
        {/* Overlay gradient manual: desvanece de verde para branco */}
        <View style={styles.foilFade} />
      </Animated.View>

      {/* ── Conteúdo central ── */}
      <View style={styles.centerBlock}>

        {/* Logo icon com anel */}
        <Animated.View
          style={[
            styles.logoRingOuter,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoRingInner}>
            <Image
              source={require('../assets/images/logo_icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Nome do app */}
        <Animated.View
          style={[
            styles.nameWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textY }],
            },
          ]}
        >
          <Text style={styles.nameText}>
            Educa<Text style={styles.nameAccent}>Play</Text>
          </Text>
        </Animated.View>

        {/* Linha divisória + tagline */}
        <Animated.View style={[styles.taglineWrap, { opacity: taglineOpacity }]}>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Organize hoje, ensine melhor amanhã.</Text>
        </Animated.View>
      </View>

      {/* ── Mascote Zé Bloco ── */}
      <Animated.View
        style={[
          styles.mascoteWrap,
          {
            opacity: mascoteOpacity,
            transform: [{ translateY: mascoteY }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/ze_bloco_menu_supervisao.png')}
          style={styles.mascoteImage}
          resizeMode="contain"
        />
        {/* Sombra elíptica do mascote */}
        <View style={styles.mascoteShadow} />
      </Animated.View>

      {/* ── Loading dots ── */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <PulseDot delay={0} />
        <PulseDot delay={160} />
        <PulseDot delay={320} />
      </Animated.View>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────
const LOGO_SIZE = 88;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  // ── Foil ──────────────────────────────────────────────────
  foilWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.36,
  },
  foilImage: {
    width: '100%',
    height: '100%',
  },
  foilFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // degrade manual de transparente para branco
    backgroundColor: 'transparent',
  },

  // ── Centro ────────────────────────────────────────────────
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.05,
    gap: 0,
  },

  // ── Logo ──────────────────────────────────────────────────
  logoRingOuter: {
    width: LOGO_SIZE + 32,
    height: LOGO_SIZE + 32,
    borderRadius: (LOGO_SIZE + 32) / 2,
    backgroundColor: '#e8f5ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // sombra verde suave
    shadowColor: '#3a7d44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  logoRingInner: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  logoImage: {
    width: LOGO_SIZE * 0.64,
    height: LOGO_SIZE * 0.64,
  },

  // ── Nome ──────────────────────────────────────────────────
  nameWrap: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1.2,
  },
  nameAccent: {
    color: '#3a7d44',
  },

  // ── Tagline ───────────────────────────────────────────────
  taglineWrap: {
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#bbf7d0',
    borderRadius: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  // ── Mascote ───────────────────────────────────────────────
  mascoteWrap: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.09,
  },
  mascoteImage: {
    width: width * 0.55,
    height: width * 0.55,
  },
  mascoteShadow: {
    width: width * 0.28,
    height: 10,
    borderRadius: 50,
    backgroundColor: '#3a7d44',
    opacity: 0.1,
    marginTop: -8,
  },

  // ── Loading dots ──────────────────────────────────────────
  dotsRow: {
    position: 'absolute',
    bottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3a7d44',
  },
});
