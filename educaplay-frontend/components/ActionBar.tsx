import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Colors } from "@/src/constants/colors";

interface ActionBarProps {
  onEdit?: () => void;
  onSave?: () => void;
  onExportPDF?: () => void;
  salvando?: boolean;
}

export function ActionBar({ onEdit, onSave, onExportPDF, salvando }: ActionBarProps) {
  return (
    <View style={styles.actionBar}>
      <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={onEdit} activeOpacity={0.8}>
        <Text style={styles.editIcon}>✏️</Text>
        <Text style={[styles.actionLabel, styles.editLabel]}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, styles.saveBtn, salvando && { opacity: 0.6 }]} onPress={onSave} activeOpacity={0.8} disabled={salvando}>
        <Text style={styles.saveIcon}>{salvando ? "⏳" : "✓"}</Text>
        <Text style={[styles.actionLabel, styles.saveLabel]}>{salvando ? "Salvando..." : "Salvar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, styles.exportBtn]} onPress={onExportPDF} activeOpacity={0.8}>
        <Text style={styles.exportIcon}>📄</Text>
        <Text style={[styles.actionLabel, styles.exportLabel]}>Exportar PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    flex: 1,
  },
  editBtn: {
    backgroundColor: "#EEF1FF",
    borderWidth: 1,
    borderColor: "#C7CFFF",
  },
  saveBtn: {
    backgroundColor: "#E6F9EE",
    borderWidth: 1,
    borderColor: "#A3DFB8",
  },
  exportBtn: {
    backgroundColor: "#F3EEFF",
    borderWidth: 1,
    borderColor: "#D4BAFF",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  editLabel: {
    color: "#5B6BD8",
  },
  saveLabel: {
    color: "#2D8A55",
  },
  exportLabel: {
    color: "#7B4FC8",
  },
  editIcon: {
    fontSize: 13,
  },
  saveIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D8A55",
  },
  exportIcon: {
    fontSize: 13,
  },
});
