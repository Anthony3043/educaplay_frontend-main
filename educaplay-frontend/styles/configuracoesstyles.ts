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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  configItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  configIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  configIconText: {
    fontSize: 20,
  },
  configContent: {
    flex: 1,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  configSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  configArrow: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  btnLogout: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnLogoutText: {
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
