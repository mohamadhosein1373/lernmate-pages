import { useState, useEffect, useCallback } from "react";
import { useGoogleDrive, DriveFile } from "@/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TranslationPopup } from "./TranslationPopup";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";

interface DocumentReaderProps {
  file: DriveFile;
  onBack: () => void;
}

export function DocumentReader({ file, onBack }: DocumentReaderProps) {
  const { getFileContent } = useGoogleDrive();
  const [content, setContent] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const result = await getFileContent(file.id);
      if (result) {
        setContent(result.content);
        setMimeType(result.mimeType);
      }
      setLoading(false);
    };

    loadContent();
  }, [file.id, getFileContent]);

  const handleTextSelection = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
      // Get the word
      const word = selectedText.split(/\s+/)[0];
      
      // Try to get surrounding sentence
      const range = selection?.getRangeAt(0);
      const container = range?.commonAncestorContainer;
      const fullText = container?.textContent || "";
      
      // Simple sentence extraction
      const sentences = fullText.split(/[.!?]+/);
      const sentence = sentences.find((s) => s.includes(selectedText)) || selectedText;
      
      setSelectedWord(word);
      setSelectedSentence(sentence.trim());
      setPopupPosition({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const closePopup = () => {
    setSelectedWord(null);
    setSelectedSentence(null);
    setPopupPosition(null);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleResetZoom = () => setZoom(100);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-6 w-48" />
        </div>
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between sticky top-16 z-40 glass rounded-lg p-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="text-sm font-medium text-foreground truncate max-w-xs">
            {file.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card 
        className="p-8 min-h-[60vh] overflow-auto"
        onMouseUp={handleTextSelection}
      >
        {mimeType === "application/pdf" ? (
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
            <iframe
              src={`data:application/pdf;base64,${content}`}
              className="w-full h-[80vh] border-0"
              title={file.name}
            />
          </div>
        ) : (
          <div
            className="prose prose-invert max-w-none select-text"
            style={{ 
              fontSize: `${zoom}%`,
              lineHeight: 1.8,
            }}
          >
            <pre className="whitespace-pre-wrap font-sans text-foreground bg-transparent">
              {content}
            </pre>
          </div>
        )}
      </Card>

      {/* Translation Popup */}
      {selectedWord && popupPosition && (
        <TranslationPopup
          word={selectedWord}
          contextSentence={selectedSentence}
          position={popupPosition}
          fileId={file.id}
          fileName={file.name}
          onClose={closePopup}
        />
      )}

      {/* Instructions */}
      <p className="text-sm text-muted-foreground text-center">
        Select any word to see its translation
      </p>
    </div>
  );
}
