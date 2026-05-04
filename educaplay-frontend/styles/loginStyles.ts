import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export const loginStyles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: Colors.surface, // branco
  },

  // ── Área superior (logo + mascote) ──────────────────────
  topArea: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingTop: 48,
    paddingBottom: 0,
  },

  // ── Logo ────────────────────────────────────────────────
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  logoTextAccent: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 0,
  },

  // ── Seção do mascote (fundo verde claro com folhas) ──────
  mascoteSection: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    paddingTop: 16,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  mascoteCircleBg: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: Colors.primaryPale,
    top: 10,
    alignSelf: 'center',
  },
  leafLeft: {
    position: 'absolute',
    bottom: 0,
    left: -10,
    width: 90,
    height: 120,
    opacity: 0.9,
  },
  leafRight: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    width: 90,
    height: 120,
    opacity: 0.9,
  },
  sparkle: {
    position: 'absolute',
    color: '#d4a017',
    fontWeight: '700',
    zIndex: 2,
  },
  mascoteImage: {
    width: width * 1.0,
    height: width * 0.48,
    zIndex: 2,
  },

  // ── Card branco (formulário) ─────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    marginTop: -20, // sobe sobre o mascote section
    flex: 1,
    // sombra sutil no topo
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },

  // ── Inputs ───────────────────────────────────────────────
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    marginBottom: 14,
    gap: 8,
  },
  inputIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeIcon: { fontSize: 16, paddingLeft: 4 },

  // ── Lembrar-me / Esqueceu a senha ────────────────────────
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  checkboxLabel: { fontSize: 13, color: Colors.textSecondary },
  forgotLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // ── Botão Entrar ─────────────────────────────────────────
  btnEntrar: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 18,
  },
  btnEntrarText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnArrow: {
    color: Colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },

  // ── Divisor ──────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted },

  // ── Botão Google ─────────────────────────────────────────
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 20,
    backgroundColor: Colors.surface,
  },
  googleIcon: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.info,
    fontFamily: 'serif',
  },
  btnGoogleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // ── Criar conta ──────────────────────────────────────────
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountText: { fontSize: 13, color: Colors.textSecondary },
  createAccountLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  // ── Folha verde no canto da página ──────────────────────────────────────────
  foilImage: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: width * 1.0,
  height: 115,

},
});