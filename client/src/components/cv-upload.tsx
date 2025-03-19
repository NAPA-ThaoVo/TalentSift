import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CvUploadProps {
  onError: (message: string) => void;
}

export default function CvUpload({ onError }: CvUploadProps) {
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });

      // Use fetch directly for file upload instead of apiRequest  
      const res = await fetch("/api/cvs/upload", {
        method: "POST", 
        body: formData,
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || res.statusText);
      }

      const result = await res.json();
      
      // Show errors if any
      if (result.errors?.length > 0) {
        result.errors.forEach(({filename, error}: {filename: string, error: string}) => {
          onError(`Failed to process ${filename}: ${error}`);
        });
      }

      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cvs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cvs/search"] });
    },
    onError: (error: Error) => {
      onError(error.message);
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 20
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
        ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <div className="text-lg font-medium">
        {isDragActive ? (
          "Drop your CV here"
        ) : (
          <>
            <Button variant="link" className="text-lg">Upload your CV</Button>
            {" or drag and drop"}
          </>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        PDF or DOCX files only (max 10MB)
      </p>
      {uploadMutation.isPending && (
        <p className="text-sm text-primary mt-2">Uploading files...</p>
      )}
      <p className="text-sm text-muted-foreground mt-2">
        Upload up to 20 files at once
      </p>
      {uploadMutation.isError && (
        <p className="text-sm text-destructive mt-2">
          {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed'}
        </p>
      )}
    </div>
  );
}