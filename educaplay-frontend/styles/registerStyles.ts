import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export const registerStyles = StyleSheet.create({

  // ── Bloco superior (foil + header + logo + mascote) ──────
  topBlock: {
    backgroundColor: Colors.primarySurface,
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Foil decorativo ──────────────────────────────────────
  foil: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.65,
    height: 80,
    zIndex: 0,
  },

  // ── Header (← e Já tem uma conta?) ──────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 2,
  },
  backBtn: {
    padding: 6,
  },
  backArrow: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Logo (esquerda) + Mascote (direita) ──────────────────
  logoMascoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    zIndex: 2,
  },
  logoSide: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  mascoteSide: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  mascoteImage: {
    width: width * 0.42,
    height: width * 0.42,
  },

  // ── Inputs em linha (2 colunas) ──────────────────────────
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  halfField: {
    flex: 1,
  },

  // ── Input com label interno (estilo da print) ─────────────
  inlineInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    marginBottom: 14,
    gap: 8,
  },
  inlineIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  inlineIcon: {
    fontSize: 16,
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  inlineTextInput: {
    fontSize: 13,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
  },

  // ── Banner de segurança ───────────────────────────────────
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successBg,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.primaryPale,
  },
  securityIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Dropdown de papel ─────────────────────────────────────
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 99,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});