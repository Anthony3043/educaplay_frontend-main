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

// ─── Dot pulsante ───────────────────────────────────────────
function PulseDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1,   duration: 360, easing: Easing.out(Easing.sin), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 360, easing: Easing.in(Easing.sin),  useNativeDriver: true }),
        Animated.delay(700 - delay),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// ─── Props ──────────────────────────────────────────────────
interface Props {
  /** Quando false, inicia fade-out de 400ms antes de chamar onDismiss */
  visible: boolean;
  onDismiss: () => void;
}

// ─── Splash principal ────────────────────────────────────────
export default function AppSplashScreen({ visible, onDismiss }: Props) {
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Animações de entrada
  const foilOpacity    = useRef(new Animated.Value(0)).current;
  const foilY          = useRef(new Animated.Value(-24)).current;
  const logoScale      = useRef(new Animated.Value(0.35)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const textY          = useRef(new Animated.Value(28)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const mascoteY       = useRef(new Animated.Value(56)).current;
  const mascoteOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity    = useRef(new Animated.Value(0)).current;

  // ── Entrada ────────────────────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(foilOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(foilY,       { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale,  { toValue: 1, damping: 10, stiffness: 180, mass: 0.8, useNativeDriver: true }),
        Animated.timing(logoOpacity,{ toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textY,      { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textOpacity,{ toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mascoteY,       { toValue: 0, duration: 480, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
        Animated.timing(mascoteOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Saída: fade-out suave quando visible vira false ────────
  useEffect(() => {
    if (!visible) {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>

      {/* ── Foil do topo ── */}
      <Animated.View style={[styles.foilWrap, { opacity: foilOpacity, transform: [{ translateY: foilY }] }]}>
        <Image
          source={require('../assets/images/design_foil.png')}
          style={styles.foilImage}
          resizeMode="cover"
        />
        {/* Degrade para fundir com o fundo */}
        <View style={styles.foilFade} />
      </Animated.View>

      {/* ── Centro ── */}
      <View style={styles.center}>

        {/* Logo */}
        <Animated.View style={[styles.logoRingOuter, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoRingInner}>
            <Image
              source={require('../assets/images/logo_icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Nome */}
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], marginBottom: 16 }}>
          <Text style={styles.name}>
            Educa<Text style={styles.nameAccent}>Play</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineWrap, { opacity: taglineOpacity }]}>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Organize hoje, ensine melhor amanhã.</Text>
        </Animated.View>
      </View>

      {/* ── Mascote ── */}
      <Animated.View style={[styles.mascoteWrap, { opacity: mascoteOpacity, transform: [{ translateY: mascoteY }] }]}>
        <Image
          source={require('../assets/images/ze_bloco_menu_supervisao.png')}
          style={styles.mascoteImage}
          resizeMode="contain"
        />
        <View style={styles.mascoteShadow} />
      </Animated.View>

      {/* ── Dots ── */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <PulseDot delay={0} />
        <PulseDot delay={180} />
        <PulseDot delay={360} />
      </Animated.View>

    </Animated.View>
  );
}

// ─── Estilos ────────────────────────────────────────────────
const LOGO_SIZE = 86;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0faf1',   // green50 — mesma do resto do app
    alignItems: 'center',
    zIndex: 999,
  },

  // Foil
  foilWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.34,
  },
  foilImage: { width: '100%', height: '100%' },
  foilFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 72,
    backgroundColor: '#f0faf1',
    opacity: 0.9,
  },

  // Centro
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.06,
  },

  // Logo
  logoRingOuter: {
    width: LOGO_SIZE + 30,
    height: LOGO_SIZE + 30,
    borderRadius: (LOGO_SIZE + 30) / 2,
    backgroundColor: '#e8f5ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#3a7d44',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
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
    width: LOGO_SIZE * 0.62,
    height: LOGO_SIZE * 0.62,
  },

  // Nome
  name: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  nameAccent: { color: '#3a7d44' },

  // Tagline
  taglineWrap: { alignItems: 'center', gap: 10 },
  divider: { width: 36, height: 2, backgroundColor: '#bbf7d0', borderRadius: 1 },
  tagline: {
    fontSize: 13.5,
    color: '#6B7280',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  // Mascote
  mascoteWrap: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.1,
  },
  mascoteImage: {
    width: width * 0.52,
    height: width * 0.52,
  },
  mascoteShadow: {
    width: width * 0.26,
    height: 9,
    borderRadius: 50,
    backgroundColor: '#3a7d44',
    opacity: 0.1,
    marginTop: -6,
  },

  // Dots
  dotsRow: {
    position: 'absolute',
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7, height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3a7d44',
  },
});
