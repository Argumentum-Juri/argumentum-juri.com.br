
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

interface PetitionEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSaveDraft: () => Promise<void>;
  onSendToClient: () => Promise<void>;
  onGenerateWithAI: () => Promise<void>;
  isSaving: boolean;
  isProcessing: boolean;
  isGenerating: boolean;
}

const PetitionEditor: React.FC<PetitionEditorProps> = ({
  content,
  onChange,
  onSaveDraft,
  onSendToClient,
  onGenerateWithAI,
  isSaving,
  isProcessing,
  isGenerating
}) => {
  return (
    <Card className="mb-6 border-none shadow-none">
      <div className="mb-6">
        <Button
          size="lg"
          variant="default"
          onClick={onGenerateWithAI}
          disabled={isGenerating || isSaving || isProcessing}
          className="w-full flex items-center justify-center gap-2 h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
        >
          <Sparkles className="h-6 w-6" />
          {isGenerating ? "Gerando documento com IA..." : "Gerar Documento com IA"}
        </Button>
      </div>
      <CardContent className="p-0">
        <Textarea 
          placeholder="O conteúdo gerado pela IA ou editado manualmente aparecerá aqui..."
          className="min-h-[400px] font-mono border rounded-md p-4"
          value={content}
          onChange={(e) => onChange(e.target.value)}
        />
      </CardContent>
    </Card>
  );
};

export default PetitionEditor;
