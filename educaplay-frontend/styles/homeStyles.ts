import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerLogoText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerLogoAccent: {
    color: '#3a7d44',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Scroll ───────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 32,
    gap: 12,
  },

  // ── Banner ───────────────────────────────────────────────
  banner: {
    backgroundColor: '#3a7d44',
    paddingLeft: 22,
    paddingTop: 24,
    paddingRight: 150,
    paddingBottom: 28,
    overflow: 'hidden',
    minHeight: 168,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerDeco1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: 50,
  },
  bannerDeco2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -20,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
    gap: 5,
    marginBottom: 12,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.3,
  },
  bannerTextArea: {
    gap: 4,
  },
  bannerGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
    marginTop: 2,
  },
  bannerMascote: {
    position: 'absolute',
    bottom: -40,
    right: -22,
    width: 210,
    height: 210,
  },

  // ── Divisor (mantido por compatibilidade) ────────────────
  divider: {
    height: 0,
  },

  // ── Seção ─────────────────────────────────────────────────
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 14,
    letterSpacing: 0.1,
  },

  // ── Cards do menu ─────────────────────────────────────────
  menuGrid: {
    flexDirection: 'row',
    gap: 14,
    paddingRight: 20,
  },
  menuBentoGrid: {
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  menuBentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  menuCardFeatured: {
    width: '100%' as any,
    height: 108,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 9,
  },
  menuFeaturedIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  menuFeaturedBody: {
    flex: 1,
    gap: 5,
  },
  menuFeaturedTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  menuFeaturedSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },
  menuFeaturedArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    flex: 1,
    height: 158,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    padding: 14,
    justifyContent: 'space-between',
  },
  // Ícone fantasma: o próprio ícone da funcionalidade em tamanho grande, baixa opacidade
  menuCardGhostIcon: {
    position: 'absolute',
    top: -18,
    right: -18,
  },
  // Brilho sutil na base simulando reflexo
  menuCardGlint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Badge do chevron: quadrado arredondado em vez de círculo
  menuCardArrowBadge: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Container do ícone: quadrado arredondado (não círculo)
  menuCardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  menuCardBody: {
    gap: 5,
    paddingBottom: 4,
  },
  menuCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.15,
  },
  menuCardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 16,
  },
  // kept for compat
  menuCardTop: {},
  menuCardIcon: {},
  menuCardArrow: {},
  menuCardCircle1: {},
  menuCardCircle2: {},

  // ── Botão principal (Criar / Ver cronograma) ──────────────
  btnCriar: {
    backgroundColor: '#3a7d44',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3a7d44',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  btnCriarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Dica do Zé Bloquinho ──────────────────────────────────
  dicaCard: {
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  dicaMascoteWrap: {
    width: 82,
    height: 82,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dicaMascote: {
    width: 72,
    height: 72,
  },
  dicaTextArea: {
    flex: 1,
    gap: 6,
  },
  dicaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dicaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dicaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  dicaCounter: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d97706',
  },
  dicaText: {
    fontSize: 12.5,
    color: '#78350f',
    lineHeight: 18,
    fontWeight: '500',
  },
  dicaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dicaFooterText: {
    fontSize: 10,
    color: '#bbb',
  },

  // ── Bottom Tab Bar ────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#aaa',
  },
  tabLabelActive: {
    color: '#3a7d44',
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
    backgroundColor: '#fff',
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#3a7d44',
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 4,
  },
  drawerAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    gap: 14,
  },
  drawerItemIcon: {
    width: 28,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    gap: 14,
    marginTop: 4,
  },
});
