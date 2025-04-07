import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileIcon, Loader2, Paperclip, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface FileData {
  filename: string;
  originalName: string;
  path: string;
  size?: number;
  mimeType?: string;
}

interface FileUploadProps {
  uploadedFiles: FileData[];
  setUploadedFiles: (files: FileData[]) => void;
  maxFiles?: number;
  allowedFileTypes?: string[];
  className?: string;
}

export function FileUpload({
  uploadedFiles,
  setUploadedFiles,
  maxFiles = 5,
  allowedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.jpg', '.jpeg', '.png'],
  className = ''
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Check if adding more files would exceed the limit
    if (uploadedFiles.length + event.target.files.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} files.`);
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }
    
    const files = Array.from(event.target.files);
    const formData = new FormData();
    
    // Add each file to FormData
    files.forEach(file => {
      formData.append('files', file);
    });
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const response = await apiRequest("POST", "/api/upload/job-files", formData, undefined, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload files");
      }
      
      const data = await response.json();
      
      setUploadedFiles([...uploadedFiles, ...data]);
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file${files.length > 1 ? 's' : ''} uploaded.`,
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      setUploadError(error.message || "An error occurred while uploading files");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  // Generate a string of accepted file extensions for the input
  const acceptedFileTypes = allowedFileTypes.join(',');

  return (
    <div className={`border rounded-md p-4 ${className}`}>
      <h4 className="text-sm font-medium mb-3">Reference Materials (Optional)</h4>
      
      {uploadError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {/* File uploader */}
      <div className="bg-muted/30 rounded-md p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Upload className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Add files like examples, style guides, or resources
            </span>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={handleFileUpload}
              multiple
              accept={acceptedFileTypes}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              className="h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || uploadedFiles.length >= maxFiles}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Paperclip className="mr-1 h-4 w-4" />
                  {uploadedFiles.length >= maxFiles ? 'Max files reached' : 'Upload'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Display uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/20 rounded p-2 text-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate max-w-[200px]" title={file.originalName}>
                    {file.originalName}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Supported formats: PDF, DOC, DOCX, TXT, RTF, JPG, PNG (Max size: 10MB)
      </p>
    </div>
  );
}