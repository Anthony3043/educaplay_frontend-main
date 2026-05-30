import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#3a7d44",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: "#fff" },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: "800",
    color: "#fff", textAlign: "center",
  },

  // ── Scroll ───────────────────────────────────────────────────
  scrollContent: { paddingTop: 20, paddingBottom: 40 },

  // ── Seção label ──────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 8,
  },

  // ── Seção card agrupado ───────────────────────────────────────
  section: {
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },

  // ── Item de config ────────────────────────────────────────────
  configItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 15, gap: 14,
  },
  configItemBorder: {
    borderBottomWidth: 1, borderBottomColor: "#F9FAFB",
  },
  configIcon: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  configContent: { flex: 1, gap: 2 },
  configTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  configSubtitle: { fontSize: 12, color: "#9CA3AF" },
  configArrow: { fontSize: 18, color: "#D1D5DB" },

  // ── Logout ────────────────────────────────────────────────────
  logoutSection: {
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: "#FEE2E2",
  },
  btnLogout: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  btnLogoutIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
  },
  btnLogoutText: { fontSize: 15, fontWeight: "700", color: "#ef4444", flex: 1 },

  // ── Tab Bar ───────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row", backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 5,
    paddingBottom: 8, paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  tabLabelActive: { color: "#3a7d44", fontWeight: "700" },
});
