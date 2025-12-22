import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVocabulary } from "@/hooks/useVocabulary";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Download,
  FileDown,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function Export() {
  const { user, loading: authLoading } = useAuth();
  const { words, tags, loading } = useVocabulary();
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [includeContext, setIncludeContext] = useState(true);
  const [exporting, setExporting] = useState(false);

  if (authLoading) {
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

  const filteredWords = selectedTag === "all"
    ? words
    : words.filter((w) => w.tags?.some((t) => t.id === selectedTag));

  const handleExportCSV = () => {
    if (filteredWords.length === 0) {
      toast.error("No words to export");
      return;
    }

    const headers = ["Word", "Translation", "Context", "Sentence Translation", "Tags"];
    const rows = filteredWords.map((w) => [
      w.word,
      w.translation || "",
      includeContext ? (w.context_sentence || "") : "",
      includeContext ? (w.sentence_translation || "") : "",
      w.tags?.map((t) => t.name).join(", ") || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `linguflow-vocabulary-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("CSV exported successfully!");
  };

  const handleExportAnki = async () => {
    if (filteredWords.length === 0) {
      toast.error("No words to export");
      return;
    }

    setExporting(true);

    try {
      // Create a simple text file in Anki import format
      // Front;Back format
      const ankiContent = filteredWords
        .map((w) => {
          const front = w.word;
          let back = w.translation || "";
          if (includeContext && w.context_sentence) {
            back += `\n\nContext: ${w.context_sentence}`;
            if (w.sentence_translation) {
              back += `\n${w.sentence_translation}`;
            }
          }
          return `${front}\t${back.replace(/\n/g, "<br>")}`;
        })
        .join("\n");

      const blob = new Blob([ankiContent], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `linguflow-anki-${new Date().toISOString().split("T")[0]}.txt`;
      link.click();

      toast.success("Anki file exported! Import it in Anki using File > Import");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-display font-medium text-foreground">Export</h1>
            <p className="text-muted-foreground mt-1">
              Export your vocabulary for use in other apps
            </p>
          </div>

          {/* Export Options */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Tag Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Filter by Tag
                </Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All words ({words.length})</SelectItem>
                    {tags.map((tag) => {
                      const count = words.filter((w) => 
                        w.tags?.some((t) => t.id === tag.id)
                      ).length;
                      return (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color || "#F59E0B" }}
                            />
                            {tag.name} ({count})
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeContext"
                  checked={includeContext}
                  onCheckedChange={(checked) => setIncludeContext(checked as boolean)}
                />
                <Label htmlFor="includeContext" className="text-sm">
                  Include context sentences
                </Label>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Preview</p>
                <p className="text-foreground font-medium">
                  {filteredWords.length} words will be exported
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleExportCSV}
                  disabled={loading || filteredWords.length === 0}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleExportAnki}
                  disabled={loading || exporting || filteredWords.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export for Anki
                </Button>
              </div>
            </div>
          </Card>

          {/* Anki Instructions */}
          <Card className="p-6 bg-muted/30">
            <h3 className="font-medium text-foreground mb-3">
              How to import into Anki
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Open Anki and select a deck (or create a new one)</li>
              <li>Go to File → Import</li>
              <li>Select the downloaded .txt file</li>
              <li>Set "Field separator" to Tab</li>
              <li>Make sure "Allow HTML in fields" is checked</li>
              <li>Click Import</li>
            </ol>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
