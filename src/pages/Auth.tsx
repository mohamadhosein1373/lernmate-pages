import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, Languages, Sparkles } from "lucide-react";

export default function Auth() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-in-up">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 gold-glow">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-medium text-foreground mb-2">
              LinguFlow
            </h1>
            <p className="text-muted-foreground text-lg">
              Learn languages while you read
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Instant Translation</h3>
                <p className="text-sm text-muted-foreground">Tap any word to see its meaning in context</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">Context-aware translations with Gemini AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Your Google Drive</h3>
                <p className="text-sm text-muted-foreground">Read PDFs and texts directly from your Drive</p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gold-glow transition-all hover:scale-[1.02]"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing in, you agree to give LinguFlow access to your Google Drive files.
          </p>
        </div>
      </div>
    </div>
  );
}
