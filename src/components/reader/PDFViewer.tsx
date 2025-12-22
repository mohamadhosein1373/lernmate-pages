import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

interface PDFViewerProps {
  base64Content: string;
  zoom: number;
  onTextSelect: (word: string, sentence: string, event: React.MouseEvent) => void;
}

export function PDFViewer({ base64Content, zoom, onTextSelect }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageText, setPageText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setLoading(false);
      }
    };

    loadPDF();
  }, [base64Content]);

  // Load page text
  useEffect(() => {
    const loadPageText = async () => {
      if (!pdf) return;

      try {
        const page = await pdf.getPage(currentPage);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        setPageText(text);
      } catch (error) {
        console.error("Error loading page text:", error);
      }
    };

    loadPageText();
  }, [pdf, currentPage]);

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
      const word = selectedText.split(/\s+/)[0];
      
      // Get surrounding sentence
      const sentences = pageText.split(/[.!?]+/);
      const sentence = sentences.find((s) => s.includes(selectedText)) || selectedText;
      
      onTextSelect(word, sentence.trim(), e);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Content */}
      <div
        ref={containerRef}
        className="prose prose-invert max-w-none select-text cursor-text"
        style={{ fontSize: `${zoom}%`, lineHeight: 1.8 }}
        onMouseUp={handleTextSelection}
      >
        <div className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
          {pageText || (
            <p className="text-muted-foreground text-center py-8">
              No text content found on this page
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
