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
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  // Cards de Turno
  turnoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  turnoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
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
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  turnoTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
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
