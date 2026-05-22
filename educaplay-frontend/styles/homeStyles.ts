/**
 * app/styles/homeStyles.ts - Estilos da tela Home do PlanejaEdu
 */

import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoImage: {
    width: 32,
    height: 32,
  },
  headerLogoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerLogoAccent: {
    color: Colors.primary,
  },
  menuIcon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  notifWrapper: {
    position: 'relative',
  },
  notifIcon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Scroll ───────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Banner de boas-vindas ─────────────────────────────────
  banner: {
    backgroundColor: Colors.surface,
    paddingLeft: 20,
    paddingTop: 18,
    paddingRight: 148,
    paddingBottom: 0,
    overflow: 'hidden',
    minHeight: 148,
  },
  bannerTextArea: {
    paddingBottom: 18,
  },
  bannerGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  bannerEmoji: {
    fontSize: 20,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bannerMascote: {
    position: 'absolute',
    bottom: -45,
    right: -30,
    width: 218,
    height: 218,
  },

  // ── Divisor ───────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },

  // ── Seção Menu Principal ──────────────────────────────────
  section: {
    backgroundColor: Colors.surface,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // ── Cards do menu ─────────────────────────────────────────
  menuGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  menuCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardIconText: {
    fontSize: 26,
  },
  menuCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  menuCardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: -4,
  },

  // ── Botão Criar Cronograma ────────────────────────────────
  btnCriar: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnCriarIcon: {
    fontSize: 22,
    color: Colors.textOnPrimary,
    fontWeight: '300',
  },
  btnCriarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnPrimary,
    letterSpacing: 0.2,
  },

  // ── Card Dica do Zé Bloquinho ─────────────────────────────
  dicaCard: {
    backgroundColor: Colors.primaryPale,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primaryPale,
  },
  dicaMascote: {
    width: 110,
    height: 110,
  },
  dicaTextArea: {
    flex: 1,
    gap: 3,
  },
  dicaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  dicaTitleEmoji: {
    fontSize: 13,
  },
  dicaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // ── Bottom Tab Bar ────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  tabIconActive: {
    // tint aplicado via prop tintColor na Image
  },

  // ── Drawer lateral ───────────────────────────────────────
  drawerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: width * 0.72,
    backgroundColor: Colors.surface,
    zIndex: 11,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 4,
  },
  drawerLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
  },
  drawerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  drawerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
  },
  drawerItemIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
    marginTop: 4,
  },
});
