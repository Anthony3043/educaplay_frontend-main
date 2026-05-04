import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

export const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface, // branco
    alignItems: 'center',
  },

  // ── Área superior (logo + tagline) ──────────────────────
  topArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 16,
    zIndex: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTextAccent: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.1,
  },

  // ── Círculo de fundo (verde claro) ──────────────────────
  bgCircle: {
    position: 'absolute',
    width: width * 1.15,
    height: width * 1.15,
    borderRadius: width * 0.575,
    backgroundColor: Colors.primaryPale, // verde bem clarinho
    bottom: -width * 0.15,
    alignSelf: 'center',
  },

  // ── Estrelinhas decorativas ──────────────────────────────
  sparkle: {
    position: 'absolute',
    color: Colors.primaryLight,
    fontWeight: '700',
  },

  // ── Folhas decorativas ───────────────────────────────────
  leafLeft: {
    position: 'absolute',
    bottom: height * 0.05,
    left: -20,
    width: 100,
    height: 140,
    opacity: 0.85,
  },
  leafRight: {
    position: 'absolute',
    bottom: height * 0.05,
    right: -20,
    width: 100,
    height: 140,
    opacity: 0.85,
  },

  // ── Mascote (Zé Bloco) ───────────────────────────────────
  mascoteWrapper: {
    position: 'absolute',
    bottom: height * 0.06,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  mascoteImage: {
    width: width * 0.62,
    height: width * 0.62,
  },
  mascoteShadow: {
    width: width * 0.35,
    height: 14,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    opacity: 0.12,
    marginTop: -6,
  },

  // ── Loading ───────────────────────────────────────────────
  loadingWrapper: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingTrack: {
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primaryPale,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  loadingText: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
