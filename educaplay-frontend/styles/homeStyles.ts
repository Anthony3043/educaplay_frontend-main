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
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
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
    paddingTop: 22,
    paddingRight: 148,
    paddingBottom: 0,
    overflow: 'hidden',
    minHeight: 152,
  },
  bannerTextArea: {
    paddingBottom: 22,
    gap: 6,
  },
  bannerGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  bannerMascote: {
    position: 'absolute',
    bottom: -45,
    right: -30,
    width: 218,
    height: 218,
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
    gap: 12,
    paddingRight: 20,
  },
  menuCard: {
    width: 148,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuCardTop: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  menuCardBody: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 3,
  },
  menuCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  menuCardSubtitle: {
    fontSize: 11,
    color: '#888',
    lineHeight: 15,
  },

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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#d1fae5',
    shadowColor: '#3a7d44',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dicaMascote: {
    width: 100,
    height: 100,
  },
  dicaTextArea: {
    flex: 1,
    gap: 4,
  },
  dicaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3a7d44',
  },
  dicaText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
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
