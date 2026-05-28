import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import api from "../../src/services/api";

type Config = { latitude: number; longitude: number; raio: number };
type ResultadoBusca = { place_id: number; display_name: string; lat: string; lon: string };

const HTML_MAPA = (lat: number, lon: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; }
    #map { width: 100vw; height: 100vh; }
    #dica {
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.65); color: #fff;
      font-size: 13px; padding: 8px 16px; border-radius: 20px;
      z-index: 999; white-space: nowrap; pointer-events: none;
    }
    #busca-box {
      position: absolute; top: 50px; left: 10px; right: 10px;
      z-index: 1000; display: flex; gap: 6px;
    }
    #busca-input {
      flex: 1; padding: 10px 12px; border-radius: 10px; border: none;
      font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    #busca-btn {
      background: #3a7d44; color: #fff; border: none;
      padding: 10px 14px; border-radius: 10px; font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;
    }
    #resultados {
      position: absolute; top: 100px; left: 10px; right: 10px;
      background: #fff; border-radius: 10px; z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 220px; overflow-y: auto;
    }
    .resultado-item {
      padding: 10px 14px; font-size: 13px; color: #333;
      border-bottom: 1px solid #f0f0f0; cursor: pointer;
    }
    .resultado-item:last-child { border-bottom: none; }
    .resultado-item:active { background: #f0faf2; }
  </style>
</head>
<body>
  <div id="dica">Toque no mapa para marcar a escola</div>
  <div id="busca-box">
    <input id="busca-input" type="text" placeholder="Buscar endereço..."/>
    <button id="busca-btn" onclick="buscar()">🔍</button>
  </div>
  <div id="resultados" style="display:none"></div>
  <div id="map"></div>

  <script>
    var initLat = ${lat !== 0 ? lat : -14.235};
    var initLon = ${lon !== 0 ? lon : -51.9253};
    var initZoom = ${lat !== 0 ? 16 : 4};

    var map = L.map('map', { zoomControl: true }).setView([initLat, initLon], initZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map);

    var marker = null;
    ${lat !== 0 ? `marker = L.marker([${lat}, ${lon}]).addTo(map);` : ''}

    map.on('click', function(e) {
      var lat = e.latlng.lat.toFixed(7);
      var lng = e.latlng.lng.toFixed(7);
      if (marker) { marker.setLatLng([lat, lng]); }
      else { marker = L.marker([lat, lng]).addTo(map); }
      document.getElementById('dica').textContent = 'Toque em "Confirmar" para salvar';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: parseFloat(lat), lon: parseFloat(lng) }));
    });

    function buscar() {
      var q = document.getElementById('busca-input').value.trim();
      if (q.length < 3) return;
      fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=5', {
        headers: { 'User-Agent': 'EducaPlay/1.0' }
      })
      .then(r => r.json())
      .then(data => {
        var box = document.getElementById('resultados');
        if (!data.length) { box.innerHTML = '<div class="resultado-item" style="color:#aaa">Nenhum resultado encontrado</div>'; box.style.display='block'; return; }
        box.innerHTML = data.map((d,i) => '<div class="resultado-item" onclick="selecionarResultado(' + i + ')">' + d.display_name + '</div>').join('');
        box.style.display = 'block';
        window._resultados = data;
      });
    }

    document.getElementById('busca-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') buscar();
    });

    function selecionarResultado(i) {
      var item = window._resultados[i];
      var lat = parseFloat(item.lat);
      var lon = parseFloat(item.lon);
      map.setView([lat, lon], 17);
      if (marker) { marker.setLatLng([lat, lon]); }
      else { marker = L.marker([lat, lon]).addTo(map); }
      document.getElementById('resultados').style.display = 'none';
      document.getElementById('busca-input').value = item.display_name.split(',')[0];
      document.getElementById('dica').textContent = 'Toque em "Confirmar" para salvar';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: lat, lon: lon }));
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#busca-box') && !e.target.closest('#resultados')) {
        document.getElementById('resultados').style.display = 'none';
      }
    });

    window.centralizarMapa = function(lat, lon) {
      map.setView([lat, lon], 17);
      if (marker) { marker.setLatLng([lat, lon]); }
      else { marker = L.marker([lat, lon]).addTo(map); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: lat, lon: lon }));
    };
  </script>
</body>
</html>
`;

export default function ConfiguracaoEscolaScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({ latitude: 0, longitude: 0, raio: 200 });
  const [raioStr, setRaioStr] = useState("200");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [obtendoLoc, setObtendoLoc] = useState(false);
  const [localNome, setLocalNome] = useState<string | null>(null);

  // Modal do mapa
  const [mapaVisivel, setMapaVisivel] = useState(false);
  const [pinTemp, setPinTemp] = useState<{ lat: number; lon: number } | null>(null);
  const webViewRef = useRef<any>(null);

  const configurado = config.latitude !== 0 || config.longitude !== 0;

  useEffect(() => {
    api.get("/configuracao-escola")
      .then((res) => {
        const c: Config = res.data;
        setConfig(c);
        setRaioStr(String(c.raio ?? 200));
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar as configurações."))
      .finally(() => setCarregando(false));
  }, []);

  const obterLocalizacaoAtual = async () => {
    setObtendoLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Habilite a localização nas configurações do dispositivo.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      if (mapaVisivel && webViewRef.current) {
        webViewRef.current.injectJavaScript(`centralizarMapa(${latitude}, ${longitude}); true;`);
      } else {
        setConfig((prev) => ({ ...prev, latitude, longitude }));
        setLocalNome("Localização atual");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível obter sua localização.");
    } finally {
      setObtendoLoc(false);
    }
  };

  const handleMensagemMapa = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "pin") {
        setPinTemp({ lat: data.lat, lon: data.lon });
      }
    } catch {}
  };

  const confirmarPin = () => {
    if (!pinTemp) return;
    setConfig((prev) => ({ ...prev, latitude: pinTemp.lat, longitude: pinTemp.lon }));
    setLocalNome(null);
    // Geocodificação reversa para nome
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pinTemp.lat}&lon=${pinTemp.lon}&format=json`, {
      headers: { "User-Agent": "EducaPlay/1.0" },
    })
      .then((r) => r.json())
      .then((d) => setLocalNome(d.display_name ?? null))
      .catch(() => {});

    setMapaVisivel(false);
    setPinTemp(null);
  };

  const handleSalvar = async () => {
    if (!configurado) {
      Alert.alert("Atenção", "Marque a localização da escola no mapa antes de salvar.");
      return;
    }
    const raio = parseFloat(raioStr.replace(",", "."));
    if (isNaN(raio) || raio < 10) {
      Alert.alert("Atenção", "O raio deve ser de no mínimo 10 metros.");
      return;
    }
    setSalvando(true);
    try {
      await api.put("/configuracao-escola", { latitude: config.latitude, longitude: config.longitude, raio });
      Alert.alert("Salvo!", "Localização da escola atualizada com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="dark-content" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Localização da Escola</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#3a7d44" />
      ) : (
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

          {/* Status */}
          <View style={[st.statusCard, configurado ? st.statusOk : st.statusPendente]}>
            <Ionicons name={configurado ? "location" : "location-outline"} size={22} color={configurado ? "#3a7d44" : "#f97316"} />
            <View style={{ flex: 1 }}>
              <Text style={[st.statusTitulo, { color: configurado ? "#3a7d44" : "#f97316" }]}>
                {configurado ? "Localização configurada" : "Localização não configurada"}
              </Text>
              <Text style={st.statusDescricao} numberOfLines={2}>
                {localNome
                  ? localNome
                  : configurado
                  ? `${config.latitude.toFixed(6)}, ${config.longitude.toFixed(6)}`
                  : "Marque o local da escola no mapa para habilitar o registro de ponto."}
              </Text>
            </View>
          </View>

          {/* Botão principal: abrir mapa */}
          <TouchableOpacity style={st.btnMapa} onPress={() => { setPinTemp(null); setMapaVisivel(true); }} activeOpacity={0.85}>
            <Ionicons name="map-outline" size={22} color="#fff" />
            <Text style={st.btnMapaText}>
              {configurado ? "Alterar localização no mapa" : "Marcar localização no mapa"}
            </Text>
          </TouchableOpacity>

          {/* Usar localização atual */}
          <TouchableOpacity style={st.btnGPS} onPress={obterLocalizacaoAtual} disabled={obtendoLoc} activeOpacity={0.8}>
            {obtendoLoc ? <ActivityIndicator size="small" color="#3a7d44" /> : <Ionicons name="navigate-outline" size={18} color="#3a7d44" />}
            <Text style={st.btnGPSText}>{obtendoLoc ? "Obtendo localização..." : "Usar minha localização atual"}</Text>
          </TouchableOpacity>

          {/* Raio */}
          <View style={st.inputGrupo}>
            <Text style={st.inputLabel}>Raio de tolerância (metros)</Text>
            <View style={st.inputRow}>
              <Ionicons name="radio-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={st.input}
                placeholder="200"
                placeholderTextColor="#bbb"
                value={raioStr}
                onChangeText={setRaioStr}
                keyboardType="number-pad"
              />
            </View>
            <Text style={st.inputHint}>
              Distância máxima da escola para o professor conseguir bater o ponto (mínimo 10m)
            </Text>
          </View>

          {/* Dica */}
          <View style={st.dicaCard}>
            <Ionicons name="information-circle-outline" size={16} color="#3a7d44" />
            <Text style={st.dicaText}>
              Abra o mapa, navegue até a escola (use a busca interna ou dê zoom) e toque exatamente no local. Depois toque em "Confirmar".
            </Text>
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[st.btnSalvar, (!configurado || salvando) && { opacity: 0.5 }]}
            onPress={handleSalvar}
            disabled={!configurado || salvando}
            activeOpacity={0.85}
          >
            {salvando ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={st.btnSalvarText}>Salvar Localização</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal do mapa */}
      <Modal visible={mapaVisivel} animationType="slide" onRequestClose={() => setMapaVisivel(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Barra do mapa */}
          <View style={st.mapaHeader}>
            <TouchableOpacity onPress={() => setMapaVisivel(false)} style={st.mapaCloseBtn}>
              <Ionicons name="close" size={22} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={st.mapaHeaderTitulo}>Selecionar localização</Text>
            <TouchableOpacity
              style={[st.mapaConfirmarBtn, !pinTemp && { opacity: 0.4 }]}
              onPress={confirmarPin}
              disabled={!pinTemp}
              activeOpacity={0.85}
            >
              <Text style={st.mapaConfirmarText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {pinTemp && (
            <View style={st.mapaPinInfo}>
              <Ionicons name="location" size={14} color="#3a7d44" />
              <Text style={st.mapaPinText}>
                {pinTemp.lat.toFixed(6)}, {pinTemp.lon.toFixed(6)}
              </Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html: HTML_MAPA(config.latitude, config.longitude) }}
            onMessage={handleMensagemMapa}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f7f8fa" }}>
                <ActivityIndicator size="large" color="#3a7d44" />
                <Text style={{ marginTop: 10, color: "#888", fontSize: 13 }}>Carregando mapa...</Text>
              </View>
            )}
          />

          {/* Botão GPS dentro do mapa */}
          <TouchableOpacity style={st.mapaGpsBtn} onPress={obterLocalizacaoAtual} disabled={obtendoLoc} activeOpacity={0.8}>
            {obtendoLoc ? <ActivityIndicator size="small" color="#3a7d44" /> : <Ionicons name="navigate" size={20} color="#3a7d44" />}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },

  statusCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1.5,
  },
  statusOk: { backgroundColor: "#e8f5ea", borderColor: "#86efac" },
  statusPendente: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  statusTitulo: { fontSize: 14, fontWeight: "700" },
  statusDescricao: { fontSize: 12, color: "#666", marginTop: 2, lineHeight: 17 },

  btnMapa: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 16,
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnMapaText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  btnGPS: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: "#86efac",
  },
  btnGPSText: { fontSize: 14, fontWeight: "600", color: "#3a7d44" },

  inputGrupo: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F7F8FA", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E8E8F0",
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, color: "#1a1a2e", padding: 0 },
  inputHint: { fontSize: 11, color: "#aaa", marginTop: 2 },

  dicaCard: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  dicaText: { flex: 1, fontSize: 12, color: "#3a7d44", lineHeight: 17 },

  btnSalvar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 14, paddingVertical: 15,
    shadowColor: "#3a7d44", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnSalvarText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Modal do mapa
  mapaHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  mapaCloseBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  mapaHeaderTitulo: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  mapaConfirmarBtn: {
    backgroundColor: "#3a7d44", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  mapaConfirmarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  mapaPinInfo: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e8f5ea", paddingHorizontal: 14, paddingVertical: 7,
  },
  mapaPinText: { fontSize: 12, color: "#2d6a4f", fontWeight: "600" },
  mapaGpsBtn: {
    position: "absolute", right: 16, bottom: 32,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});
