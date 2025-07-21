import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, File } from "lucide-react";

interface FileUploadProps {
  onFileContent: (content: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({ onFileContent, className, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
      alert('Please upload a text file (.txt) or PDF file (.pdf)');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      onFileContent(result.text);
      setUploadedFile(file.name);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [onFileContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled, isUploading]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    onFileContent('');
  }, [onFileContent]);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-200",
        isDragging ? "border-primary-400 bg-primary-50" : "border-slate-300",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled && !isUploading) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={handleDrop}
    >
      {uploadedFile ? (
        <div className="flex items-center justify-center space-x-3">
          {uploadedFile.endsWith('.pdf') ? (
            <File className="h-8 w-8 text-red-600" />
          ) : (
            <FileText className="h-8 w-8 text-green-600" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-slate-700">{uploadedFile}</p>
            <p className="text-xs text-green-600">
              {uploadedFile.endsWith('.pdf') ? 'PDF parsed successfully' : 'File uploaded successfully'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <Upload className={cn("h-8 w-8", isUploading ? "animate-pulse text-primary-500" : "text-slate-400")} />
          <div>
            <p className="text-sm font-medium text-slate-600">
              {isUploading ? "Processing file..." : "Drop your resume here"}
            </p>
            <p className="text-xs text-slate-500">Supports .txt and .pdf files</p>
          </div>
          <div>
            <input
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={disabled || isUploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
