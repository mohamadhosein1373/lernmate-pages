import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LINGUFLOW_FOLDER_NAME = "LinguFlow Imports";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, fileId, fileName, mimeType, fileContent } = await req.json();

    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Helper to get or create LinguFlow folder
    async function getOrCreateFolder(): Promise<string> {
      // Search for existing folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${LINGUFLOW_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        { headers }
      );
      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create folder if not exists
      const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: LINGUFLOW_FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      const createData = await createResponse.json();
      return createData.id;
    }

    switch (action) {
      case "list": {
        console.log("Listing files from Google Drive");
        
        // List PDF and text files
        const query = encodeURIComponent(
          "(mimeType='application/pdf' or mimeType='text/plain') and trashed=false"
        );
        
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,thumbnailLink,webViewLink)&orderBy=modifiedTime desc`,
          { headers }
        );
        
        if (!response.ok) {
          const error = await response.text();
          console.error("Drive API error:", error);
          throw new Error(`Drive API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Found ${data.files?.length || 0} files`);

        return new Response(JSON.stringify({ files: data.files || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload": {
        console.log("Uploading file to Google Drive:", fileName);
        
        const folderId = await getOrCreateFolder();
        
        // Decode base64 content
        const binaryContent = Uint8Array.from(atob(fileContent), (c) => c.charCodeAt(0));

        // Create file metadata
        const metadata = {
          name: fileName,
          parents: [folderId],
          mimeType: mimeType,
        };

        // Create multipart form data
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelimiter = "\r\n--" + boundary + "--";

        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: " + mimeType + "\r\n" +
          "Content-Transfer-Encoding: base64\r\n\r\n" +
          fileContent +
          closeDelimiter;

        const uploadResponse = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink",
          {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "multipart/related; boundary=" + boundary,
            },
            body: multipartRequestBody,
          }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text();
          console.error("Upload error:", error);
          throw new Error(`Upload error: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        console.log("File uploaded successfully:", uploadData.id);

        return new Response(JSON.stringify({ file: uploadData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "download": {
        console.log("Downloading file from Google Drive:", fileId);
        
        // Get file metadata first
        const metaResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`,
          { headers }
        );
        
        if (!metaResponse.ok) {
          throw new Error(`Failed to get file metadata: ${metaResponse.status}`);
        }
        
        const metadata = await metaResponse.json();
        
        // Download file content
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers }
        );

        if (!downloadResponse.ok) {
          const error = await downloadResponse.text();
          console.error("Download error:", error);
          throw new Error(`Download error: ${downloadResponse.status}`);
        }

        // For PDFs, return as base64
        if (metadata.mimeType === "application/pdf") {
          const arrayBuffer = await downloadResponse.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          return new Response(
            JSON.stringify({ 
              content: base64, 
              mimeType: metadata.mimeType,
              name: metadata.name 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // For text files, return as text
        const textContent = await downloadResponse.text();
        return new Response(
          JSON.stringify({ 
            content: textContent, 
            mimeType: metadata.mimeType,
            name: metadata.name 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error("Google Drive function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
