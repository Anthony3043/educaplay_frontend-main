import { styles as s } from "@/styles/configuracoesstyles";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

export default function PoliticaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 20 }}>
          Última atualização: junho de 2026 — em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
        </Text>

        <P>
          O <Text style={{ fontWeight: "700", color: Colors.primary }}>EducaPlay</Text> respeita e protege a
          privacidade dos seus usuários. Esta Política descreve de forma transparente quais dados coletamos,
          como os utilizamos, com quem os compartilhamos e quais são os seus direitos como titular.
        </P>

        <Section title="1. Controlador dos Dados">
          <P>
            O controlador responsável pelo tratamento dos seus dados pessoais é:{"\n"}
            <Text style={{ fontWeight: "600" }}>EducaPlay</Text>{"\n"}
            E-mail de contato: <Text style={{ fontWeight: "600", color: Colors.primary }}>am1662847@gmail.com</Text>
          </P>
        </Section>

        <Section title="2. Dados Pessoais Coletados">
          <P>Coletamos apenas os dados estritamente necessários para o funcionamento do aplicativo:</P>
          <P>• <Text style={{ fontWeight: "600" }}>Cadastro:</Text> nome completo, e-mail, cargo, instituição de ensino e disciplinas lecionadas;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Autenticação:</Text> senha (armazenada exclusivamente em formato criptografado — bcrypt);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Foto de perfil:</Text> imagem opcional fornecida pelo usuário, armazenada no serviço Cloudinary;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Localização geográfica (GPS):</Text> coletada pontualmente apenas no momento do registro de ponto, para verificar se o usuário está dentro do raio da escola. Não há monitoramento contínuo;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Token de notificação:</Text> identificador do dispositivo para envio de notificações push (Expo Push Notifications);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Dados de uso:</Text> cronogramas, horários, registros de ponto, mapas de sala e comunicações internas.</P>
        </Section>

        <Section title="3. Base Legal para o Tratamento (LGPD)">
          <P>O tratamento dos seus dados pessoais é realizado com as seguintes bases legais:</P>
          <P>• <Text style={{ fontWeight: "600" }}>Execução de contrato</Text> (art. 7º, V): para prestação dos serviços de gestão escolar contratados pela instituição;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Legítimo interesse</Text> (art. 7º, IX): para envio de notificações operacionais e segurança da plataforma;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Consentimento</Text> (art. 7º, I): para uso de foto de perfil e localização GPS.</P>
        </Section>

        <Section title="4. Finalidade do Tratamento">
          <P>Seus dados são utilizados exclusivamente para:</P>
          <P>• Autenticar e gerenciar sua conta;</P>
          <P>• Exibir e gerenciar cronogramas, horários e registros de ponto;</P>
          <P>• Validar a presença geográfica no registro de ponto;</P>
          <P>• Enviar notificações operacionais (ausências, atrasos, alterações);</P>
          <P>• Garantir a segurança e integridade da plataforma.</P>
          <P>Seus dados <Text style={{ fontWeight: "600" }}>não são utilizados</Text> para fins comerciais, publicidade ou perfilamento.</P>
        </Section>

        <Section title="5. Isolamento por Instituição">
          <P>
            Os dados de cada instituição são tratados de forma completamente isolada. Nenhum usuário ou
            gestor de uma instituição tem acesso aos dados de outra, garantindo sigilo absoluto entre as
            escolas cadastradas na plataforma.
          </P>
        </Section>

        <Section title="6. Compartilhamento com Terceiros">
          <P>
            Não vendemos, cedemos ou comercializamos seus dados pessoais. Os dados podem ser processados
            pelos seguintes prestadores de serviço tecnológico, estritamente para operação da plataforma:
          </P>
          <P>• <Text style={{ fontWeight: "600" }}>Neon Tech</Text> (banco de dados PostgreSQL — EUA);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Render</Text> (hospedagem do servidor — EUA);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Cloudinary</Text> (armazenamento de fotos — EUA);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Expo / EAS</Text> (notificações push e atualizações OTA — EUA).</P>
          <P>Todos os terceiros adotam medidas de segurança compatíveis com padrões internacionais.</P>
        </Section>

        <Section title="7. Transferência Internacional de Dados">
          <P>
            Alguns dos serviços acima operam em servidores localizados nos Estados Unidos. A transferência
            internacional ocorre com base em cláusulas contratuais padrão e políticas de privacidade
            adequadas, nos termos do art. 33 da LGPD.
          </P>
        </Section>

        <Section title="8. Segurança">
          <P>
            Adotamos as seguintes medidas técnicas de segurança:{"\n"}
            • Senhas armazenadas com hash bcrypt (irreversível);{"\n"}
            • Comunicações protegidas por TLS/HTTPS;{"\n"}
            • Autenticação por tokens JWT com expiração;{"\n"}
            • Acesso ao banco de dados restrito ao servidor da aplicação.
          </P>
        </Section>

        <Section title="9. Retenção de Dados">
          <P>
            Seus dados são mantidos enquanto sua conta estiver ativa na plataforma. Ao solicitar a exclusão
            da conta, todos os dados pessoais vinculados serão removidos permanentemente em até <Text style={{ fontWeight: "600" }}>15 dias úteis</Text>.
            Registros de ponto e históricos operacionais podem ser mantidos por até 5 anos para fins de
            auditoria institucional, conforme solicitação da instituição contratante.
          </P>
        </Section>

        <Section title="10. Seus Direitos como Titular (LGPD)">
          <P>Nos termos da LGPD, você tem direito a:</P>
          <P>• <Text style={{ fontWeight: "600" }}>Acesso:</Text> confirmar a existência e obter cópia dos seus dados;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Correção:</Text> atualizar dados incompletos, inexatos ou desatualizados pelo perfil do app;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Eliminação:</Text> solicitar a exclusão de dados desnecessários (exceto obrigações legais);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Portabilidade:</Text> solicitar seus dados em formato estruturado;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Revogação do consentimento:</Text> para dados tratados com base em consentimento (foto e GPS);</P>
          <P>• <Text style={{ fontWeight: "600" }}>Oposição:</Text> opor-se ao tratamento em casos previstos em lei;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Informação:</Text> ser informado sobre entidades com as quais seus dados são compartilhados.</P>
          <P>
            Para exercer qualquer desses direitos, entre em contato:{"\n"}
            <Text style={{ fontWeight: "600", color: Colors.primary }}>am1662847@gmail.com</Text>
          </P>
        </Section>

        <Section title="11. Alterações desta Política">
          <P>
            Esta Política pode ser atualizada periodicamente. Mudanças significativas serão comunicadas
            pelo aplicativo com antecedência mínima de 15 dias. O uso continuado após a vigência das
            alterações implica na aceitação da nova versão.
          </P>
        </Section>

        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 8 }}>
          © 2026 EducaPlay. Todos os direitos reservados.{"\n"}
          Em conformidade com a LGPD — Lei nº 13.709/2018
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
