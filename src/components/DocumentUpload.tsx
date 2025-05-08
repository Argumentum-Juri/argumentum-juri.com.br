import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, File } from 'lucide-react';
import { petitionService } from "@/services";
import { Progress } from "@/components/ui/progress";

interface DocumentUploadProps {
  petitionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => string;
  maxSize?: number;
  acceptedFileTypes?: string[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ petitionId, onSuccess, onError, maxSize, acceptedFileTypes }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const simulateProgress = () => {
    // Simula o progresso do upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 95) {
        clearInterval(interval);
        progress = 95;
      }
      setUploadProgress(progress);
    }, 300);

    return () => clearInterval(interval);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    const stopSimulation = simulateProgress();
    
    try {
      const result = await petitionService.petitionDocuments.uploadDocument(petitionId, selectedFile);
      
      if (result.success) {
        setUploadProgress(100);
        onSuccess();
      } else {
        onError(result.error);
      }
    } catch (error) {
      onError(error);
    } finally {
      stopSimulation();
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input 
          ref={fileInputRef}
          type="file" 
          onChange={handleFileChange} 
          disabled={uploading}
          className="flex-1"
        />
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>Enviando...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}%</p>
        </div>
      )}
      
      {selectedFile && (
        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
          <File className="h-4 w-4 text-muted-foreground" />
          <span>{selectedFile.name}</span>
          <span className="text-muted-foreground ml-auto">
            {Math.round(selectedFile.size / 1024)} KB
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
