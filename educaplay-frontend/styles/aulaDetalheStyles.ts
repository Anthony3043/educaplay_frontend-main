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
  headerRightBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },

  // ── Scroll ───────────────────────────────────────────────────
  content: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12,
  },

  // ── Banner de matéria ────────────────────────────────────────
  subjectBanner: {
    backgroundColor: "#fff", borderRadius: 20, borderLeftWidth: 5,
    paddingVertical: 20, paddingRight: 18, paddingLeft: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  subjectEmoji: { fontSize: 36 },
  subjectTitle: {
    fontSize: 22, fontWeight: "800", color: "#111827", flexShrink: 1, lineHeight: 28,
  },

  // ── Grid de informações ──────────────────────────────────────
  infoGrid: { flexDirection: "row", gap: 10 },
  infoCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 16,
    alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  infoCardIcon: { fontSize: 24, marginBottom: 2 },
  infoCardLabel: {
    fontSize: 10, color: "#9CA3AF", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  infoCardValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  infoCardSub: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },

  // ── Cards professor / sala ───────────────────────────────────
  teacherCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  teacherAvatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  teacherInfo: { flex: 1 },
  teacherLabel: {
    fontSize: 10, color: "#9CA3AF", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  },
  teacherName: { fontSize: 15, fontWeight: "700", color: "#111827" },

  // ── Duração ──────────────────────────────────────────────────
  durationRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  durationIcon: { fontSize: 18 },
  durationText: { fontSize: 14, color: "#374151", fontWeight: "600" },

  // ── Deletar ──────────────────────────────────────────────────
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 16, paddingVertical: 15,
    borderWidth: 1.5, borderColor: "#FECACA", marginTop: 4,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700", color: "#ef4444" },
});
