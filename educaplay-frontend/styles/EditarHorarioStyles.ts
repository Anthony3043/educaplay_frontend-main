import { Colors } from "@/src/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 18,
    color: "#fff",
  },

  // --- Scroll ---
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },

  // --- Horário info (topo) ---
  horarioBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  horarioBannerTime: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  horarioBannerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // --- Seção ---
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  // --- Toggle Aula / Intervalo ---
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  toggleBtnTextActive: {
    color: "#fff",
  },

  // --- Matéria input ---
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  // --- Professor list ---
  professorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  professorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  professorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  professorAvatarText: {
    fontSize: 20,
  },
  professorInfo: {
    flex: 1,
  },
  professorNome: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  professorMaterias: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  professorCheckmark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "700",
  },

  // --- Empty state professores ---
  emptyProfessores: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyProfessoresText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // --- Intervalo info ---
  intervaloBanner: {
    backgroundColor: "#FFF8E7",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FFE0A0",
  },
  intervaloBannerText: {
    fontSize: 14,
    color: "#92670A",
    fontWeight: "500",
    flex: 1,
  },
});
