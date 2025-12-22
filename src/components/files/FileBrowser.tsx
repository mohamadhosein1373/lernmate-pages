import { useEffect, useRef } from "react";
import { useGoogleDrive, DriveFile } from "@/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileBrowserProps {
  onFileSelect: (file: DriveFile) => void;
}

export function FileBrowser({ onFileSelect }: FileBrowserProps) {
  const { files, loading, listFiles, uploadFile } = useGoogleDrive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listFiles();
  }, [listFiles]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["application/pdf", "text/plain"].includes(file.type)) {
      return;
    }

    const uploadedFile = await uploadFile(file);
    if (uploadedFile) {
      onFileSelect(uploadedFile);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: string | undefined) => {
    if (!bytes) return "";
    const num = parseInt(bytes, 10);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-400" />;
    }
    return <FileText className="h-8 w-8 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-medium text-foreground">Your Files</h1>
          <p className="text-muted-foreground mt-1">
            PDFs and text files from your Google Drive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={listFiles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleUploadClick} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Files Grid */}
      {loading && files.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No files found
          </h3>
          <p className="text-muted-foreground mb-6">
            Upload a PDF or text file to get started
          </p>
          <Button onClick={handleUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload your first file
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
              onClick={() => onFileSelect(file)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true })}
                    </span>
                    {file.size && (
                      <span>{formatFileSize(file.size)}</span>
                    )}
                  </div>
                </div>
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
