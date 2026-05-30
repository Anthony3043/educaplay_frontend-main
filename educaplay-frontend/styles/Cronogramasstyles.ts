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
    width: 42,
    height: 42,
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
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  // Cards de Turno
  turnoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  turnoCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  turnoCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  turnoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  turnoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  turnoTime: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
  },
  // Lista de Horários
  horarioItem: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  timeColumn: {
    marginRight: 16,
    alignItems: "center",
  },
  startTime: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  endTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  infoColumn: {
    flex: 1,
  },
  materiaName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  professorName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 10,
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
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
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
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  intervalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    gap: 8,
  },
  intervalIcon: {
    fontSize: 14,
  },
  intervalText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
});
