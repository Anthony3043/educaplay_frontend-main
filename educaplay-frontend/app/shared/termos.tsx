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
          Última atualização: junho de 2026
        </Text>

        <P>
          Bem-vindo ao <Text style={{ fontWeight: "700", color: Colors.primary }}>EducaPlay</Text>. Ao instalar
          ou utilizar este aplicativo, você declara ter lido, compreendido e concordado integralmente com estes
          Termos de Uso. Caso não concorde com qualquer disposição, não utilize o aplicativo.
        </P>

        <Section title="1. Identificação do Serviço">
          <P>
            O <Text style={{ fontWeight: "600" }}>EducaPlay</Text> é uma plataforma digital de gestão escolar
            destinada exclusivamente a instituições de ensino contratantes. O acesso é restrito a profissionais
            (supervisores e professores) vinculados à instituição que adquiriu a licença de uso.
          </P>
        </Section>

        <Section title="2. Acesso e Credenciais">
          <P>
            O acesso ao EducaPlay é realizado mediante credenciais individuais (e-mail e senha). O usuário é
            integralmente responsável pela guarda e sigilo de suas credenciais.
          </P>
          <P>
            O cadastro de supervisores exige um <Text style={{ fontWeight: "600" }}>código institucional</Text> fornecido
            pela instituição contratante. O cadastro de professores é de responsabilidade exclusiva da supervisão da escola.
          </P>
          <P>
            É vedado compartilhar credenciais de acesso. Em caso de suspeita de uso indevido, o usuário deve
            comunicar imediatamente à supervisão da escola ou ao suporte do EducaPlay.
          </P>
        </Section>

        <Section title="3. Uso Permitido e Vedações">
          <P>O EducaPlay destina-se exclusivamente à gestão de cronogramas, registro de ponto, comunicação
          interna e administração de salas de aula. É expressamente proibido:</P>
          <P>• Utilizar o aplicativo para finalidades alheias à gestão escolar;</P>
          <P>• Tentar acessar dados de outras instituições ou contas de outros usuários;</P>
          <P>• Realizar engenharia reversa, descompilar ou modificar o aplicativo;</P>
          <P>• Inserir dados falsos ou fraudulentos no sistema;</P>
          <P>• Usar o aplicativo para disseminar conteúdo ilegal, ofensivo ou discriminatório;</P>
          <P>• Tentar comprometer a segurança, disponibilidade ou integridade da plataforma.</P>
        </Section>

        <Section title="4. Isolamento de Dados por Instituição">
          <P>
            Os dados de cada instituição contratante são armazenados e processados de forma completamente
            isolada. Nenhum usuário de uma instituição pode visualizar, acessar ou interferir nos dados de
            outra instituição cadastrada na plataforma.
          </P>
        </Section>

        <Section title="5. Coleta de Localização (GPS)">
          <P>
            O EducaPlay coleta a <Text style={{ fontWeight: "600" }}>localização geográfica</Text> do dispositivo
            exclusivamente no momento do registro de ponto. Essa informação é utilizada para verificar se o
            professor está dentro do raio de tolerância definido pela instituição.
          </P>
          <P>
            A localização não é monitorada de forma contínua e não é utilizada para nenhuma outra finalidade.
          </P>
        </Section>

        <Section title="6. Notificações Push">
          <P>
            O aplicativo pode enviar notificações para o dispositivo do usuário referentes a: ausências,
            atrasos, alterações de cronograma e registros de ponto. O usuário pode gerenciar as preferências
            de notificação nas configurações do aplicativo.
          </P>
        </Section>

        <Section title="7. Propriedade Intelectual">
          <P>
            Todo o conteúdo do EducaPlay — incluindo código-fonte, design, logotipos, ícones e textos — é
            protegido pelas leis de propriedade intelectual vigentes no Brasil. É proibida qualquer reprodução,
            distribuição ou uso comercial sem autorização expressa e prévia do titular.
          </P>
        </Section>

        <Section title="8. Disponibilidade do Serviço">
          <P>
            O EducaPlay é disponibilizado "no estado em que se encontra". Envidamos esforços para manter o
            serviço disponível continuamente, mas não garantimos disponibilidade ininterrupta. Não nos
            responsabilizamos por danos decorrentes de indisponibilidade temporária, perda de dados por falha
            de dispositivo do usuário ou uso indevido das funcionalidades.
          </P>
        </Section>

        <Section title="9. Rescisão de Acesso">
          <P>
            A supervisão da instituição pode desativar contas de professores a qualquer momento. O usuário
            pode solicitar o encerramento de sua conta nas configurações do aplicativo. Contas que violem
            estes termos podem ser suspensas sem aviso prévio.
          </P>
        </Section>

        <Section title="10. Lei Aplicável">
          <P>
            Estes Termos de Uso são regidos pela legislação brasileira. Fica eleito o foro da comarca de
            domicílio do usuário para resolução de quaisquer controvérsias decorrentes deste instrumento,
            salvo disposição contratual em contrário.
          </P>
        </Section>

        <Section title="11. Contato">
          <P>
            Em caso de dúvidas sobre estes termos, entre em contato pelo e-mail:{"\n"}
            <Text style={{ fontWeight: "600", color: Colors.primary }}>am1662847@gmail.com</Text>
          </P>
        </Section>

        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 8 }}>
          © 2026 EducaPlay. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
