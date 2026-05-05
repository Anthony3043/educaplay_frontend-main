import { Colors } from "@/src/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  backArrow: { fontSize: 20, color: Colors.primary },

  // Ícone
  iconArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    marginTop: 20,
    position: "relative",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  iconEmoji: { fontSize: 44 },
  sparkle: {
    position: "absolute",
    fontSize: 16,
    color: Colors.primary,
    opacity: 0.55,
  },

  // Card
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },

  // Input
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  clearIcon: { fontSize: 14, color: Colors.textMuted, paddingLeft: 8 },
  erroText: {
    fontSize: 12,
    color: Colors.error,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Botão
  btnEnviar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: Colors.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnEnviarText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnPrimary,
    marginRight: 8,
  },
  btnArrow: { fontSize: 18, color: Colors.textOnPrimary },

  voltarRow: { alignItems: "center", marginTop: 20 },
  voltarText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
});
