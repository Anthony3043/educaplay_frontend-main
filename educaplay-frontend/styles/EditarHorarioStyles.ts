import { Colors } from "@/src/constants/colors";
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
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: "800",
    color: "#fff", textAlign: "center",
  },
  saveBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: 18, color: "#fff" },

  // ── Scroll ───────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 16,
  },

  // ── Horário info ─────────────────────────────────────────────
  horarioBanner: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderLeftWidth: 4, borderLeftColor: "#3a7d44",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  horarioBannerTime: { fontSize: 20, fontWeight: "800", color: "#111827" },
  horarioBannerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  // ── Seção ────────────────────────────────────────────────────
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2,
  },

  // ── Toggle Aula / Intervalo ──────────────────────────────────
  toggleRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 16, padding: 4, gap: 4,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#3a7d44", elevation: 3,
    shadowColor: "#3a7d44", shadowOpacity: 0.28, shadowRadius: 6,
  },
  toggleBtnText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  toggleBtnTextActive: { color: "#fff", fontWeight: "700" },

  // ── Input matéria ────────────────────────────────────────────
  inputCard: {
    backgroundColor: "#fff", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: "#111827", fontWeight: "500",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },

  // ── Professor cards ──────────────────────────────────────────
  professorCard: {
    backgroundColor: "#fff", borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 2, borderColor: "transparent",
    marginBottom: 8,
  },
  professorCardSelected: {
    borderColor: "#3a7d44", backgroundColor: "#F0FDF4",
    shadowColor: "#3a7d44", shadowOpacity: 0.15, elevation: 4,
  },
  professorAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
  },
  professorAvatarText: { fontSize: 18, fontWeight: "700" },
  professorInfo: { flex: 1 },
  professorNome: { fontSize: 14, fontWeight: "700", color: "#111827" },
  professorMaterias: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  professorCheckmark: { fontSize: 18, color: "#3a7d44", fontWeight: "800" },

  // ── Empty states ─────────────────────────────────────────────
  emptyProfessores: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyProfessoresText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

  // ── Intervalo banner ─────────────────────────────────────────
  intervaloBanner: {
    backgroundColor: "#FFFBEB", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderColor: "#FDE68A",
  },
  intervaloBannerText: {
    fontSize: 14, color: "#92400e", fontWeight: "500", flex: 1,
  },
});
