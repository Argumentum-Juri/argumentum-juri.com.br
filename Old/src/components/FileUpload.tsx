
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/utils/formatFileSize";
import { petitionService } from "@/services";

const ACCEPTED_FILE_TYPES = {
  'image/*': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  'text/plain': [],
};

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  // Add support for petition attachments
  petitionId?: string;
  uploadType?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesChange, 
  maxFiles = 5,
  maxSizeInMB = 10,
  petitionId,
  uploadType,
  onSuccess,
  onError
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return null; // For images we'll show previews
    }
    return <FileText className="h-10 w-10 text-muted-foreground" />;
  };
  
  const getFilePreview = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    // Filter out files that are too large
    const validFiles = acceptedFiles.filter(file => file.size <= maxSizeInBytes);
    
    if (validFiles.length < acceptedFiles.length) {
      alert(`Alguns arquivos excedem o tamanho máximo de ${maxSizeInMB}MB e foram ignorados.`);
    }
    
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      alert(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      const remainingSlots = Math.max(0, maxFiles - uploadedFiles.length);
      validFiles.splice(remainingSlots);
    }
    
    // Store the actual File objects
    setUploadedFiles(prev => {
      const newFiles = [...prev, ...validFiles].slice(0, maxFiles);
      if (onFilesChange) onFilesChange(newFiles); // Pass to parent if provided
      return newFiles;
    });

    // Handle direct upload for petition attachments if petitionId is provided
    if (petitionId && uploadType === 'attachment' && validFiles.length > 0) {
      handlePetitionAttachmentUpload(validFiles[0]);
    }
  }, [uploadedFiles, onFilesChange, maxFiles, maxSizeInMB, petitionId, uploadType]);

  const handlePetitionAttachmentUpload = async (file: File) => {
    if (!petitionId || !file) return;
    
    try {
      const result = await petitionService.petitionAttachments.uploadAttachment(petitionId, file);
      
      if (result.success) {
        if (onSuccess) onSuccess();
      } else if (onError) {
        onError(new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      if (onFilesChange) onFilesChange(updatedFiles); // Pass to parent if provided
      return updatedFiles;
    });
  };

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: maxFiles - uploadedFiles.length,
    multiple: true
  });

  // Clean up URL objects when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          URL.revokeObjectURL(getFilePreview(file) || '');
        }
      });
    };
  }, [uploadedFiles]);

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="text-center py-4">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary animate-bounce" />
            <p className="text-primary font-medium">Solte os arquivos aqui...</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              Arraste e solte os arquivos aqui, ou clique para selecionar
            </p>
            {uploadedFiles.length < maxFiles && (
              <p className="text-xs text-muted-foreground mt-2">
                Formatos suportados: PDF, DOC, DOCX, JPG, PNG, TXT. Máximo de {maxFiles} arquivos até {maxSizeInMB}MB cada.
              </p>
            )}
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Arquivos selecionados ({uploadedFiles.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => {
              const preview = getFilePreview(file);
              
              return (
                <div key={index} className="relative flex items-center p-2 rounded-md border bg-background">
                  <div className="flex-shrink-0 mr-3 h-10 w-10 flex items-center justify-center overflow-hidden rounded bg-muted">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt={file.name}
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    {/* Add progress bar for visual feedback */}
                    <Progress
                      value={100}
                      className="h-1 mt-1"
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
