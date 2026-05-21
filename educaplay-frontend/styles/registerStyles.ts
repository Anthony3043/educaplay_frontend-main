import { Dimensions, StyleSheet } from "react-native";
import { Colors } from "@/src/constants/colors";

const { width, height } = Dimensions.get("window");

export const registerStyles = StyleSheet.create({

  // ── Bloco superior (foil + header + logo + mascote) ──────
  topBlock: {
    backgroundColor: Colors.primarySurface,
    position: "relative",
    overflow: "hidden",
  },

  // ── Foil decorativo ──────────────────────────────────────
  foil: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.65,
    height: 80,
    zIndex: 0,
  },

  // ── Header (← e Já tem uma conta?) ──────────────────────
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },

  // ── Logo (esquerda) + Mascote (direita) ──────────────────
  logoMascoteRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 4,
    zIndex: 2,
  },
  logoSide: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 12,
  },
  mascoteSide: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  mascoteImage: {
    width: width * 0.42,
    height: width * 0.42,
  },

  // ── Inputs em linha (2 colunas) ──────────────────────────
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
  },

  // ── Input com label interno ───────────────────────────────
  inlineInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    marginBottom: 14,
    gap: 8,
  },
  // borda verde quando papel está selecionado
  inlineInputActive: {
    borderColor: Colors.primary,
    borderWidth: 1.6,
  },
  inlineIconLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  inlineIcon: {
    fontSize: 16,
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  inlineTextInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // ── Modal overlay ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  // ── Modal dropdown ────────────────────────────────────────
  modalDropdown: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalDropdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dropdownTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  dropdownCheck: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
  },
});