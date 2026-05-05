import { Colors } from "@/src/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  requirementsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
  },
  requirementText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  requirementMet: {
    color: Colors.success,
  },
  buttonContainer: {
    marginTop: 16,
  },
});
