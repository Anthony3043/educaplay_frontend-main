import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import api from "../../src/services/api";
import { useAuth } from "../../context/AuthContext";

type Sala = { id: string; nome: string; turma?: string | null; capacidade?: string | null };
type Assento = { id: string; numero: number; nome: string | null };

export default function MapaSalaScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { width } = useWindowDimensions();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregandoSalas, setCarregandoSalas] = useState(true);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [assentos, setAssentos] = useState<Assento[]>([]);
  const [assentosOriginal, setAssentosOriginal] = useState<Assento[]>([]);
  const [colunas, setColunas] = useState(5);
  const [colunasOriginal, setColunasOriginal] = useState(5);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const podeEditar = usuario?.papel === "Supervisao" || usuario?.podeEditarMapaSala === true;

  // Modal de edição de assento
  const [modalAssento, setModalAssento] = useState(false);
  const [assentoEditando, setAssentoEditando] = useState<Assento | null>(null);
  const [nomeInput, setNomeInput] = useState("");

  useFocusEffect(
    useCallback(() => {
      api.get("/salas")
        .then((res) => setSalas(res.data))
        .catch(() => setFeedbackMapa({ visivel: true, tipo: "erro", mensagem: "Não foi possível carregar as salas." }))
        .finally(() => setCarregandoSalas(false));
    }, [])
  );

  const carregarMapa = async (sala: Sala) => {
    setSalaSelecionada(sala);
    setCarregandoMapa(true);
    try {
      const res = await api.get(`/salas/${sala.id}/mapa`);
      const lista = res.data.assentos as Assento[];
      const cols = res.data.colunas ?? 5;
      setAssentos(lista);
      setAssentosOriginal(lista);
      setColunas(cols);
      setColunasOriginal(cols);
    } catch {
      setFeedbackMapa({ visivel: true, tipo: "erro", mensagem: "Não foi possível carregar o mapa da sala." });
    } finally {
      setCarregandoMapa(false);
    }
  };

  const voltarParaLista = () => {
    setSalaSelecionada(null);
    setAssentos([]);
    setAssentosOriginal([]);
    setColunas(5);
    setColunasOriginal(5);
  };

  const abrirEdicaoAssento = (assento: Assento) => {
    if (!podeEditar) return;
    setAssentoEditando(assento);
    setNomeInput(assento.nome ?? "");
    setModalAssento(true);
  };

  const salvarNomeAssento = (nomeOverride?: string | null) => {
    if (!assentoEditando) return;
    const nome = nomeOverride !== undefined ? nomeOverride : (nomeInput.trim() || null);
    setAssentos((prev) =>
      prev.map((a) => a.id === assentoEditando.id ? { ...a, nome } : a)
    );
    setModalAssento(false);
    setAssentoEditando(null);
    setNomeInput("");
  };

  const [feedbackMapa, setFeedbackMapa] = useState<{ visivel: boolean; tipo: "sucesso" | "erro"; mensagem: string }>({ visivel: false, tipo: "sucesso", mensagem: "" });

  const isDirty = React.useMemo(() => {
    if (colunas !== colunasOriginal) return true;
    if (assentos.length !== assentosOriginal.length) return true;
    return assentos.some((a, i) => a.nome !== assentosOriginal[i]?.nome);
  }, [assentos, assentosOriginal, colunas, colunasOriginal]);

  const salvarMapa = async () => {
    if (!salaSelecionada || !isDirty) return;
    setSalvando(true);
    try {
      await api.put(`/salas/${salaSelecionada.id}/mapa`, { assentos, colunas });
      setAssentosOriginal(assentos);
      setColunasOriginal(colunas);
      setFeedbackMapa({ visivel: true, tipo: "sucesso", mensagem: "Mapa de sala atualizado com sucesso!" });
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      setFeedbackMapa({ visivel: true, tipo: "erro", mensagem: msg || "Não foi possível salvar o mapa." });
    } finally {
      setSalvando(false);
    }
  };

  const gerarPDF = async () => {
    if (!salaSelecionada) return;
    setExportando(true);
    try {
      const tituloSala = salaSelecionada.turma
        ? `${salaSelecionada.nome} — ${salaSelecionada.turma}`
        : salaSelecionada.nome;
      const dataStr = new Date().toLocaleDateString("pt-BR");
      const instituicao = (usuario as any)?.instituicao || "";
      const ocupadas = assentos.filter(a => a.nome).length;
      const total = assentos.length;
      const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
      const seatW = Math.max(46, Math.floor(480 / colunas) - 8);

      const seatRows = linhas.map(linha => {
        const cells = linha.map(a =>
          a.nome
            ? `<div class="seat occ"><span class="num">${a.numero}</span><span class="name">${a.nome}</span></div>`
            : `<div class="seat vago"><span class="num">${a.numero}</span><span class="dash">—</span></div>`
        ).join("");
        const empties = Array.from({ length: colunas - linha.length })
          .map(() => `<div class="seat invisible"></div>`).join("");
        return `<div class="row">${cells}${empties}</div>`;
      }).join("");

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;padding:24px;background:#fff;color:#1a1a2e}
.header{border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px}
.inst{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
h1{font-size:20px;font-weight:800;color:#0f172a}
.sub{font-size:11px;color:#64748b;margin-top:3px}
.stats{display:flex;gap:12px;margin-bottom:16px;align-items:center}
.stat{text-align:center;background:#f8fafc;border-radius:8px;padding:8px 14px;border:1px solid #e2e8f0}
.stat-num{font-size:20px;font-weight:800;color:#0f172a}.stat-num.occ{color:#3a7d44}
.stat-lbl{font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.bar-wrap{flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
.bar-fill{height:8px;background:#3a7d44;border-radius:4px;width:${pct}%}
.board{background:#1a1a2e;color:#fff;text-align:center;padding:8px;border-radius:8px;font-size:10px;font-weight:800;letter-spacing:3px;margin-bottom:14px;width:65%;margin-left:auto;margin-right:auto}
.grid{display:flex;flex-direction:column;gap:6px}
.row{display:flex;gap:6px;justify-content:center}
.seat{border-radius:8px;padding:6px 4px;width:${seatW}px;text-align:center;border:1.5px solid #e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:54px}
.occ{background:#e8f5ea;border-color:#86efac}.vago{background:#f8fafc}.invisible{border:none;background:transparent}
.num{font-size:9px;font-weight:700;color:#aaa;margin-bottom:3px}.occ .num{color:#2d6a4f}
.name{font-size:9.5px;font-weight:700;color:#1a1a2e;line-height:1.2}.dash{font-size:13px;color:#ccc}
.footer{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  ${instituicao ? `<div class="inst">${instituicao}</div>` : ""}
  <h1>${tituloSala}</h1>
  <div class="sub">Mapa de Carteiras &nbsp;·&nbsp; ${dataStr}</div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-num occ">${ocupadas}</div><div class="stat-lbl">Ocupadas</div></div>
  <div class="stat"><div class="stat-num">${total - ocupadas}</div><div class="stat-lbl">Vagas</div></div>
  <div class="stat"><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></div>
  <div class="bar-wrap"><div class="bar-fill"></div></div>
</div>
<div class="board">QUADRO</div>
<div class="grid">${seatRows}</div>
<div class="footer">EducaPlay · Mapa gerado em ${dataStr}</div>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const dataNome = dataStr.replace(/\//g, "-");
      const nomeArquivo = `mapa_sala_${dataNome}.pdf`;
      const destUri = (FileSystem.cacheDirectory ?? "") + nomeArquivo;
      await FileSystem.copyAsync({ from: uri, to: destUri });

      await Sharing.shareAsync(destUri, { mimeType: "application/pdf", dialogTitle: "Exportar Mapa de Sala" });
    } catch {
      setFeedbackMapa({ visivel: true, tipo: "erro", mensagem: "Não foi possível gerar o PDF." });
    } finally {
      setExportando(false);
    }
  };

  const cardWidth = React.useMemo(() => {
    const padding = 32;
    const gaps = (colunas - 1) * 8;
    return Math.floor((width - padding - gaps) / colunas);
  }, [width, colunas]);

  const linhas = React.useMemo(() => {
    const rows: Assento[][] = [];
    for (let i = 0; i < assentos.length; i += colunas) {
      rows.push(assentos.slice(i, i + colunas));
    }
    return rows;
  }, [assentos, colunas]);

  // --- Tela de lista de salas ---
  if (!salaSelecionada) {
    return (
      <SafeAreaView style={st.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={st.headerTitle}>Mapa de Sala</Text>
          <View style={st.headerBadge}>
            <Ionicons name="grid-outline" size={20} color="rgba(255,255,255,0.85)" />
          </View>
        </View>

        {carregandoSalas ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

            {/* Header com contagem */}
            <View style={st.salaListHeader}>
              <View style={st.salaListHeaderIcon}>
                <Ionicons name="grid-outline" size={16} color="#3a7d44" />
              </View>
              <Text style={st.salaListHeaderText}>
                {salas.length === 0 ? "Nenhuma sala" : `${salas.length} sala${salas.length > 1 ? "s" : ""} disponível${salas.length > 1 ? "is" : ""}`}
              </Text>
            </View>

            {salas.length === 0 ? (
              <View style={st.empty}>
                <View style={st.emptyIconWrap}>
                  <Ionicons name="grid-outline" size={36} color="#aaa" />
                </View>
                <Text style={st.emptyTitle}>Nenhuma sala cadastrada</Text>
                <Text style={st.emptySubtitle}>As salas aparecerão aqui quando forem criadas</Text>
              </View>
            ) : (
              salas.map((sala, idx) => {
                const ACCENT_COLORS = ["#3a7d44", "#4361ee", "#f4831f", "#8b5cf6", "#ef4444", "#06b6d4"];
                const cor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity key={sala.id} style={st.salaCard} onPress={() => carregarMapa(sala)} activeOpacity={0.75}>
                    <Ionicons name="grid-outline" size={72} color={cor + "0D"} style={{ position: "absolute", top: -10, right: -10 }} />
                    <View style={[st.salaAccent, { backgroundColor: cor }]} />
                    <View style={[st.salaIcon, { backgroundColor: cor + "15" }]}>
                      <Ionicons name="grid-outline" size={22} color={cor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.salaNome}>{sala.nome}</Text>
                      {sala.turma ? <Text style={st.salaTurma}>{sala.turma}</Text> : null}
                      {sala.capacidade ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                          <Ionicons name="people-outline" size={12} color="#aaa" />
                          <Text style={st.salaCapacidade}>{sala.capacidade} alunos</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[st.salaArrow, { backgroundColor: cor }]}>
                      <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // --- Tela do mapa ---
  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={voltarParaLista} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={st.headerTitle} numberOfLines={1}>{salaSelecionada.nome}</Text>
          {salaSelecionada.turma ? <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{salaSelecionada.turma}</Text> : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity style={st.pdfBtn} onPress={gerarPDF} disabled={exportando} activeOpacity={0.8}>
            {exportando
              ? <ActivityIndicator size={16} color="#fff" />
              : <Ionicons name="document-text-outline" size={20} color="#fff" />}
          </TouchableOpacity>
          {podeEditar ? (
            <TouchableOpacity style={[st.salvarBtn, !isDirty && st.salvarBtnInativo]} onPress={salvarMapa} disabled={salvando || !isDirty} activeOpacity={0.8}>
              {salvando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.salvarBtnText}>Salvar</Text>}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {carregandoMapa ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.mapaScroll} showsVerticalScrollIndicator={false}>

          {/* Card de estatísticas da sala */}
          <View style={st.mapaStatsCard}>
            <View style={st.mapaStatItem}>
              <Text style={[st.mapaStatNum, { color: "#3a7d44" }]}>{assentos.filter(a => a.nome).length}</Text>
              <Text style={st.mapaStatLabel}>ocupadas</Text>
            </View>
            <View style={st.mapaStatDivider} />
            <View style={st.mapaStatItem}>
              <Text style={[st.mapaStatNum, { color: "#aaa" }]}>{assentos.filter(a => !a.nome).length}</Text>
              <Text style={st.mapaStatLabel}>vagas</Text>
            </View>
            <View style={st.mapaStatDivider} />
            <View style={st.mapaStatItem}>
              <Text style={[st.mapaStatNum, { color: "#1a1a2e" }]}>{assentos.length}</Text>
              <Text style={st.mapaStatLabel}>total</Text>
            </View>
            <View style={st.mapaProgressWrap}>
              <View style={[st.mapaProgressFill, {
                width: `${assentos.length > 0 ? Math.round((assentos.filter(a => a.nome).length / assentos.length) * 100) : 0}%` as any
              }]} />
            </View>
          </View>

          {/* Legenda */}
          <View style={st.legendaRow}>
            <View style={st.legendaDot} />
            <Text style={st.legendaText}>Com aluno</Text>
            <View style={[st.legendaDot, { backgroundColor: "#f0f0f0", borderColor: "#ddd" }]} />
            <Text style={st.legendaText}>Vaga</Text>
          </View>

          {podeEditar && (
            <View style={st.dicaEditar}>
              <Ionicons name="information-circle-outline" size={14} color="#3a7d44" />
              <Text style={st.dicaEditarText}>Toque em uma carteira para atribuir ou remover um aluno</Text>
            </View>
          )}

          {podeEditar && (
            <View style={st.colunasRow}>
              <Text style={st.colunasLabel}>Colunas por fileira:</Text>
              <TouchableOpacity
                style={[st.colunasBtn, colunas <= 1 && { opacity: 0.3 }]}
                onPress={() => setColunas((c) => Math.max(1, c - 1))}
                disabled={colunas <= 1}
              >
                <Ionicons name="remove" size={16} color="#3a7d44" />
              </TouchableOpacity>
              <Text style={st.colunasValor}>{colunas}</Text>
              <TouchableOpacity
                style={[st.colunasBtn, colunas >= 10 && { opacity: 0.3 }]}
                onPress={() => setColunas((c) => Math.min(10, c + 1))}
                disabled={colunas >= 10}
              >
                <Ionicons name="add" size={16} color="#3a7d44" />
              </TouchableOpacity>
            </View>
          )}

          {/* Quadro negro */}
          <View style={st.quadroNegro}>
            <View style={st.quadroNegroGlint} />
            <Text style={st.quadroNegroText}>QUADRO</Text>
          </View>

          {/* Grade de carteiras */}
          <View style={st.mapaGrid}>
            {linhas.map((linha, li) => (
              <View key={li} style={st.linhaRow}>
                {linha.map((assento) => (
                  <TouchableOpacity
                    key={assento.id}
                    style={[
                      st.assento,
                      { width: cardWidth, minHeight: cardWidth },
                      assento.nome ? st.assentoOcupado : st.assentoVago,
                    ]}
                    onPress={() => abrirEdicaoAssento(assento)}
                    activeOpacity={podeEditar ? 0.7 : 1}
                  >
                    <Text style={[st.assentoNumero, assento.nome && st.assentoNumeroOcupado]}>
                      {assento.numero}
                    </Text>
                    <Text
                      style={[st.assentoNome, assento.nome ? st.assentoNomeOcupado : st.assentoNomeVago]}
                      numberOfLines={3}
                      adjustsFontSizeToFit
                      minimumFontSize={6}
                    >
                      {assento.nome ?? "—"}
                    </Text>
                  </TouchableOpacity>
                ))}
                {Array.from({ length: colunas - linha.length }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={[st.assento, { width: cardWidth, minHeight: cardWidth, borderColor: "transparent", backgroundColor: "transparent" }]} />
                ))}
              </View>
            ))}
          </View>

          <View style={st.totalBadge}>
            <Ionicons name="people-outline" size={13} color="#3a7d44" />
            <Text style={st.totalBadgeText}>
              {assentos.filter((a) => a.nome).length} de {assentos.length} carteiras ocupadas
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modal feedback salvar */}
      <Modal visible={feedbackMapa.visivel} transparent animationType="fade" onRequestClose={() => setFeedbackMapa((f) => ({ ...f, visivel: false }))}>
        <View style={me.fbOverlay}>
          <View style={me.fbBox}>
            <View style={[me.fbIconWrap, { backgroundColor: feedbackMapa.tipo === "sucesso" ? "#e8f5ea" : "#fef2f2" }]}>
              <Ionicons
                name={feedbackMapa.tipo === "sucesso" ? "checkmark-circle" : "alert-circle"}
                size={32}
                color={feedbackMapa.tipo === "sucesso" ? "#3a7d44" : "#ef4444"}
              />
            </View>
            <Text style={me.fbTitulo}>{feedbackMapa.tipo === "sucesso" ? "Mapa salvo!" : "Erro ao salvar"}</Text>
            <Text style={me.fbMensagem}>{feedbackMapa.mensagem}</Text>
            <TouchableOpacity
              style={[me.fbBtn, { backgroundColor: feedbackMapa.tipo === "sucesso" ? "#3a7d44" : "#ef4444" }]}
              onPress={() => setFeedbackMapa((f) => ({ ...f, visivel: false }))}
              activeOpacity={0.85}
            >
              <Text style={me.fbBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de edição de assento */}
      <Modal visible={modalAssento} transparent animationType="fade" onRequestClose={() => setModalAssento(false)}>
        <View style={me.overlay}>
          <View style={me.box}>
            <Text style={me.titulo}>Carteira {assentoEditando?.numero}</Text>
            <Text style={me.label}>Nome do aluno</Text>
            <TextInput
              style={me.input}
              placeholder="Nome do aluno (deixe vazio para vaga)"
              placeholderTextColor="#bbb"
              value={nomeInput}
              onChangeText={(t) => setNomeInput(t.replace(/(^|\s)\S/g, (c) => c.toUpperCase()))}
              autoCapitalize="words"
              autoFocus
            />
            <View style={me.botoesRow}>
              <TouchableOpacity style={me.cancelarBtn} onPress={() => setModalAssento(false)} activeOpacity={0.8}>
                <Text style={me.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={me.confirmarBtn} onPress={salvarNomeAssento} activeOpacity={0.85}>
                <Text style={me.confirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            {assentoEditando?.nome ? (
              <TouchableOpacity style={me.limparBtn} onPress={() => salvarNomeAssento(null)} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
                <Text style={me.limparText}>Remover aluno desta carteira</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#3a7d44",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  pdfBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  salvarBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 56, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  salvarBtnInativo: { opacity: 0.4 },
  salvarBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  sectionLabel: { fontSize: 13, color: "#888", marginBottom: 4 },

  salaListHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 4,
  },
  salaListHeaderIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: "#e8f5ea", alignItems: "center", justifyContent: "center",
  },
  salaListHeaderText: { fontSize: 13, fontWeight: "700", color: "#555" },

  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#888" },
  emptySubtitle: { fontSize: 13, color: "#bbb", textAlign: "center" },

  salaCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: "#F0F0F0",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: "hidden",
  },
  salaAccent: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
    backgroundColor: "#3a7d44",
  },
  salaIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  salaArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#3a7d44", alignItems: "center", justifyContent: "center",
  },
  salaNome: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  salaTurma: { fontSize: 12, color: "#888", marginTop: 1 },
  salaCapacidade: { fontSize: 12, color: "#aaa" },

  // Mapa
  mapaScroll: { padding: 16, paddingBottom: 48, alignItems: "center", gap: 12 },

  // Stats card
  mapaStatsCard: {
    width: "100%", flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20, paddingVertical: 16, paddingHorizontal: 20,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: "#F0F0F0",
  },
  mapaStatItem: { flex: 1, alignItems: "center", gap: 2 },
  mapaStatNum: { fontSize: 26, fontWeight: "800", lineHeight: 30 },
  mapaStatLabel: { fontSize: 11, fontWeight: "600", color: "#aaa" },
  mapaStatDivider: { width: 1, height: 36, backgroundColor: "#F0F0F0", marginHorizontal: 8 },
  mapaProgressWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden",
  },
  mapaProgressFill: {
    height: 4, backgroundColor: "#3a7d44",
    borderBottomLeftRadius: 20,
  },

  legendaRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F8F9FA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    width: "100%",
  },
  legendaDot: { width: 12, height: 12, borderRadius: 4, backgroundColor: "#3a7d44", borderWidth: 1, borderColor: "#2d6a4f" },
  legendaText: { fontSize: 11, color: "#666", marginRight: 8, fontWeight: "600" },
  dicaEditar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e8f5ea", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    width: "100%", borderWidth: 1, borderColor: "#bbf7d0",
  },
  dicaEditarText: { fontSize: 11, color: "#3a7d44", flex: 1, lineHeight: 16 },
  quadroNegro: {
    width: "85%", height: 36, backgroundColor: "#1a1a2e", borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1a1a2e", shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    overflow: "hidden",
  },
  quadroNegroGlint: {
    position: "absolute", top: 0, left: 0, right: 0, height: 12,
    backgroundColor: "rgba(255,255,255,0.07)", borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },
  quadroNegroText: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: 3 },
  mapaGrid: { width: "100%", gap: 8 },
  linhaRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  assento: {
    borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, padding: 4,
  },
  assentoVago: { backgroundColor: "#F8F9FA", borderColor: "#E5E7EB" },
  assentoOcupado: {
    backgroundColor: "#e8f5ea", borderColor: "#52b788",
    shadowColor: "#3a7d44", shadowOpacity: 0.14, shadowRadius: 5, elevation: 2,
  },
  assentoNumero: { fontSize: 10, fontWeight: "700", color: "#ccc" },
  assentoNumeroOcupado: { color: "#2d6a4f" },
  assentoNome: { fontSize: 9, textAlign: "center", marginTop: 2, lineHeight: 11 },
  assentoNomeVago: { color: "#ddd" },
  assentoNomeOcupado: { color: "#1a1a2e", fontWeight: "700" },
  totalBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f0fdf4", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  totalBadgeText: { fontSize: 12, fontWeight: "600", color: "#3a7d44" },
  colunasRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f0fdf4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#bbf7d0", width: "100%",
  },
  colunasLabel: { fontSize: 13, color: "#2d6a4f", fontWeight: "700", flex: 1 },
  colunasBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#bbf7d0",
    shadowColor: "#3a7d44", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  colunasValor: { fontSize: 18, fontWeight: "800", color: "#1a1a2e", minWidth: 28, textAlign: "center" },
});

const me = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  box: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, gap: 4 },
  titulo: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  label: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1a1a2e",
    backgroundColor: "#FAFAFA", marginBottom: 16,
  },
  botoesRow: { flexDirection: "row", gap: 10 },
  cancelarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center" },
  cancelarText: { fontSize: 14, fontWeight: "600", color: "#555" },
  confirmarBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#3a7d44", alignItems: "center" },
  confirmarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  limparBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    marginTop: 12, backgroundColor: "#fef2f2", borderRadius: 12,
    paddingVertical: 12, borderWidth: 1.5, borderColor: "#fca5a5",
  },
  limparText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },

  // Modal feedback
  fbOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  fbBox: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 28, alignItems: "center", gap: 10 },
  fbIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  fbTitulo: { fontSize: 17, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  fbMensagem: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20 },
  fbBtn: { marginTop: 8, width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  fbBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
