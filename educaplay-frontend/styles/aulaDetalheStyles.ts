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
    flex: 1, fontSize: 17, fontWeight: "800",
    color: "#fff", textAlign: "center",
  },
  headerRightBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },

  // ── Scroll ───────────────────────────────────────────────────
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48, gap: 16 },

  // ── Banner matéria ───────────────────────────────────────────
  subjectBanner: {
    backgroundColor: "#fff", borderRadius: 22, overflow: "hidden",
    flexDirection: "row", alignItems: "stretch",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  subjectEmoji: { fontSize: 36 },
  subjectTitle: {
    fontSize: 22, fontWeight: "800", color: "#111827",
    flexShrink: 1, lineHeight: 28,
  },

  // ── Grid cards ───────────────────────────────────────────────
  infoGrid: { flexDirection: "row", gap: 12 },
  infoCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 20,
    alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  infoCardIcon: { fontSize: 24 },
  infoCardLabel: {
    fontSize: 10, color: "#9CA3AF", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  infoCardValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  infoCardSub: { fontSize: 11, color: "#9CA3AF" },

  // ── Professor / Sala ─────────────────────────────────────────
  teacherCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  teacherAvatar: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  teacherInfo: { flex: 1, gap: 4 },
  teacherLabel: {
    fontSize: 10, color: "#9CA3AF", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  teacherName: { fontSize: 16, fontWeight: "700", color: "#111827" },

  // ── Duração ──────────────────────────────────────────────────
  durationRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  durationIcon: { fontSize: 18 },
  durationText: { fontSize: 15, color: "#374151", fontWeight: "600" },

  // ── Deletar ──────────────────────────────────────────────────
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FEF2F2", borderRadius: 18, paddingVertical: 17,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});
