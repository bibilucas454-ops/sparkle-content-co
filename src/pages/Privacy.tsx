import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para o Início
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Política de Privacidade</h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-12">
          Bem-vindo à Política de Privacidade do CreatorOS. Nossa prioridade é a segurança e a transparência em relação aos seus dados.
        </p>
        
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              O CreatorOS utiliza as APIs oficiais da Meta (Facebook e Instagram) para conectar contas de redes sociais de forma segura e transparente. Esta página descreve como tratamos as informações relacionadas à sua conta e uso da nossa plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">2. Dados coletados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos apenas os dados <strong>estritamente necessários</strong> para autenticação, conexão de contas e publicação de conteúdo. Isso inclui:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
              <li>Informações de perfil público (nome, foto de perfil, identificadores únicos).</li>
              <li>Tokens de acesso OAuth para as plataformas Meta (Instagram/Facebook) e TikTok.</li>
              <li>Metadados de vídeos e imagens que você escolhe publicar através da plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">3. Uso das informações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados são usados exclusivamente para a operação da plataforma CreatorOS e integração com as redes sociais autorizadas expressamente por você. 
              <strong> Para o TikTok</strong>, utilizamos os escopos de publicação para permitir que você envie vídeos e fotos diretamente do nosso dashboard para o seu perfil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">4. Compartilhamento e Armazenamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              O CreatorOS <strong>não vende, aluga ou compartilha</strong> seus dados pessoais com terceiros. 
              Tokens de acesso são armazenados de forma criptografada em nossos servidores seguros no Supabase e são usados apenas quando você solicita uma ação de publicação ou consulta de status.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">5. Exclusão de dados e Revogação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você tem total controle sobre suas informações. 
              Pode revogar o acesso do CreatorOS à sua conta TikTok ou Instagram a qualquer momento através das configurações de segurança das respectivas plataformas ou diretamente em nosso painel de "Contas Conectadas". 
              Ao desconectar uma conta, todos os tokens associados são removidos permanentemente de nossos registros.
            </p>
          </section>

          <section className="space-y-4 bg-muted/50 p-6 rounded-2xl border">
            <h2 className="text-2xl font-semibold mb-4">6. Contato</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para dúvidas adicionais sobre privacidade, tratamento de dados ou solicitações de exclusão de dados, entre em contato através do e-mail abaixo:
            </p>
            <a 
              href="mailto:ibibiano041@gmail.com" 
              className="inline-flex items-center text-primary font-medium hover:underline text-lg"
            >
              ibibiano041@gmail.com
            </a>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t flex justify-between items-center text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} CreatorOS. Todos os direitos reservados.</span>
          <span>Última atualização: março de 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
