import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
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
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Termos de Uso</h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-12">
          Bem-vindo aos Termos de Uso do CreatorOS AI. É importante que você compreenda nossas diretrizes antes de utilizar a plataforma.
        </p>
        
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-border/40 pb-2">1. Aceitação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar o CreatorOS AI, você concorda em cumprir estes Termos de Uso. Caso não concorde com alguma parte destes termos, você não deve usar nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-border/40 pb-2">2. Uso da Plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              O CreatorOS AI é uma ferramenta de inteligência artificial voltada para auxílio na criação de conteúdo. O usuário é o único responsável pelo conteúdo gerado, publicado ou distribuído utilizando nossas ferramentas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-border/40 pb-2">3. Direitos de Propriedade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você retém todos os direitos sobre os conteúdos finais gerados. No entanto, o design, a interface, o código-fonte e o sistema subjacente do CreatorOS AI são de propriedade exclusiva da nossa empresa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-border/40 pb-2">4. Integrações de Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma interage com APIs de terceiros (como Instagram e YouTube). O acesso a essas redes sociais também está condicionado à aceitação dos termos de cada respectiva plataforma pelos nossos usuários. Nós não nos responsabilizamos por mudanças nas políticas dessas plataformas.
            </p>
          </section>

          <section className="space-y-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
            <h2 className="text-xl font-semibold mb-3">5. Contato e Suporte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Caso tenha dúvidas ou encontre problemas, nossa equipe de suporte está sempre à disposição.
            </p>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/40 flex justify-between items-center text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} CreatorOS AI. Todos os direitos reservados.</span>
          <span>Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

export default Terms;
