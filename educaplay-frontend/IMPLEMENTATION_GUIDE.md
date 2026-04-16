# 📱 EducaPlay Mobile - Guia de Implementação

## 🎯 Visão Geral

EducaPlay é um aplicativo de chat anônimo P2P em React Native, permitindo que usuários se conectem por tópicos de interesse (Filmes, Jogos e Séries).

## 📋 Pré-requisitos

- **Node.js**: v18+ (instalado: v25.1.0 ✅)
- **npm**: 6.x+ (instalado: v11.6.2 ✅)
- **Expo CLI**: Instalado globalmente ✅
- **Expo Go**: Aplicativo instalado no dispositivo móvel

## 📦 Dependências Instaladas

```json
{
  "axios": "^1.15.0",
  "@react-navigation/native": "^7.2.2",
  "@react-navigation/native-stack": "^7.14.11",
  "@react-navigation/bottom-tabs": "^7.15.9",
  "react-native-screens": "~4.0.x",
  "react-native-safe-area-context": "~5.x"
}
```

## 🗂️ Estrutura do Projeto

```
educaplay-frontend/
├── src/
│   ├── components/
│   │   ├── Button.js          # Botão reutilizável
│   │   ├── Input.js           # Campo de entrada
│   │   ├── Card.js            # Card container
│   │   ├── ChatBubble.js      # Bolha de mensagem
│   │   └── index.js           # Exportações
│   │
│   ├── screens/
│   │   ├── LoginScreen.js     # Autenticação anônima
│   │   ├── HomeScreen.js      # Seleção de tópicos
│   │   ├── ChatScreen.js      # Interface de chat
│   │   └── index.js           # Exportações
│   │
│   ├── services/
│   │   ├── api.js             # Configuração Axios
│   │   ├── chatService.js     # Funções de chat
│   │   └── index.js           # Exportações
│   │
│   ├── constants/
│   │   ├── colors.js          # Paleta de cores
│   │   ├── typography.js      # Estilos de texto
│   │   ├── spacing.js         # Espaçamento
│   │   └── index.js           # Constantes globais
│   │
│   ├── design_system/
│   │   └── theme.js           # Tema centralizado
│   │
│   ├── navigation/
│   │   └── RootNavigator.js   # Configuração de rotas
│   │
│   ├── hooks/                 # Hooks customizados
│   └── assets/                # Imagens e ícones
│
├── App.js                     # Ponto de entrada
├── app.json                   # Configuração Expo
├── package.json               # Dependências
└── README.md                  # Este arquivo
```

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
cd educaplay-frontend
npm install
```

### 2. Iniciar Servidor Expo
```bash
npm start
```

### 3. Escanear QR Code
- Abra o aplicativo **Expo Go** no seu celular
- Escaneie o QR code exibido no terminal
- O app será carregado automaticamente

### 4. Comandos Alternativos
```bash
# Executar no Android
npm run android

# Executar no iOS (apenas macOS)
npm run ios

# Executar na Web
npm run web
```

## 🎮 Tópicos Disponíveis

- 🎬 **Filmes** - Discussions sobre cinema e filmes
- 🎮 **Jogos** - Discussions sobre videogames
- 📺 **Séries** - Discussions sobre séries de TV

## 🏗️ Arquitetura

### Camadas da Aplicação

1. **Frontend Mobile**: React Native + Expo
2. **Backend API**: Node.js + Express
3. **Banco de Dados**: SQLite

### Fluxo de Dados

```
User Interface (LoginScreen → HomeScreen → ChatScreen)
        ↓
   Redux/Context (State Management)
        ↓
   Services Layer (chatService.js)
        ↓
   HTTP Client (Axios)
        ↓
   Backend API (Node.js/Express)
        ↓
   Database (SQLite)
```

## 🎨 Design System

### Paleta de Cores
- **Primária**: #6200EA (Roxo)
- **Secundária**: #03DAC6 (Turquesa)
- **Sucesso**: #10B981 (Verde)
- **Erro**: #EF4444 (Vermelho)

### Tipografia
- Display Large: 32px (700)
- Heading: 18-22px (600)
- Body: 12-16px (400)
- Label: 11-14px (600)

### Espaçamento
- xs: 4px, sm: 8px, md: 12px, lg: 16px
- xl: 20px, xxl: 24px, xxxl: 32px

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (.env)
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=10000
```

## 📱 Componentes Principales

### Button
```javascript
<Button 
  title="Entrar"
  onPress={handleLogin}
  variant="primary"
  size="lg"
/>
```

### Input
```javascript
<Input 
  placeholder="Digite algo..."
  value={text}
  onChangeText={setText}
  multiline={true}
/>
```

### Card
```javascript
<Card onPress={handlePress}>
  <Text>Conteúdo do card</Text>
</Card>
```

### ChatBubble
```javascript
<ChatBubble 
  message="Olá!" 
  sender="own"
  timestamp="14:30"
/>
```

## 🔐 Análise de Segurança

### Autenticação
- [ ] Implementar JWT tokens
- [ ] Armazenar tokens localmente com segurança
- [ ] Refresh tokens automaticamente

### Dados Sensíveis
- [ ] Criptografar mensagens end-to-end (E2E)
- [ ] Usar HTTPS para todas as requisições
- [ ] Validar entrada de usuário

## 📊 Próximas Features

- [ ] Criação de salas customizadas
- [ ] Sistema de ratings/avaliações
- [ ] Notificações push
- [ ] Modo dark/light
- [ ] Histórico de chats
- [ ] Bloqueio de usuários
- [ ] Reportar mensagens

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm test -- --coverage

# Lint de código
npm run lint
```

## 📝 Convenções de Código

### Nomes de Componentes
- PascalCase: `LoginScreen.js`, `ChatBubble.js`
- Sufixo: `Screen` para telas, sem sufixo para componentes UI

### Estrutura de Pastas
- Componentes reutilizáveis em `/components`
- Telas em `/screens`
- Lógica de API em `/services`
- Estilos compartilhados em `/design_system`

## 🚨 Troubleshooting

### Erro: "expo-cli não encontrado"
```bash
npm install -g expo-cli
```

### Erro: "Módulo não encontrado"
```bash
npm install
npm start -c
```

### Erro de CORS no Backend
Certifique-se de que o backend tem CORS configurado:
```javascript
app.use(cors());
```

## 📚 Referências

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Axios Docs](https://axios-http.com/)

## 📄 Licença

MIT License - 2026

## 👨‍💻 Autor

EducaPlay Team - Projeto Educacional

---

**Estado do Projeto**: 🟢 Pronto para Configuração Inicial
**Última Atualização**: 16 de Abril de 2026
