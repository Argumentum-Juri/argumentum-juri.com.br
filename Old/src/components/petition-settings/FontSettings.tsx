
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PetitionSettings } from '@/types';

interface FontSettingsProps {
  settings: Partial<PetitionSettings>;
  onChange: (settings: Partial<PetitionSettings>) => void;
}

const FontSettings: React.FC<FontSettingsProps> = ({ settings, onChange }) => {
  const handleChange = (field: string, value: string) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="font-family">Família da Fonte</Label>
        <Select 
          value={settings.font_family} 
          onValueChange={(value) => handleChange('font_family', value)}
        >
          <SelectTrigger id="font-family">
            <SelectValue placeholder="Selecione uma fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Calibri">Calibri</SelectItem>
            <SelectItem value="Cambria">Cambria</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="font-size">Tamanho da Fonte</Label>
        <Select 
          value={settings.font_size} 
          onValueChange={(value) => handleChange('font_size', value)}
        >
          <SelectTrigger id="font-size">
            <SelectValue placeholder="Selecione um tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="11pt">11pt</SelectItem>
            <SelectItem value="12pt">12pt</SelectItem>
            <SelectItem value="13pt">13pt</SelectItem>
            <SelectItem value="14pt">14pt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="line-spacing">Espaçamento entre linhas</Label>
        <Select 
          value={settings.line_spacing} 
          onValueChange={(value) => handleChange('line_spacing', value)}
        >
          <SelectTrigger id="line-spacing">
            <SelectValue placeholder="Selecione um espaçamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1.0">Simples (1.0)</SelectItem>
            <SelectItem value="1.15">1.15</SelectItem>
            <SelectItem value="1.5">1.5</SelectItem>
            <SelectItem value="2.0">Duplo (2.0)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paragraph-indent">Recuo de Parágrafo</Label>
        <Select 
          value={settings.paragraph_indent} 
          onValueChange={(value) => handleChange('paragraph_indent', value)}
        >
          <SelectTrigger id="paragraph-indent">
            <SelectValue placeholder="Selecione um recuo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0cm">Sem recuo</SelectItem>
            <SelectItem value="1.25cm">Padrão (1,25cm)</SelectItem>
            <SelectItem value="2cm">Grande (2cm)</SelectItem>
            <SelectItem value="2.5cm">Muito grande (2,5cm)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FontSettings;
