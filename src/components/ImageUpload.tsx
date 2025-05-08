
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, maxImages = 5 }) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > maxImages) {
      alert(`Você pode enviar no máximo ${maxImages} imagens.`);
      return;
    }

    // Create preview URLs for the UI
    const newImagePreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    
    // Store the actual File objects
    setImageFiles(prev => [...prev, ...acceptedFiles].slice(0, maxImages));
    
    // Store the preview URLs for display
    setUploadedImages(prevImages => {
      const combinedImages = [...prevImages, ...newImagePreviews];
      return combinedImages.slice(0, maxImages);
    });
    
    // Pass the preview URLs to the parent component
    onImagesChange([...uploadedImages, ...newImagePreviews].slice(0, maxImages));
  }, [uploadedImages, onImagesChange, maxImages]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: maxImages - uploadedImages.length,
    multiple: true
  });

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prevImages => {
      const updatedImages = prevImages.filter((_, index) => index !== indexToRemove);
      return updatedImages;
    });
    
    setImageFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      return updatedFiles;
    });
    
    onImagesChange(uploadedImages.filter((_, index) => index !== indexToRemove));
  };

  // Clean up URL objects when component unmounts
  useEffect(() => {
    return () => {
      uploadedImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedImages]);

  return (
    <div>
      <div 
        {...getRootProps()}
        className="relative border-2 border-dashed rounded-md p-4 cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-muted-foreground">Arraste as imagens aqui...</p>
        ) : (
          <div className="text-center">
            <Upload className="h-6 w-6 inline-block mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Arraste e solte as imagens aqui, ou clique para selecionar arquivos
            </p>
            {uploadedImages.length < maxImages && (
              <p className="text-xs text-muted-foreground mt-1">
                Formatos suportados: JPG, PNG, GIF. Máximo de {maxImages} imagens.
              </p>
            )}
          </div>
        )}
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative">
              <img 
                src={image} 
                alt={`Imagem ${index + 1}`} 
                className="w-full h-32 object-cover rounded-md" 
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 bg-background/50 hover:bg-background/80 text-muted-foreground"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
