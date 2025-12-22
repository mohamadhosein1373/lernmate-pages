import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export function useGoogleDrive() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  const listFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast.error("Please sign in with Google to access your Drive");
        return [];
      }

      const { data, error } = await supabase.functions.invoke("google-drive", {
        body: {
          action: "list",
          accessToken: session.provider_token,
        },
      });

      if (error) throw error;
      
      setFiles(data.files || []);
      return data.files || [];
    } catch (error: any) {
      console.error("Error listing files:", error);
      toast.error("Failed to fetch files from Google Drive");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<DriveFile | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast.error("Please sign in with Google to upload files");
        return null;
      }

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("google-drive", {
        body: {
          action: "upload",
          accessToken: session.provider_token,
          fileName: file.name,
          mimeType: file.type,
          fileContent: base64,
        },
      });

      if (error) throw error;
      
      toast.success("File uploaded to Google Drive");
      await listFiles();
      return data.file;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file to Google Drive");
      return null;
    } finally {
      setLoading(false);
    }
  }, [listFiles]);

  const getFileContent = useCallback(async (fileId: string): Promise<{ content: string; mimeType: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast.error("Please sign in with Google to access files");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("google-drive", {
        body: {
          action: "download",
          accessToken: session.provider_token,
          fileId,
        },
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file from Google Drive");
      return null;
    }
  }, []);

  return {
    files,
    loading,
    listFiles,
    uploadFile,
    getFileContent,
  };
}
