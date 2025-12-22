import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileBrowser } from "@/components/files/FileBrowser";
import { DocumentReader } from "@/components/reader/DocumentReader";
import { DriveFile } from "@/hooks/useGoogleDrive";
import { BookOpen } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        {selectedFile ? (
          <DocumentReader
            file={selectedFile}
            onBack={() => setSelectedFile(null)}
          />
        ) : (
          <FileBrowser onFileSelect={setSelectedFile} />
        )}
      </div>
    </DashboardLayout>
  );
}
