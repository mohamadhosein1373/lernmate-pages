import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Word {
  id: string;
  word: string;
  translation: string | null;
  context_sentence: string | null;
  sentence_translation: string | null;
  source_file_id: string | null;
  source_file_name: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export function useVocabulary() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWords = useCallback(async (tagId?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("words")
        .select(`
          *,
          word_tags(
            tag_id,
            tags(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to include tags
      const wordsWithTags = data?.map((word: any) => ({
        ...word,
        tags: word.word_tags?.map((wt: any) => wt.tags).filter(Boolean) || [],
      }));

      // Filter by tag if tagId provided
      if (tagId) {
        const filtered = wordsWithTags?.filter((w: Word) => 
          w.tags?.some((t) => t.id === tagId)
        );
        setWords(filtered || []);
      } else {
        setWords(wordsWithTags || []);
      }
    } catch (error: any) {
      console.error("Error fetching words:", error);
      toast.error("Failed to fetch vocabulary");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to fetch tags");
    }
  }, [user]);

  const addWord = useCallback(async (
    word: string,
    translation: string | null,
    contextSentence: string | null,
    sentenceTranslation: string | null,
    sourceFileId?: string,
    sourceFileName?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("words")
        .insert({
          user_id: user.id,
          word,
          translation,
          context_sentence: contextSentence,
          sentence_translation: sentenceTranslation,
          source_file_id: sourceFileId,
          source_file_name: sourceFileName,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Word saved to vocabulary!");
      await fetchWords();
      return data;
    } catch (error: any) {
      console.error("Error adding word:", error);
      toast.error("Failed to save word");
      return null;
    }
  }, [user, fetchWords]);

  const updateWord = useCallback(async (id: string, updates: Partial<Word>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("words")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Word updated!");
      await fetchWords();
    } catch (error: any) {
      console.error("Error updating word:", error);
      toast.error("Failed to update word");
    }
  }, [user, fetchWords]);

  const deleteWord = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Word deleted");
      await fetchWords();
    } catch (error: any) {
      console.error("Error deleting word:", error);
      toast.error("Failed to delete word");
    }
  }, [user, fetchWords]);

  const createTag = useCallback(async (name: string, color?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name,
          color: color || "#F59E0B",
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Tag created!");
      await fetchTags();
      return data;
    } catch (error: any) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
      return null;
    }
  }, [user, fetchTags]);

  const deleteTag = useCallback(async (id: string) => {
    if (!user) return;

    try {
      // Delete word_tags associations first
      await supabase.from("word_tags").delete().eq("tag_id", id);

      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Tag deleted");
      await fetchTags();
    } catch (error: any) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  }, [user, fetchTags]);

  const addTagToWord = useCallback(async (wordId: string, tagId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("word_tags")
        .insert({
          word_id: wordId,
          tag_id: tagId,
        });

      if (error) throw error;
      await fetchWords();
    } catch (error: any) {
      console.error("Error adding tag to word:", error);
      toast.error("Failed to add tag");
    }
  }, [user, fetchWords]);

  const removeTagFromWord = useCallback(async (wordId: string, tagId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("word_tags")
        .delete()
        .eq("word_id", wordId)
        .eq("tag_id", tagId);

      if (error) throw error;
      await fetchWords();
    } catch (error: any) {
      console.error("Error removing tag from word:", error);
      toast.error("Failed to remove tag");
    }
  }, [user, fetchWords]);

  useEffect(() => {
    if (user) {
      fetchWords();
      fetchTags();
    }
  }, [user, fetchWords, fetchTags]);

  return {
    words,
    tags,
    loading,
    fetchWords,
    fetchTags,
    addWord,
    updateWord,
    deleteWord,
    createTag,
    deleteTag,
    addTagToWord,
    removeTagFromWord,
  };
}
