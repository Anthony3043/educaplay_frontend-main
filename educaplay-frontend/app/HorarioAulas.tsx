import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  computeSchedule,
  intervalStorageKey,
  DEFAULT_INT1_GAP,
  DEFAULT_INT2_GAP,
  SLOT_H,
  INT_H,
} from "@/src/constants/slots";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  UIManager,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { styles as s } from "@/styles/EditarHorarioStyles";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SNAP = Math.round((SLOT_H + 8) / 2);

const TURNO_LABELS: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
};
const TURNO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  matutino: "sunny-outline",
  vespertino: "partly-sunny-outline",
};

export default function HorarioAulasScreen() {
  const router = useRouter();
  const { turno } = useLocalSearchParams<{ turno: string }>();

  const [int1Gap, setInt1Gap] = useState(DEFAULT_INT1_GAP);
  const [int2Gap, setInt2Gap] = useState(DEFAULT_INT2_GAP);
  const [dragging, setDragging] = useState<"i1" | "i2" | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Refs for mutable drag state — safe to access inside PanResponder closures
  const i1Ref = useRef(DEFAULT_INT1_GAP);
  const i2Ref = useRef(DEFAULT_INT2_GAP);
  const base1 = useRef(0);
  const base2 = useRef(0);
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  const storageKey = intervalStorageKey(turno);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!raw) return;
      try {
        const { g1, g2 } = JSON.parse(raw) as { g1: number; g2: number };
        if (Number.isInteger(g1) && Number.isInteger(g2) && g1 >= 0 && g2 <= 7 && g1 < g2) {
          i1Ref.current = g1;
          i2Ref.current = g2;
          setInt1Gap(g1);
          setInt2Gap(g2);
        }
      } catch {}
    });
  }, [storageKey]);

  // Called on release — storageKey is stable, refs are always current
  const save = () =>
    AsyncStorage.setItem(storageKey, JSON.stringify({ g1: i1Ref.current, g2: i2Ref.current }));

  const panResponder1 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        base1.current = gs.dy;
        setDragging("i1");
        setScrollEnabled(false);
      },
      onPanResponderMove: (_, gs) => {
        const rel = gs.dy - base1.current;
        anim1.setValue(rel);
        // Move down: i1 must stay strictly below i2
        if (rel > SNAP && i1Ref.current + 1 < i2Ref.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          base1.current = gs.dy;
          anim1.setValue(0);
          i1Ref.current++;
          setInt1Gap(i1Ref.current);
        } else if (rel < -SNAP && i1Ref.current > 0) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          base1.current = gs.dy;
          anim1.setValue(0);
          i1Ref.current--;
          setInt1Gap(i1Ref.current);
        }
      },
      onPanResponderRelease: () => {
        anim1.setValue(0);
        setDragging(null);
        setScrollEnabled(true);
        save();
      },
      onPanResponderTerminate: () => {
        anim1.setValue(0);
        setDragging(null);
        setScrollEnabled(true);
      },
    })
  ).current;

  const panResponder2 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        base2.current = gs.dy;
        setDragging("i2");
        setScrollEnabled(false);
      },
      onPanResponderMove: (_, gs) => {
        const rel = gs.dy - base2.current;
        anim2.setValue(rel);
        // Move down: i2 can go up to gap 7 (after last slot)
        if (rel > SNAP && i2Ref.current < 7) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          base2.current = gs.dy;
          anim2.setValue(0);
          i2Ref.current++;
          setInt2Gap(i2Ref.current);
        } else if (rel < -SNAP && i2Ref.current - 1 > i1Ref.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          base2.current = gs.dy;
          anim2.setValue(0);
          i2Ref.current--;
          setInt2Gap(i2Ref.current);
        }
      },
      onPanResponderRelease: () => {
        anim2.setValue(0);
        setDragging(null);
        setScrollEnabled(true);
        save();
      },
      onPanResponderTerminate: () => {
        anim2.setValue(0);
        setDragging(null);
        setScrollEnabled(true);
      },
    })
  ).current;

  const schedule = computeSchedule(turno, int1Gap, int2Gap);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Horário das Aulas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        <View style={ha.banner}>
          <Ionicons name={TURNO_ICONS[turno] ?? "calendar-outline"} size={26} color="#3a7d44" />
          <View style={{ flex: 1 }}>
            <Text style={ha.bannerTitle}>{TURNO_LABELS[turno] ?? turno}</Text>
            <Text style={ha.bannerSub}>7 aulas · 2 intervalos · 45 min por aula</Text>
          </View>
        </View>

        <View style={ha.infoBanner}>
          <Ionicons name="hand-left-outline" size={16} color="#1d4ed8" />
          <Text style={ha.infoText}>
            Arraste os intervalos (em laranja) para mudar de posição. Os horários das aulas se ajustam automaticamente.
          </Text>
        </View>

        <View style={{ marginTop: 12, gap: 8 }}>
          {schedule.map(item => {
            if (item.type === "intervalo") {
              const isI1 = item.intervalId === "i1";
              const anim = isI1 ? anim1 : anim2;
              const panHandlers = isI1 ? panResponder1.panHandlers : panResponder2.panHandlers;
              const isDragging = dragging === item.intervalId;

              return (
                <Animated.View
                  key={item.key}
                  style={[
                    ha.intervaloCard,
                    isDragging && ha.intervaloCardDragging,
                    { transform: [{ translateY: anim }], zIndex: isDragging ? 10 : 1 },
                  ]}
                  {...panHandlers}
                >
                  <View style={ha.intervaloTimeBox}>
                    <Text style={ha.intervaloTime}>{item.start}</Text>
                    <Text style={ha.intervaloTimeEnd}>{item.end}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ha.intervaloLabel}>{item.label}</Text>
                    <Text style={ha.intervaloDur}>15 min · arraste para mover</Text>
                  </View>
                  <Ionicons name="reorder-three-outline" size={24} color="#b45309" />
                </Animated.View>
              );
            }

            return (
              <View key={item.key} style={ha.slotCard}>
                <View style={ha.slotNum}>
                  <Text style={ha.slotNumText}>{item.slotIndex}</Text>
                </View>
                <View style={{ alignItems: "center", width: 52, gap: 2 }}>
                  <Text style={ha.slotTime}>{item.start}</Text>
                  <Text style={ha.slotTimeEnd}>{item.end}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ha.slotLabel}>Aula {item.slotIndex}</Text>
                  <Text style={ha.slotDur}>45 min</Text>
                </View>
                <Ionicons name="lock-closed-outline" size={14} color="#ccc" />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ha = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#E8F5EA", borderRadius: 14, padding: 14, marginBottom: 12,
  },
  bannerTitle: { fontSize: 15, fontWeight: "800", color: "#2d6a4f" },
  bannerSub: { fontSize: 12, color: "#52b788", marginTop: 2 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#EFF6FF", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  infoText: { fontSize: 12, color: "#1d4ed8", flex: 1, lineHeight: 18 },

  slotCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: "#E8F5EA", gap: 12,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, minHeight: SLOT_H,
  },
  slotNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#E8F5EA", alignItems: "center", justifyContent: "center",
  },
  slotNumText: { fontSize: 11, fontWeight: "800", color: "#3a7d44" },
  slotTime: { fontSize: 14, fontWeight: "800", color: "#1a1a2e" },
  slotTimeEnd: { fontSize: 11, color: "#888" },
  slotLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  slotDur: { fontSize: 11, color: "#aaa", marginTop: 2 },

  intervaloCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF8F0", borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: "#FED7AA", gap: 12,
    elevation: 3, shadowColor: "#92400e", shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, minHeight: INT_H,
  },
  intervaloCardDragging: {
    elevation: 8, shadowOpacity: 0.28, borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  intervaloTimeBox: { alignItems: "center", width: 52, gap: 2 },
  intervaloTime: { fontSize: 14, fontWeight: "800", color: "#92400e" },
  intervaloTimeEnd: { fontSize: 11, color: "#b45309" },
  intervaloLabel: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  intervaloDur: { fontSize: 11, color: "#d97706", marginTop: 2 },
});
