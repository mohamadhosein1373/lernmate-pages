import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVocabulary, Word, Tag } from "@/hooks/useVocabulary";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  MoreVertical,
  Trash2,
  Tag as TagIcon,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Vocabulary() {
  const { user, loading: authLoading } = useAuth();
  const { words, tags, loading, fetchWords, deleteWord, addTagToWord, removeTagFromWord } = useVocabulary();
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

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

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(search.toLowerCase()) ||
      word.translation?.toLowerCase().includes(search.toLowerCase());
    
    const matchesTag =
      filterTag === "all" || word.tags?.some((t) => t.id === filterTag);
    
    return matchesSearch && matchesTag;
  });

  const handleTagChange = (value: string) => {
    setFilterTag(value);
    if (value === "all") {
      fetchWords();
    } else {
      fetchWords(value);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-display font-medium text-foreground">Vocabulary</h1>
            <p className="text-muted-foreground mt-1">
              {words.length} words saved
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-full sm:w-48">
                <TagIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || "#F59E0B" }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Words List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredWords.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {search || filterTag !== "all" ? "No matching words" : "No words yet"}
              </h3>
              <p className="text-muted-foreground">
                {search || filterTag !== "all"
                  ? "Try adjusting your search or filter"
                  : "Start reading and save translations to build your vocabulary"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWords.map((word) => (
                <Card key={word.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-medium text-foreground">
                          {word.word}
                        </h3>
                        <span className="text-lg text-primary" dir="rtl">
                          {word.translation}
                        </span>
                      </div>
                      {word.context_sentence && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{word.context_sentence}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {word.tags?.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="gap-1"
                            style={{ 
                              backgroundColor: `${tag.color}20`,
                              color: tag.color || undefined 
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setSelectedWord(word)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add tag
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add tag to "{word.word}"</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 mt-4">
                              {tags.map((tag) => {
                                const hasTag = word.tags?.some((t) => t.id === tag.id);
                                return (
                                  <Button
                                    key={tag.id}
                                    variant={hasTag ? "secondary" : "outline"}
                                    className="w-full justify-start"
                                    onClick={() => {
                                      if (hasTag) {
                                        removeTagFromWord(word.id, tag.id);
                                      } else {
                                        addTagToWord(word.id, tag.id);
                                      }
                                    }}
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: tag.color || "#F59E0B" }}
                                    />
                                    {tag.name}
                                    {hasTag && <span className="ml-auto text-xs">✓</span>}
                                  </Button>
                                );
                              })}
                              {tags.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No tags yet. Create some in the Tags page!
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {word.source_file_name && (
                          <span>From: {word.source_file_name}</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(word.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteWord(word.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
