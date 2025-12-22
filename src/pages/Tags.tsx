import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVocabulary } from "@/hooks/useVocabulary";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Tags as TagsIcon,
  Plus,
  Trash2,
} from "lucide-react";

const TAG_COLORS = [
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export default function Tags() {
  const { user, loading: authLoading } = useAuth();
  const { words, tags, loading, createTag, deleteTag } = useVocabulary();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    await createTag(newTagName.trim(), newTagColor);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0]);
    setDialogOpen(false);
  };

  const getWordCount = (tagId: string) => {
    return words.filter((w) => w.tags?.some((t) => t.id === tagId)).length;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-medium text-foreground">Tags</h1>
              <p className="text-muted-foreground mt-1">
                Organize your vocabulary with tags
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagName">Name</Label>
                    <Input
                      id="tagName"
                      placeholder="e.g., Business, Travel, Food..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            newTagColor === color ? "scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTagColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                    Create Tag
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tags List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <Card className="p-12 text-center">
              <TagsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No tags yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create tags to organize your vocabulary by topic
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first tag
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: tag.color || "#F59E0B" }}
                      >
                        {tag.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{tag.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getWordCount(tag.id)} words
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete tag "{tag.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the tag from all words. The words themselves will not be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTag(tag.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
