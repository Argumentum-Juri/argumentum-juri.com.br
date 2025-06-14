
import * as React from "react"
import { FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface FileUploadProps {
  onFileSelected: (file: File) => void
  onError?: (error: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
  children?: React.ReactNode
}

export function FileUpload({
  onFileSelected,
  onError,
  accept = {
    'image/*': ['.png', '.jpeg', '.jpg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  children
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      validateAndProcessFile(files[0])
    }
  }

  const validateAndProcessFile = (file: File) => {
    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      onError?.(`O arquivo é muito grande. O tamanho máximo é ${maxSizeMB}MB.`)
      return
    }

    // Check file type
    let isAccepted = false
    const fileType = file.type

    Object.entries(accept).forEach(([mimeType, extensions]) => {
      if (mimeType.includes('*')) {
        // Handle wildcard mime types (e.g., 'image/*')
        const mimeCategory = mimeType.split('/')[0]
        if (fileType.startsWith(mimeCategory)) {
          isAccepted = true
        }
      } else if (mimeType === fileType) {
        isAccepted = true
      } else {
        // Check by extension if mime type doesn't match
        const fileName = file.name.toLowerCase()
        extensions.forEach(ext => {
          if (fileName.endsWith(ext.toLowerCase())) {
            isAccepted = true
          }
        })
      }
    })

    if (!isAccepted) {
      onError?.('Tipo de arquivo não suportado.')
      return
    }

    // If all validations pass, call the onFileSelected callback
    onFileSelected(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`relative border-2 rounded-md ${isDragging ? 'border-primary border-dashed bg-muted/50' : 'border-muted-foreground/25 border-dashed'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={Object.entries(accept)
          .flatMap(([mimeType, extensions]) => [...extensions, mimeType])
          .join(',')}
      />
      {children}
    </div>
  )
}
