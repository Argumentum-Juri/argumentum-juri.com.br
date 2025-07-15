
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Wand2 } from 'lucide-react';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: (content: string) => void;
  onGenerate?: () => void;
  isSaving?: boolean;
  isGenerating?: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  content,
  onChange,
  onSave,
  onGenerate,
  isSaving = false,
  isGenerating = false,
}) => {
  const handleSave = () => {
    onSave(content);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Editor de Documento</h2>
        <div className="flex space-x-2">
          {onGenerate && (
            <Button 
              variant="outline"
              onClick={onGenerate}
              disabled={isGenerating || isSaving}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Gerar Documento
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
        </div>
      </div>
      
      <Textarea 
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[500px] font-mono"
        placeholder="Digite ou gere o conteúdo do documento aqui..."
      />
    </div>
  );
};
