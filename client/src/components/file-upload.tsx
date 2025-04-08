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
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addAttachment = () => {
    if (!attachmentUrl.trim()) {
      toast({
        title: "Empty URL",
        description: "Please enter a valid URL to add an attachment.",
        variant: "destructive",
      });
      return;
    }

    // Check if adding more files would exceed the limit
    if (uploadedFiles.length >= maxFiles) {
      setUploadError(`You can only add a maximum of ${maxFiles} attachments.`);
      toast({
        title: "Too many attachments",
        description: `You can only add a maximum of ${maxFiles} attachments.`,
        variant: "destructive",
      });
      return;
    }
    
    // Create a file data object from the URL
    const newFile: FileData = {
      filename: attachmentUrl.split('/').pop() || 'attachment',
      originalName: attachmentUrl.split('/').pop() || 'attachment',
      path: attachmentUrl,
    };
    
    setUploadedFiles([...uploadedFiles, newFile]);
    setAttachmentUrl(''); // Clear the input field
    toast({
      title: "Attachment added",
      description: "Your attachment link has been added successfully.",
    });
  };
  
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

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
      
      {/* Attachment URL input */}
      <div className="bg-muted/30 rounded-md p-3 mb-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <Paperclip className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Add attachment links to examples, style guides, or resources
            </span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="flex-1 p-2 text-sm border rounded-md"
            />
            <Button 
              variant="secondary" 
              size="sm" 
              type="button"
              onClick={addAttachment}
              disabled={uploadedFiles.length >= maxFiles}
            >
              <Paperclip className="mr-1 h-4 w-4" />
              Add Link
            </Button>
          </div>
        </div>
      </div>
      
      {/* Display attached links */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Attachments:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/20 rounded p-2 text-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a 
                    href={file.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate max-w-[200px] text-blue-600 hover:underline"
                    title={file.path}
                  >
                    {file.originalName || file.path}
                  </a>
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
        Add links to documents you've uploaded elsewhere (Google Drive, Dropbox, etc.)
      </p>
    </div>
  );
}