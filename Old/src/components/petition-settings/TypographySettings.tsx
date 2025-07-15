
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TypographySettingsProps {
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
  paragraphIndent: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
  onLineSpacingChange: (value: string) => void;
  onParagraphIndentChange: (value: string) => void;
}

const TypographySettings: React.FC<TypographySettingsProps> = ({
  fontFamily,
  fontSize,
  lineSpacing,
  paragraphIndent,
  onFontFamilyChange,
  onFontSizeChange,
  onLineSpacingChange,
  onParagraphIndentChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fontFamily">Fonte Principal</Label>
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione uma fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Times New Roman">Times New Roman (Padrão Jurídico)</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Calibri">Calibri</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Cambria">Cambria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="fontSize">Tamanho da Fonte</Label>
          <Select value={fontSize} onValueChange={onFontSizeChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10pt</SelectItem>
              <SelectItem value="11">11pt</SelectItem>
              <SelectItem value="12">12pt</SelectItem>
              <SelectItem value="13">13pt</SelectItem>
              <SelectItem value="14">14pt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="lineSpacing">Espaçamento entre Linhas</Label>
          <Select value={lineSpacing} onValueChange={onLineSpacingChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um espaçamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Simples (1)</SelectItem>
              <SelectItem value="1.15">1,15</SelectItem>
              <SelectItem value="1.5">1,5</SelectItem>
              <SelectItem value="2">Duplo (2)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="paragraphIndent">Recuo de Parágrafo (cm)</Label>
          <Select value={paragraphIndent} onValueChange={onParagraphIndentChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um recuo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sem recuo</SelectItem>
              <SelectItem value="1">1cm</SelectItem>
              <SelectItem value="1.25">1,25cm</SelectItem>
              <SelectItem value="1.5">1,5cm</SelectItem>
              <SelectItem value="2">2cm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-4">
        <Label>Preview:</Label>
        <div 
          className="mt-2 p-4 border rounded-md"
          style={{ 
            fontFamily, 
            fontSize: `${fontSize}pt`,
            lineHeight: lineSpacing,
            textIndent: `${paragraphIndent}cm`
          }}
        >
          <p>Este é um exemplo de texto usando a fonte <strong>{fontFamily}</strong> com tamanho <strong>{fontSize}pt</strong>, espaçamento entre linhas de <strong>{lineSpacing}</strong> e recuo de parágrafo de <strong>{paragraphIndent}cm</strong>.</p>
          <p>Este parágrafo demonstra como o texto será exibido nas suas petições geradas pelo sistema.</p>
        </div>
      </div>
    </div>
  );
};

export default TypographySettings;
