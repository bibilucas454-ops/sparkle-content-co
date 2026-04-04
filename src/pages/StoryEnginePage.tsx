// ============================================
// PÁGINA: MINDMAX STORY ENGINE
// ============================================

import { useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNiche } from "@/contexts/NicheContext";
import { toast } from "sonner";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Save, 
  RefreshCw,
  Zap,
  Target,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Instagram
} from "lucide-react";
import type { 
  StoryGeneratorInput, 
  GeneratedSequence, 
  GeneratedStory,
  SequenceType
} from "@/engine/stories/types";
import { NICHE_TEMPLATES, NicheTemplates } from "@/engine/stories/templates";

const SEQUENCE_TYPES: { id: SequenceType; label: string; desc: string; stories: number }[] = [
  { id: 'engajamento', label: 'Engajamento', desc: 'Conectar e identificar dor', stories: 5 },
  { id: 'aquecimento', label: 'Aquecimento', desc: 'Criar desire e preparar', stories: 5 },
  { id: 'venda', label: 'Venda', desc: 'Converter e fechar', stories: 7 },
];

const TOM_VOICES = [
  { id: 'direto', label: 'Direto', desc: 'Authority sem enrolação' },
  { id: 'emocional', label: 'Emocional', desc: 'Conexão profunda' },
  { id: 'pragmatico', label: 'Pragmático', desc: 'Foco em resultados' },
  { id: 'protector', label: 'Protetor', desc: 'Mentor que guia' },
];

export default function StoryEnginePage() {
  const { user } = useAuth();
  const { niche } = useNiche();
  
  // Form state
  const [formData, setFormData] = useState<StoryGeneratorInput>({
    userId: user?.id || '',
    nicho: 'marketing_digital',
    produto: '',
    promessa: '',
    tomVoz: 'direto',
    dorPrincipal: '',
    objetivo: '',
    nivelPublico: 'intermediario',
    ctaPrincipal: 'dm'
  });
  
  const [sequenceType, setSequenceType] = useState<SequenceType>('engajamento');
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState<GeneratedSequence | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('config');

  const niches = Object.keys(NICHE_TEMPLATES) as string[];

  const handleGenerate = useCallback(async () => {
    if (!formData.nicho || !formData.promessa || !formData.dorPrincipal) {
      toast.error('Preencha: Nicho, Promessa e Dor Principal');
      return;
    }

    setLoading(true);
    setSequence(null);

    try {
      console.log('🔄 Chamando Edge Function generate-stories...');
      
      const { data, error } = await supabase.functions.invoke('generate-stories', {
        body: {
          input: {
            ...formData,
            userId: user?.id || 'anonymous'
          },
          sequenceType
        }
      });

      console.log('📥 Resposta:', { data, error });

      if (error) {
        console.error('❌ Erro da Edge Function:', error);
        console.error('❌ Error context raw:', JSON.stringify(error));
        
        // Extract real error message from Supabase SDK error wrapper
        // Note: error.context may be a Response or plain object
        let errorMessage = error.message || 'Erro ao gerar stories';
        
        // Try to parse inner error from context
        const ctx = (error as any).context;
        if (ctx) {
          try {
            // ctx might be a Response object
            if (typeof ctx.json === 'function') {
              const body = await ctx.clone().json();
              if (body?.error) errorMessage = body.error;
            } else if (ctx?.error) {
              errorMessage = ctx.error;
            }
          } catch {
            // ignore parse errors
          }
        }
        
        // Also check if data has error (some SDK versions route errors there)
        if (data?.error) errorMessage = data.error;
        
        throw new Error(errorMessage);
      }
      
      if (data?.sequence) {
        setSequence(data.sequence);
        setActiveTab('stories');
        toast.success('Stories gerados com sucesso!');
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Resposta inválida da Edge Function');
      }
    } catch (err: any) {
      console.error('❌ Erro completo:', err);
      
      let errorMessage = 'Erro ao gerar stories';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, sequenceType, user]);

  const handleCopy = useCallback((story: GeneratedStory) => {
    navigator.clipboard.writeText(story.copy);
    setCopiedId(story.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    if (!sequence) return;
    const allText = sequence.stories
      .map(s => `${s.ordem}. [${s.tipo.toUpperCase()}]\n${s.copy}\n${s.cta ? '→ ' + s.cta : ''}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  }, [sequence]);

  const handleSave = useCallback(async () => {
    if (!sequence || !user) return;

    try {
      await supabase.from('story_generations').insert([{
        user_id: user.id,
        nicho: formData.nicho,
        produto: formData.produto,
        promessa: formData.promessa,
        tom_voz: formData.tomVoz,
        dor_principal: formData.dorPrincipal,
        objetivo: formData.objetivo,
        cta_principal: formData.ctaPrincipal,
        tipo_sequence: sequenceType,
        stories: sequence.stories as any,
        score_diversidade: sequence.scoreDiversidadeTotal,
        status: sequence.status
      }]);
      toast.success('Sequência salva!');
    } catch (err) {
      toast.error('Erro ao salvar');
    }
  }, [sequence, user, formData, sequenceType]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Instagram className="h-8 w-8 text-pink-500" />
            MINDMAX Story Engine
          </h1>
          <p className="text-muted-foreground mt-2">
            Gere sequências de stories com variação infinita e validação anti-duplicação
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="stories">Stories Gerados</TabsTrigger>
          </TabsList>

          {/* TAB: CONFIGURAÇÃO */}
          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Configurar Geração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nicho */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nicho *</label>
                    <Select 
                      value={formData.nicho} 
                      onValueChange={(v) => setFormData(f => ({...f, nicho: v}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {niches.map(n => (
                          <SelectItem key={n} value={n}>
                            {NICHE_TEMPLATES[n]?.nicho.replace(/_/g, ' ').toUpperCase() || n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Produto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Produto/Serviço</label>
                    <Input 
                      placeholder="Ex: Mentoria, Curso, Consultoria"
                      value={formData.produto}
                      onChange={(e) => setFormData(f => ({...f, produto: e.target.value}))}
                    />
                  </div>

                  {/* Promessa */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Promessa *</label>
                    <Input 
                      placeholder="Ex: Ganhar 5mil/mês online"
                      value={formData.promessa}
                      onChange={(e) => setFormData(f => ({...f, promessa: e.target.value}))}
                    />
                  </div>

                  {/* Dor Principal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dor Principal *</label>
                    <Input 
                      placeholder="Ex: Não consigo vender online"
                      value={formData.dorPrincipal}
                      onChange={(e) => setFormData(f => ({...f, dorPrincipal: e.target.value}))}
                    />
                  </div>

                  {/* Objetivo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Objetivo do Público</label>
                    <Input 
                      placeholder="Ex: Ter renda extra"
                      value={formData.objetivo}
                      onChange={(e) => setFormData(f => ({...f, objetivo: e.target.value}))}
                    />
                  </div>

                  <Separator />

                  {/* Tom de Voz */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tom de Voz</label>
                    <Select 
                      value={formData.tomVoz} 
                      onValueChange={(v) => setFormData(f => ({...f, tomVoz: v as any}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOM_VOICES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div>
                              <div className="font-medium">{t.label}</div>
                              <div className="text-xs text-muted-foreground">{t.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Sequência */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Sequência</label>
                    <Select 
                      value={sequenceType} 
                      onValueChange={(v) => setSequenceType(v as SequenceType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEQUENCE_TYPES.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <span>{s.label}</span>
                              <Badge variant="outline">{s.stories} stories</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Gerar */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Sequência de Stories
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Pré-visualização</CardTitle>
                  <CardDescription>Veja o que será gerado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SEQUENCE_TYPES.map(s => (
                      <div 
                        key={s.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          sequenceType === s.id ? 'border-pink-500 bg-pink-500/10' : ''
                        }`}
                        onClick={() => setSequenceType(s.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{s.label}</h3>
                            <p className="text-sm text-muted-foreground">{s.desc}</p>
                          </div>
                          <Badge>{s.stories} stories</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: STORIES GERADOS */}
          <TabsContent value="stories">
            {!sequence ? (
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-medium">Nenhum story gerado</h3>
                <p className="text-muted-foreground">Configure e gere sua sequência de stories</p>
                <Button className="mt-4" onClick={() => setActiveTab('config')}>
                  Ir para Configuração
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>Diversidade da Sequência</CardTitle>
                      <div className="flex items-center gap-4">
                        <Badge variant={sequence.status === 'pronto' ? 'default' : 'secondary'}>
                          {sequence.status}
                        </Badge>
                        <div className={`text-2xl font-bold ${getScoreColor(sequence.scoreDiversidadeTotal)}`}>
                          {Math.round(sequence.scoreDiversidadeTotal * 100)}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={handleCopyAll}>
                        {copiedId === 'all' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                        Copiar Todos
                      </Button>
                      <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2" />
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                        <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Regenerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Stories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sequence.stories.map((story, idx) => (
                    <Card key={story.id} className="overflow-hidden">
                      {/* Preview visual do story */}
                      <div className="aspect-[9/16] bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-white/20 backdrop-blur">
                            {story.ordem}º
                          </Badge>
                          <Badge variant="outline" className="bg-white/20 border-0 text-white">
                            {story.tipo}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium line-clamp-6">{story.copy}</p>
                          {story.cta && (
                            <p className="text-xs opacity-80 bg-black/20 p-2 rounded">
                              → {story.cta}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div className="flex gap-1">
                            {story.elementos.map(el => (
                              <Badge key={el} variant="outline" className="bg-white/20 border-0 text-white text-[10px]">
                                {el}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {story.estruturaSintatica}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(story)}
                          >
                            {copiedId === story.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lista textual */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stories em Texto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {sequence.stories.map((story) => (
                          <div key={story.id} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>{story.ordem}º</Badge>
                              <Badge variant="outline">{story.tipo}</Badge>
                            </div>
                            <p className="mb-2">{story.copy}</p>
                            {story.cta && (
                              <p className="text-sm text-muted-foreground">→ {story.cta}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
