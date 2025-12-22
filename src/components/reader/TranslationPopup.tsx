import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVocabulary } from "@/hooks/useVocabulary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X,
  BookPlus,
  Loader2,
  Check,
} from "lucide-react";

interface TranslationPopupProps {
  word: string;
  contextSentence: string | null;
  position: { x: number; y: number };
  fileId: string;
  fileName: string;
  onClose: () => void;
}

interface Translation {
  wordTranslation: string;
  sentenceTranslation?: string | null;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  notes?: string | null;
}

export function TranslationPopup({
  word,
  contextSentence,
  position,
  fileId,
  fileName,
  onClose,
}: TranslationPopupProps) {
  const { addWord } = useVocabulary();
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranslation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke("translate", {
          body: {
            word,
            contextSentence,
          },
        });

        if (error) throw error;
        setTranslation(data);
      } catch (err: any) {
        console.error("Translation error:", err);
        setError("Failed to translate. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [word, contextSentence]);

  const handleSave = async () => {
    if (!translation) return;
    
    setSaving(true);
    const result = await addWord(
      word,
      translation.wordTranslation,
      contextSentence,
      translation.sentenceTranslation || null,
      fileId,
      fileName
    );
    setSaving(false);
    
    if (result) {
      setSaved(true);
    }
  };

  // Calculate position to keep popup on screen
  const left = Math.min(position.x, window.innerWidth - 350);
  const top = Math.min(position.y + 10, window.innerHeight - 300);

  return (
    <div
      className="fixed z-50 animate-fade-in"
      style={{ left, top }}
    >
      <Card className="w-80 p-4 shadow-2xl border-border/50 glass">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-xl font-medium text-foreground">
              {word}
            </h3>
            {translation?.partOfSpeech && (
              <Badge variant="secondary" className="mt-1">
                {translation.partOfSpeech}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : translation ? (
          <div className="space-y-3">
            {/* Translation */}
            <div>
              <p className="text-2xl font-medium text-primary" dir="rtl">
                {translation.wordTranslation}
              </p>
              {translation.pronunciation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {translation.pronunciation}
                </p>
              )}
            </div>

            {/* Sentence Translation */}
            {translation.sentenceTranslation && contextSentence && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Context:</p>
                <p className="text-sm text-foreground/80 italic">"{contextSentence}"</p>
                <p className="text-sm text-primary/80 mt-2" dir="rtl">
                  {translation.sentenceTranslation}
                </p>
              </div>
            )}

            {/* Notes */}
            {translation.notes && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {translation.notes}
              </p>
            )}
          </div>
        ) : null}

        {/* Save Button */}
        {!loading && translation && (
          <Button
            className="w-full mt-4"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <BookPlus className="h-4 w-4 mr-2" />
            )}
            {saved ? "Saved!" : "Save to Vocabulary"}
          </Button>
        )}
      </Card>
    </div>
  );
}
