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
          Última atualização: janeiro de 2025
        </Text>

        <P>
          A sua privacidade é muito importante para o{" "}
          <Text style={{ fontWeight: "700", color: Colors.primary }}>EducaPlay</Text>. Esta política descreve
          como coletamos, usamos, armazenamos e protegemos as suas informações pessoais.
        </P>

        <Section title="1. Dados Coletados">
          <P>Ao utilizar o EducaPlay, coletamos as seguintes informações:</P>
          <P>• <Text style={{ fontWeight: "600" }}>Dados de cadastro:</Text> nome, e-mail, instituição de ensino, cargo e matérias lecionadas;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Dados de uso:</Text> cronogramas, horários de aulas e disponibilidades registradas;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Dados do dispositivo:</Text> token de notificação push para envio de alertas;</P>
          <P>• <Text style={{ fontWeight: "600" }}>Foto de perfil:</Text> caso você opte por adicionar uma imagem.</P>
        </Section>

        <Section title="2. Finalidade do Uso">
          <P>Utilizamos seus dados para:</P>
          <P>• Criar e gerenciar sua conta no aplicativo;</P>
          <P>• Exibir e gerenciar cronogramas e horários de aulas;</P>
          <P>• Enviar notificações relacionadas ao uso do app;</P>
          <P>• Melhorar continuamente a experiência do usuário;</P>
          <P>• Garantir a segurança e integridade da plataforma.</P>
        </Section>

        <Section title="3. Compartilhamento de Dados">
          <P>
            Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins
            comerciais. Seus dados podem ser compartilhados somente com outros usuários da mesma
            instituição (por exemplo, supervisores vendo dados de professores cadastrados) dentro da
            funcionalidade normal do aplicativo.
          </P>
        </Section>

        <Section title="4. Armazenamento e Segurança">
          <P>
            Suas informações são armazenadas em servidores seguros. Utilizamos criptografia para proteger
            senhas e adotamos boas práticas de segurança para proteger seus dados contra acessos não
            autorizados.
          </P>
          <P>
            Senhas são armazenadas de forma criptografada (hash) e nunca em texto simples. Nenhum
            colaborador nosso tem acesso à sua senha.
          </P>
        </Section>

        <Section title="5. Seus Direitos">
          <P>Você tem direito a:</P>
          <P>• Acessar e corrigir seus dados pessoais pelo perfil do aplicativo;</P>
          <P>• Excluir sua conta e todos os dados associados a ela;</P>
          <P>• Solicitar informações sobre como seus dados são utilizados.</P>
          <P>
            Para exercer esses direitos, acesse as configurações do aplicativo ou entre em contato pelo
            suporte.
          </P>
        </Section>

        <Section title="6. Retenção de Dados">
          <P>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, todos os seus
            dados pessoais são removidos permanentemente de nossos sistemas dentro de um prazo razoável.
          </P>
        </Section>

        <Section title="7. Cookies e Tecnologias Semelhantes">
          <P>
            O EducaPlay é um aplicativo móvel e não utiliza cookies de rastreamento. Utilizamos tokens de
            autenticação (JWT) armazenados de forma segura no dispositivo para manter sua sessão ativa.
          </P>
        </Section>

        <Section title="8. Alterações nesta Política">
          <P>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas
            pelo aplicativo. O uso continuado após as alterações implica na aceitação da nova política.
          </P>
        </Section>

        <Section title="9. Contato">
          <P>
            Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato
            pela opção de suporte disponível na tela "Sobre" do aplicativo.
          </P>
        </Section>

        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 8 }}>
          © 2025 EducaPlay. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
