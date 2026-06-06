import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

  // podeEditar será recalculado por sala ao carregar o mapa
  const [podeEditar, setPodeEditar] = useState(usuario?.papel === "Supervisao");

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
    // Verifica permissão por sala para professor
    if (usuario?.papel === "Professor") {
      try {
        const perm = await api.get(`/professores/${usuario.id}/permissoes-mapa/${sala.id}`);
        setPodeEditar(perm.data?.temPermissao === true);
      } catch { setPodeEditar(false); }
    }
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

  const cardWidth = React.useMemo(() => {
    const totalPadding = 64; // 16*2 margem + 16*2 padding classroom
    const gaps = (colunas - 1) * 6;
    return Math.floor((width - totalPadding - gaps) / colunas);
  }, [width, colunas]);

  const linhas = React.useMemo(() => {
    const rows: Assento[][] = [];
    for (let i = 0; i < assentos.length; i += colunas) {
      rows.push(assentos.slice(i, i + colunas));
    }
    return rows;
  }, [assentos, colunas]);

  const gerarPDF = async () => {
    if (!salaSelecionada) return;
    setExportando(true);
    try {
      const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      const tituloSala = esc(salaSelecionada.turma
        ? `${salaSelecionada.nome} — ${salaSelecionada.turma}`
        : salaSelecionada.nome);
      const dataStr = new Date().toLocaleDateString("pt-BR");
      const instituicao = esc((usuario as any)?.instituicao || "");
      const ocupadas = assentos.filter(a => a.nome).length;
      const total = assentos.length;
      const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
      const seatW = Math.max(46, Math.floor(480 / colunas) - 8);

      const seatRows = linhas.map(linha => {
        const cells = linha.map(a =>
          a.nome
            ? `<div class="seat occ"><span class="num">${a.numero}</span><span class="name">${esc(a.nome)}</span></div>`
            : `<div class="seat vago"><span class="num">${a.numero}</span><span class="dash">-</span></div>`
        ).join("");
        const empties = Array.from({ length: colunas - linha.length })
          .map(() => `<div class="seat invisible"></div>`).join("");
        return `<div class="row">${cells}${empties}</div>`;
      }).join("");

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:sans-serif;padding:20px;background:#fff;color:#1a1a2e}
.header{border-bottom:2px solid #e2e8f0;padding-bottom:10px;margin-bottom:14px}
.inst{font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
h1{font-size:18px;font-weight:bold;color:#0f172a}
.sub{font-size:11px;color:#64748b;margin-top:2px}
table.stats{width:100%;border-collapse:collapse;margin-bottom:14px}
table.stats td{text-align:center;padding:8px;background:#f8fafc;border:1px solid #e2e8f0}
.stat-num{font-size:20px;font-weight:bold;color:#0f172a}
.stat-num.occ{color:#3a7d44}
.stat-lbl{font-size:9px;color:#64748b;font-weight:bold;text-transform:uppercase}
.bar-bg{background:#e2e8f0;border-radius:4px;height:6px;margin-bottom:14px}
.bar-fg{background:#3a7d44;border-radius:4px;height:6px;width:${pct}%}
.board{background:#1a1a2e;color:#fff;text-align:center;padding:7px;border-radius:6px;font-size:10px;font-weight:bold;letter-spacing:3px;margin-bottom:12px;width:60%;margin-left:auto;margin-right:auto}
.grid{margin:0 auto}
.row{display:table;width:100%;margin-bottom:5px}
.seat{display:table-cell;border-radius:6px;padding:4px 2px;text-align:center;border:1px solid #e2e8f0;width:${seatW}px;min-height:46px;vertical-align:middle}
.occ{background:#e8f5ea;border-color:#86efac}
.vago{background:#f8fafc}
.invisible{border:none;background:transparent}
.num{font-size:9px;font-weight:bold;color:#aaa;display:block;margin-bottom:2px}
.occ .num{color:#2d6a4f}
.name{font-size:9px;font-weight:bold;color:#1a1a2e;display:block}
.dash{font-size:12px;color:#ccc;display:block}
.footer{margin-top:16px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
${instituicao ? `<div class="inst">${instituicao}</div>` : ""}
<h1>${tituloSala}</h1>
<div class="sub">Mapa de Carteiras - ${dataStr}</div>
</div>
<table class="stats"><tr>
<td><div class="stat-num occ">${ocupadas}</div><div class="stat-lbl">Ocupadas</div></td>
<td><div class="stat-num">${total - ocupadas}</div><div class="stat-lbl">Vagas</div></td>
<td><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></td>
</tr></table>
<div class="bar-bg"><div class="bar-fg"></div></div>
<div class="board">QUADRO</div>
<div class="grid">${seatRows}</div>
<div class="footer">EducaPlay - Mapa gerado em ${dataStr}</div>
</body></html>`;

      const resultado = await Print.printToFileAsync({ html, base64: false }).catch(() => null);

      if (resultado?.uri) {
        await Sharing.shareAsync(resultado.uri, { mimeType: "application/pdf", dialogTitle: "Exportar Mapa de Sala" });
      } else {
        // Fallback: abre dialogo de impressao do sistema (permite "Salvar como PDF")
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      setFeedbackMapa({ visivel: true, tipo: "erro", mensagem: err?.message || "Nao foi possivel gerar o PDF." });
    } finally {
      setExportando(false);
    }
  };

  // --- Tela de lista de salas ---
  if (!salaSelecionada) {
    const ACCENT_COLORS = ["#3a7d44", "#4361ee", "#f4831f", "#8b5cf6", "#e11d48", "#0891b2"];
    const COR_POR_NOME: Record<string, string> = {
      laranja: "#f97316", orange: "#f97316",
      azul: "#4361ee", blue: "#4361ee",
      verde: "#3a7d44", green: "#3a7d44",
      vermelho: "#ef4444", red: "#ef4444",
      roxo: "#8b5cf6", purple: "#8b5cf6",
      rosa: "#ec4899", pink: "#ec4899",
      amarelo: "#f59e0b", yellow: "#f59e0b",
      cinza: "#6b7280", gray: "#6b7280",
      ciano: "#0891b2", cyan: "#0891b2",
      lilas: "#a78bfa",
    };
    const getCorSala = (nome: string, id: string): string => {
      const lower = nome.toLowerCase();
      for (const [key, cor] of Object.entries(COR_POR_NOME)) {
        if (lower.includes(key)) return cor;
      }
      // Hash estável pelo ID — nunca muda com reordenação
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
      }
      return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
    };
    return (
      <SafeAreaView style={st.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle}>Mapa de Sala</Text>
            {!carregandoSalas && (
              <Text style={st.headerSub}>
                {salas.length === 0 ? "Nenhuma sala" : `${salas.length} sala${salas.length > 1 ? "s" : ""} cadastrada${salas.length > 1 ? "s" : ""}`}
              </Text>
            )}
          </View>
          <View style={st.headerBadge}>
            <Ionicons name="business-outline" size={19} color="rgba(255,255,255,0.85)" />
          </View>
        </View>

        {carregandoSalas ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
        ) : salas.length === 0 ? (
          <View style={st.empty}>
            <View style={st.emptyIconWrap}>
              <Ionicons name="business-outline" size={40} color="#bbb" />
            </View>
            <Text style={st.emptyTitle}>Nenhuma sala cadastrada</Text>
            <Text style={st.emptySubtitle}>As salas aparecem aqui{"\n"}quando forem criadas pela supervisão</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={st.listaScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.listaSecLabel}>Selecione uma sala para ver o mapa</Text>

            {salas.map((sala, idx) => {
              const cor = getCorSala(sala.nome, sala.id);
              const inicial = sala.nome.trim()[0]?.toUpperCase() ?? "S";
              return (
                <TouchableOpacity
                  key={sala.id}
                  style={st.salaCard}
                  onPress={() => carregarMapa(sala)}
                  activeOpacity={0.72}
                >
                  {/* Fundo ghost */}
                  <Ionicons
                    name="grid-outline"
                    size={100}
                    color={cor + "10"}
                    style={{ position: "absolute", right: -16, top: -10 }}
                  />

                  {/* Barra lateral colorida */}
                  <View style={[st.salaAccent, { backgroundColor: cor }]} />

                  {/* Badge com inicial */}
                  <View style={[st.salaInicialBadge, { backgroundColor: cor + "18", borderColor: cor + "30" }]}>
                    <Text style={[st.salaInicialText, { color: cor }]}>{inicial}</Text>
                  </View>

                  {/* Info */}
                  <View style={st.salaInfo}>
                    <Text style={st.salaNome} numberOfLines={1}>{sala.nome}</Text>
                    {sala.turma ? (
                      <View style={st.salaTurmaRow}>
                        <Ionicons name="people-outline" size={11} color="#888" />
                        <Text style={st.salaTurma}>{sala.turma}</Text>
                      </View>
                    ) : null}
                    {sala.capacidade ? (
                      <Text style={st.salaCapacidade}>{sala.capacidade} carteiras</Text>
                    ) : null}
                  </View>

                  {/* CTA */}
                  <View style={[st.salaCtaWrap, { borderColor: cor + "40", backgroundColor: cor + "0D" }]}>
                    <Text style={[st.salaCtaText, { color: cor }]}>Ver</Text>
                    <Ionicons name="arrow-forward" size={13} color={cor} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // --- Tela do mapa ---
  const ocupadas = assentos.filter(a => a.nome).length;
  const pct = assentos.length > 0 ? Math.round((ocupadas / assentos.length) * 100) : 0;

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={voltarParaLista} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle} numberOfLines={1}>{salaSelecionada.nome}</Text>
          {salaSelecionada.turma
            ? <Text style={st.headerSub}>{salaSelecionada.turma}</Text>
            : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity style={st.pdfBtn} onPress={gerarPDF} disabled={exportando} activeOpacity={0.8}>
            {exportando
              ? <ActivityIndicator size={16} color="#fff" />
              : <Ionicons name="document-text-outline" size={19} color="#fff" />}
          </TouchableOpacity>
          {podeEditar ? (
            <TouchableOpacity
              style={[st.salvarBtn, !isDirty && st.salvarBtnInativo]}
              onPress={salvarMapa}
              disabled={salvando || !isDirty}
              activeOpacity={0.8}
            >
              {salvando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={st.salvarBtnText}>Salvar</Text>}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {carregandoMapa ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.mapaScroll} showsVerticalScrollIndicator={false}>

          {/* Barra de estatísticas */}
          <View style={st.statsBar}>
            <View style={st.statItem}>
              <View style={[st.statDot, { backgroundColor: "#3a7d44" }]} />
              <Text style={[st.statNum, { color: "#3a7d44" }]}>{ocupadas}</Text>
              <Text style={st.statLbl}>com aluno</Text>
            </View>
            <View style={st.statSep} />
            <View style={st.statItem}>
              <View style={[st.statDot, { backgroundColor: "#D1D5DB" }]} />
              <Text style={[st.statNum, { color: "#9CA3AF" }]}>{assentos.length - ocupadas}</Text>
              <Text style={st.statLbl}>vagas</Text>
            </View>
            <View style={st.statSep} />
            <View style={[st.statItem, { flex: 2 }]}>
              <View style={st.statBarBg}>
                <View style={[st.statBarFg, { width: `${pct}%` as any }]} />
              </View>
              <Text style={st.statPct}>{pct}% ocupado</Text>
            </View>
          </View>

          {/* Controles (edição) */}
          {podeEditar && (
            <View style={st.controles}>
              <View style={st.dicaBanner}>
                <Ionicons name="hand-left-outline" size={13} color="#6B7280" />
                <Text style={st.dicaBannerText}>Toque numa carteira para editar</Text>
              </View>
              <View style={st.stepper}>
                <TouchableOpacity
                  style={[st.stepperBtn, colunas <= 1 && { opacity: 0.3 }]}
                  onPress={() => setColunas(c => Math.max(1, c - 1))}
                  disabled={colunas <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color="#374151" />
                </TouchableOpacity>
                <View style={st.stepperValor}>
                  <Text style={st.stepperNum}>{colunas}</Text>
                  <Text style={st.stepperLabel}>col.</Text>
                </View>
                <TouchableOpacity
                  style={[st.stepperBtn, colunas >= 10 && { opacity: 0.3 }]}
                  onPress={() => setColunas(c => Math.min(10, c + 1))}
                  disabled={colunas >= 10}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sala — planta baixa */}
          <View style={st.classroom}>
            {/* Quadro */}
            <View style={st.board}>
              <View style={st.boardInner}>
                <Text style={st.boardText}>QUADRO</Text>
              </View>
              <View style={st.boardShadow} />
            </View>

            {/* Mesa do professor */}
            <View style={st.teacherDesk}>
              <View style={st.teacherDeskBody}>
                <Ionicons name="person" size={11} color="#9CA3AF" />
                <Text style={st.teacherDeskLabel}>Professor</Text>
              </View>
            </View>

            {/* Corredor */}
            <View style={st.corridor} />

            {/* Grade de carteiras */}
            <View style={st.seatsGrid}>
              {linhas.map((linha, li) => (
                <View key={li} style={st.seatRow}>
                  {linha.map((assento) => (
                    <TouchableOpacity
                      key={assento.id}
                      style={[
                        st.seat,
                        { width: cardWidth, height: cardWidth },
                        assento.nome ? st.seatOcupado : st.seatVago,
                      ]}
                      onPress={() => abrirEdicaoAssento(assento)}
                      activeOpacity={podeEditar ? 0.72 : 1}
                    >
                      <Text style={[st.seatNum, assento.nome && { color: "#6EE7A8" }]}>
                        {assento.numero}
                      </Text>
                      {assento.nome ? (
                        <Text
                          style={st.seatName}
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          minimumFontScale={0.5}
                        >
                          {assento.nome.split(" ")[0]}
                        </Text>
                      ) : podeEditar ? (
                        <Ionicons name="add" size={16} color="#D1D5DB" />
                      ) : (
                        <View style={st.seatDash} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {Array.from({ length: colunas - linha.length }).map((_, idx) => (
                    <View key={`ph-${idx}`} style={{ width: cardWidth, height: cardWidth }} />
                  ))}
                </View>
              ))}
            </View>

            {/* Fundo da sala — indicação de porta */}
            <View style={st.salaFooter}>
              <View style={st.portaIndicador}>
                <Ionicons name="enter-outline" size={12} color="#D1D5DB" />
                <Text style={st.portaText}>Entrada</Text>
              </View>
            </View>
          </View>

          {/* Rodapé */}
          <View style={st.mapaRodape}>
            <View style={st.legendaItem}>
              <View style={[st.legendaSquare, { backgroundColor: "#e8f5ea", borderColor: "#52b788" }]} />
              <Text style={st.legendaItemText}>Com aluno</Text>
            </View>
            <View style={st.legendaItem}>
              <View style={[st.legendaSquare, { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", borderStyle: "dashed" }]} />
              <Text style={st.legendaItemText}>Vaga</Text>
            </View>
            <Text style={st.totalText}>{ocupadas}/{assentos.length} ocupadas</Text>
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
      <Modal visible={modalAssento} transparent animationType="slide" onRequestClose={() => setModalAssento(false)}>
        <View style={me.overlay}>
          <View style={me.box}>
            <View style={me.handle} />
            <Text style={me.titulo}>Carteira {assentoEditando?.numero}</Text>
            <Text style={me.tituloSub}>
              {assentoEditando?.nome ? `Atualmente: ${assentoEditando.nome}` : "Carteira vaga"}
            </Text>
            <Text style={me.label}>Nome do aluno</Text>
            <TextInput
              style={me.input}
              placeholder="Ex: João Silva"
              placeholderTextColor="#9CA3AF"
              value={nomeInput}
              onChangeText={(t) => setNomeInput(t.replace(/(^|\s)\S/g, (c) => c.toUpperCase()))}
              autoCapitalize="words"
              autoFocus
            />
            <View style={me.botoesRow}>
              <TouchableOpacity style={me.cancelarBtn} onPress={() => setModalAssento(false)} activeOpacity={0.8}>
                <Text style={me.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={me.confirmarBtn} onPress={() => salvarNomeAssento()} activeOpacity={0.85}>
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
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  // ── Header ──────────────────────────────────────────────────
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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 1, fontWeight: "500" },
  pdfBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  salvarBtn: {
    backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 58, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  salvarBtnInativo: { opacity: 0.38 },
  salvarBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // ── Lista de salas ──────────────────────────────────────────
  listaScroll: { padding: 16, paddingBottom: 48 },
  listaSecLabel: {
    fontSize: 12, fontWeight: "600", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 14,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#6B7280" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 19 },

  salaCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20,
    marginBottom: 12, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: "#F1F5F9",
    paddingVertical: 16, paddingRight: 14, paddingLeft: 0,
  },
  salaAccent: { width: 5, alignSelf: "stretch", marginRight: 14 },
  salaInicialBadge: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginRight: 14, borderWidth: 1.5,
  },
  salaInicialText: { fontSize: 22, fontWeight: "800" },
  salaInfo: { flex: 1, gap: 2 },
  salaNome: { fontSize: 16, fontWeight: "800", color: "#111827" },
  salaTurmaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  salaTurma: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  salaCapacidade: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  salaCtaWrap: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8,
  },
  salaCtaText: { fontSize: 12, fontWeight: "700" },

  // ── Mapa ────────────────────────────────────────────────────
  mapaScroll: { padding: 16, paddingBottom: 48, alignItems: "center" },

  // Barra de stats
  statsBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 12, width: "100%",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  statItem: { flex: 1, alignItems: "center", flexDirection: "row", gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLbl: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  statSep: { width: 1, height: 28, backgroundColor: "#F1F5F9", marginHorizontal: 8 },
  statBarBg: {
    flex: 1, height: 6, backgroundColor: "#F1F5F9",
    borderRadius: 3, overflow: "hidden", marginBottom: 4,
  },
  statBarFg: { height: 6, backgroundColor: "#3a7d44", borderRadius: 3 },
  statPct: { fontSize: 11, color: "#6B7280", fontWeight: "600" },

  // Controles de edição
  controles: {
    flexDirection: "row", alignItems: "center",
    width: "100%", marginBottom: 12, gap: 10,
  },
  dicaBanner: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  dicaBannerText: { fontSize: 11, color: "#6B7280", flex: 1 },
  stepper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  stepperBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  stepperValor: {
    paddingHorizontal: 10, alignItems: "center",
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#E5E7EB",
  },
  stepperNum: { fontSize: 16, fontWeight: "800", color: "#111827" },
  stepperLabel: { fontSize: 9, color: "#9CA3AF", fontWeight: "600" },

  // Sala (planta baixa)
  classroom: {
    width: "100%", backgroundColor: "#fff",
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    marginBottom: 14,
  },

  // Quadro
  board: { width: "100%", position: "relative" },
  boardInner: {
    backgroundColor: "#1C2B3A", paddingVertical: 12, paddingHorizontal: 24,
    alignItems: "center",
  },
  boardText: {
    fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.7)",
    letterSpacing: 5, textTransform: "uppercase",
  },
  boardShadow: {
    height: 6, backgroundColor: "#0F1923",
    opacity: 0.12,
  },

  // Mesa do professor
  teacherDesk: {
    alignItems: "center", paddingVertical: 8,
    backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  teacherDeskBody: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  teacherDeskLabel: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },

  // Corredor entre mesa e carteiras
  corridor: { height: 10, backgroundColor: "#F9FAFB" },

  // Grade de carteiras
  seatsGrid: { padding: 12, gap: 6 },
  seatRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 6 },
  seat: {
    borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, paddingVertical: 4, paddingHorizontal: 2,
    position: "relative",
  },
  seatVago: {
    backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", borderStyle: "dashed",
  },
  seatOcupado: {
    backgroundColor: "#0F2D1C", borderColor: "#166534",
    shadowColor: "#3a7d44", shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  seatNum: {
    fontSize: 8, fontWeight: "700", color: "#9CA3AF",
    position: "absolute", top: 3, left: 4,
  },
  seatName: {
    fontSize: 9, fontWeight: "700", color: "#D1FAE5",
    textAlign: "center", lineHeight: 11, marginTop: 8,
  },
  seatDash: {
    width: 12, height: 1.5, backgroundColor: "#D1D5DB", borderRadius: 1, marginTop: 8,
  },

  // Fundo da sala
  salaFooter: {
    paddingVertical: 8, backgroundColor: "#F9FAFB",
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
    alignItems: "flex-start", paddingHorizontal: 16,
  },
  portaIndicador: { flexDirection: "row", alignItems: "center", gap: 4 },
  portaText: { fontSize: 10, color: "#D1D5DB", fontWeight: "600" },

  // Rodapé
  mapaRodape: {
    flexDirection: "row", alignItems: "center",
    width: "100%", gap: 14,
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendaSquare: {
    width: 14, height: 14, borderRadius: 4,
    borderWidth: 1.5,
  },
  legendaItemText: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  totalText: {
    flex: 1, textAlign: "right",
    fontSize: 12, color: "#9CA3AF", fontWeight: "600",
  },
});

const me = StyleSheet.create({
  // Modal edição assento
  overlay: {
    flex: 1, backgroundColor: "rgba(15,28,30,0.6)",
    alignItems: "center", justifyContent: "flex-end",
  },
  box: {
    width: "100%", backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginBottom: 20,
  },
  titulo: {
    fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 4,
  },
  tituloSub: { fontSize: 13, color: "#9CA3AF", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: "#111827", backgroundColor: "#F9FAFB", marginBottom: 20,
  },
  botoesRow: { flexDirection: "row", gap: 10, marginBottom: 0 },
  cancelarBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  cancelarText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  confirmarBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#3a7d44", alignItems: "center",
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmarText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  limparBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 14, paddingVertical: 12, borderRadius: 14,
    backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FCA5A5",
  },
  limparText: { fontSize: 14, fontWeight: "700", color: "#ef4444" },

  // Modal feedback
  fbOverlay: {
    flex: 1, backgroundColor: "rgba(15,28,30,0.6)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 28,
  },
  fbBox: {
    width: "100%", backgroundColor: "#fff", borderRadius: 24,
    padding: 28, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  fbIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  fbTitulo: { fontSize: 18, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 8 },
  fbMensagem: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 19, marginBottom: 24 },
  fbBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  fbBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
