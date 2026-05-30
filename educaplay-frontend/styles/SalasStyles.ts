import { Colors } from "@/src/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // --- Header ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#3a7d44",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 22,
    color: Colors.textOnPrimary,
    fontWeight: "700",
    lineHeight: 26,
  },

  // --- Scroll ---
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // --- Contador ---
  counter: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 16,
  },

  // --- Card de sala ---
  salaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  salaIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#e8f5ea",
    alignItems: "center",
    justifyContent: "center",
  },
  salaIcon: {
    fontSize: 22,
  },
  salaInfo: {
    flex: 1,
  },
  salaNome: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  salaCapacidade: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  salaActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: Colors.primaryPale,
  },
  deleteBtn: {
    backgroundColor: Colors.errorBg,
  },
  actionBtnText: {
    fontSize: 15,
  },

  // --- Empty state ---
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalInputFocused: {
    borderColor: Colors.accent,
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    elevation: 2,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnPrimary,
  },
});
