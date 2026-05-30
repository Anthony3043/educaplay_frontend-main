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

export default function TermosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a7d44" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Termos de Uso</Text>
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
          Bem-vindo ao <Text style={{ fontWeight: "700", color: Colors.primary }}>EducaPlay</Text>. Ao utilizar
          nosso aplicativo, você concorda com os termos e condições descritos abaixo. Leia com atenção antes de
          usar.
        </P>

        <Section title="1. Aceitação dos Termos">
          <P>
            Ao acessar ou utilizar o EducaPlay, você declara ter lido, compreendido e concordado com estes
            Termos de Uso. Se não concordar com algum ponto, não utilize o aplicativo.
          </P>
        </Section>

        <Section title="2. Descrição do Serviço">
          <P>
            O EducaPlay é uma plataforma de gestão educacional voltada para professores e supervisores de
            instituições de ensino. Permite o cadastro e gerenciamento de cronogramas, horários de aulas,
            disponibilidades e comunicação interna.
          </P>
        </Section>

        <Section title="3. Cadastro e Conta">
          <P>
            Para utilizar o EducaPlay, é necessário criar uma conta fornecendo informações verdadeiras e
            atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso
            (e-mail e senha).
          </P>
          <P>
            Qualquer atividade realizada com sua conta é de sua responsabilidade. Em caso de uso não
            autorizado, entre em contato com nosso suporte imediatamente.
          </P>
        </Section>

        <Section title="4. Uso Permitido">
          <P>Você concorda em utilizar o EducaPlay somente para finalidades lícitas e de acordo com estes termos. É proibido:</P>
          <P>• Utilizar o aplicativo para fins ilegais ou não autorizados;</P>
          <P>• Tentar acessar contas de outros usuários;</P>
          <P>• Publicar conteúdo ofensivo, discriminatório ou que viole direitos de terceiros;</P>
          <P>• Tentar comprometer a segurança ou o funcionamento da plataforma.</P>
        </Section>

        <Section title="5. Propriedade Intelectual">
          <P>
            Todo o conteúdo do EducaPlay, incluindo textos, imagens, logotipos, ícones e código-fonte, é
            protegido por leis de propriedade intelectual e pertence aos seus respectivos titulares. É
            proibida a reprodução sem autorização prévia.
          </P>
        </Section>

        <Section title="6. Privacidade">
          <P>
            O uso das suas informações pessoais é regido pela nossa Política de Privacidade, disponível
            neste aplicativo. Ao utilizar o EducaPlay, você também concorda com nossa política de
            privacidade.
          </P>
        </Section>

        <Section title="7. Limitação de Responsabilidade">
          <P>
            O EducaPlay é disponibilizado "no estado em que se encontra". Não garantimos que o serviço
            estará sempre disponível, livre de erros ou ininterrupto. Não nos responsabilizamos por perdas
            de dados ou danos causados pelo uso do aplicativo.
          </P>
        </Section>

        <Section title="8. Modificações dos Termos">
          <P>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em
            vigor assim que publicadas no aplicativo. O uso continuado do EducaPlay após as alterações
            implica na aceitação dos novos termos.
          </P>
        </Section>

        <Section title="9. Encerramento de Conta">
          <P>
            Você pode encerrar sua conta a qualquer momento pelas configurações do aplicativo. Podemos
            suspender ou encerrar contas que violem estes termos sem aviso prévio.
          </P>
        </Section>

        <Section title="10. Contato">
          <P>
            Em caso de dúvidas sobre estes termos, entre em contato com nossa equipe pelo suporte
            disponível na tela "Sobre" do aplicativo.
          </P>
        </Section>

        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 8 }}>
          © 2025 EducaPlay. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
