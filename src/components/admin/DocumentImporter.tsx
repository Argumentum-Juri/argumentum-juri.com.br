
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Import } from "lucide-react";
import { petitionService } from "@/services";
import { DocumentUploadResult } from '@/types';
import { toast } from 'sonner';

interface DocumentImporterProps {
  petitionId: string;
  onImportSuccess?: (document: DocumentUploadResult) => void;
  label?: string;
}

const DocumentImporter: React.FC<DocumentImporterProps> = ({ 
  petitionId, 
  onImportSuccess,
  label = "Importar documento da petição"
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo para importar');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const result = await petitionService.petitionDocuments.uploadDocument(petitionId, file);
      
      if (result.success) {
        toast.success('Documento importado com sucesso!');
        setFile(null);
        if (onImportSuccess) {
          onImportSuccess(result);
        }
      } else {
        toast.error(result.error || 'Erro ao importar documento');
      }
    } catch (error) {
      console.error('Error importing document:', error);
      toast.error('Erro ao importar documento');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="grid gap-2">
        <Label htmlFor="document-import" className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id="document-import"
          type="file"
          className="cursor-pointer"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          disabled={isImporting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formatos aceitos: PDF, DOCX, DOC, TXT
        </p>
      </div>
      
      <Button 
        onClick={handleImport}
        className="w-full" 
        disabled={!file || isImporting}
        variant="secondary"
      >
        <FileUp className="mr-2 h-4 w-4" />
        {isImporting ? 'Importando...' : 'Importar Documento'}
      </Button>
    </div>
  );
};

export default DocumentImporter;
