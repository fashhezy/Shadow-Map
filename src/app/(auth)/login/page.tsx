"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push("/overview");
    } catch {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/overview");
    } catch {
      // Error is handled in AuthContext
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-xl w-full relative">
      <Link href="/" className="absolute top-4 left-4 md:top-6 md:left-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-sans transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
      
      <div className="text-center mb-8 mt-6">
        <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Sign In</h1>
        <p className="text-sm font-sans text-muted-foreground">Welcome back to Shadow Map.</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-sans text-destructive flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive shrink-0"></span>
          {error}
        </div>
      )}

      {/* Google Sign-In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-3 px-4 text-sm font-sans text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs font-mono uppercase">
          <span className="bg-[#0F172A] px-4 text-muted-foreground tracking-widest">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            placeholder="name@example.com"
            required
            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all font-sans"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
            <Link href="/forgot-password" className="text-xs font-sans text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            placeholder="••••••••"
            required
            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all font-sans"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground font-sans font-semibold text-sm py-6 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm font-sans text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors">
          Create one
        </Link>
      </div>
    </div>
  );
}
