// ============================================
// COMPONENTE REACT - GERADOR DE STORIES
// ============================================

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  RefreshCw, 
  Check, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Wand2,
  Save,
  Loader2
} from 'lucide-react';
import { 
  StoryGeneratorInput, 
  GeneratedSequence, 
  GeneratedStory,
  SequenceType,
  NicheType 
} from '@/engine/stories/types';
import { NICHE_TEMPLATES } from '@/engine/stories/templates';

// ============================================
// PROPS
// ============================================

interface StoryGeneratorProps {
  onGenerate: (input: StoryGeneratorInput, type: SequenceType) => Promise<GeneratedSequence>;
  onSave?: (sequence: GeneratedSequence) => void;
  isLoading?: boolean;
  userId: string;
}

// ============================================
// COMPONENT
// ============================================

export function StoryGenerator({ 
  onGenerate, 
  onSave,
  isLoading: externalLoading,
  userId 
}: StoryGeneratorProps) {
  // Estado do formulário
  const [formData, setFormData] = useState<StoryGeneratorInput>({
    userId,
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
  const [sequence, setSequence] = useState<GeneratedSequence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');

  // Lista de niches disponíveis
  const niches = Object.keys(NICHE_TEMPLATES) as NicheType[];

  // Handlers
  const handleInputChange = useCallback((field: keyof StoryGeneratorInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!formData.nicho || !formData.promessa || !formData.dorPrincipal) {
      setError('Preencha os campos obrigatórios: nicho, promessa e dor');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onGenerate(formData, sequenceType);
      setSequence(result);
      setActiveTab('stories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar stories');
    } finally {
      setLoading(false);
    }
  }, [formData, sequenceType, onGenerate]);

  const handleCopy = useCallback((story: GeneratedStory) => {
    navigator.clipboard.writeText(story.copy);
    setCopiedId(story.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    if (!sequence) return;
    
    const allCopies = sequence.stories
      .map(s => `Story ${s.ordem}: ${s.copy}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(allCopies);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  }, [sequence]);

  const handleSave = useCallback(() => {
    if (sequence && onSave) {
      onSave(sequence);
    }
  }, [sequence, onSave]);

  const handleRegenerateStory = useCallback(async (index: number) => {
    // Implementar regeneração individual
    console.log('Regenerar story', index);
  }, []);

  // Render
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Configurar Geração
            </CardTitle>
            <CardDescription>
              Preencha as informações para gerar seus stories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nicho */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nicho *</label>
              <Select 
                value={formData.nicho} 
                onValueChange={(v) => handleInputChange('nicho', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map(niche => (
                    <SelectItem key={niche} value={niche}>
                      {NICHE_TEMPLATES[niche]?.nicho.replace('_', ' ').toUpperCase() || niche}
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
                onChange={(e) => handleInputChange('produto', e.target.value)}
              />
            </div>

            {/* Promessa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Promessa *</label>
              <Input 
                placeholder="Ex: Ganhar 5mil/mês"
                value={formData.promessa}
                onChange={(e) => handleInputChange('promessa', e.target.value)}
              />
            </div>

            {/* Dor Principal */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dor Principal *</label>
              <Input 
                placeholder="Ex: Não consigo vender"
                value={formData.dorPrincipal}
                onChange={(e) => handleInputChange('dorPrincipal', e.target.value)}
              />
            </div>

            {/* Objetivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo</label>
              <Input 
                placeholder="Ex: Ter renda extra"
                value={formData.objetivo}
                onChange={(e) => handleInputChange('objetivo', e.target.value)}
              />
            </div>

            {/* Tom de Voz */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tom de Voz</label>
              <Select 
                value={formData.tomVoz} 
                onValueChange={(v) => handleInputChange('tomVoz', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direto">Direto</SelectItem>
                  <SelectItem value="emocional">Emocional</SelectItem>
                  <SelectItem value="pragmatico">Pragmático</SelectItem>
                  <SelectItem value="protector">Protetor</SelectItem>
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
                  <SelectItem value="engajamento">Engajamento (5 dias)</SelectItem>
                  <SelectItem value="aquecimento">Aquecimento (3 dias)</SelectItem>
                  <SelectItem value="venda">Venda (2 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Gerar */}
            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={loading || externalLoading}
            >
              {loading || externalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Stories
                </>
              )}
            </Button>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview / Stories Gerados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stories Gerados</CardTitle>
              {sequence && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyAll}>
                    {copiedId === 'all' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {onSave && (
                    <Button variant="outline" size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {sequence && (
              <CardDescription>
                Score de Diversidade: {sequence.scoreDiversidade}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!sequence ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                <p>Preencha o formulário e clique em gerar</p>
                <p className="text-sm">Os stories aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {sequence.stories.map((story, index) => (
                    <div 
                      key={story.id}
                      className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {story.ordem}º
                          </Badge>
                          <Badge>
                            {story.tipo}
                          </Badge>
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

                      {/* Copy */}
                      <p className="text-sm">{story.copy}</p>

                      {/* CTA */}
                      {story.cta && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">CTA:</span>
                          <span>{story.cta}</span>
                        </div>
                      )}

                      {/* Elementos */}
                      {story.elementos.length > 0 && (
                        <div className="flex gap-1">
                          {story.elementos.map(el => (
                            <Badge key={el} variant="secondary" className="text-xs">
                              {el}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Estrutura */}
                      <div className="text-xs text-muted-foreground">
                        Estrutura: {story.estruturaSintatica}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs para visualização detalhada */}
      {sequence && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="form">Formulário</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="dados">Dados Completos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <CardTitle>Visualização dos Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sequence.stories.map(story => (
                    <div 
                      key={story.id}
                      className="aspect-[9/16] bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 flex flex-col justify-between text-white"
                    >
                      <div>
                        <Badge className="bg-white/20 text-white">
                          {story.tipo}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{story.copy}</p>
                        {story.cta && (
                          <p className="text-xs opacity-80">{story.cta}</p>
                        )}
                      </div>
                      <div className="text-xs opacity-60">
                        #{story.ordem}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>Dados Completos da Sequência</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(sequence, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default StoryGenerator;
