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
  backArrow: {
    fontSize: 20,
    color: "#fff",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  editBtn: {
    fontSize: 18,
    marginRight: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Card de Perfil
  perfilCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fotoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  fotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  fotoOverlayText: {
    fontSize: 18,
  },
  perfilNome: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  perfilCargo: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Seções
  section: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Grupo de Informações
  infoGroup: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  input: {
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },

  // Botão Salvar
  btnSalvar: {
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnSalvarLoading: {
    opacity: 0.7,
  },
  btnSalvarText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnPrimary,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: Colors.textMuted,
  },
  tabIconActive: {
    color: Colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
