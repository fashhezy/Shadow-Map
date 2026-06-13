"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-xl w-full relative">
      <Link href="/login" className="absolute top-4 left-4 md:top-6 md:left-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-sans transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>
      
      <div className="text-center mb-8 mt-6">
        <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Reset Password</h1>
        <p className="text-sm font-sans text-muted-foreground">Enter your email to receive a recovery link.</p>
      </div>

      {/* Error Display */}
      {error && !isSuccess && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-sans text-destructive flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive shrink-0"></span>
          {error}
        </div>
      )}

      {/* Success Display */}
      <AnimatePresence>
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground">Email Sent</h2>
            <p className="text-sm font-sans text-muted-foreground">
              Check <strong>{email}</strong> for instructions to reset your password.
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              variant="outline" 
              className="mt-4 bg-transparent border-white/10 text-muted-foreground hover:text-foreground"
            >
              Try another email
            </Button>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
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

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-primary text-primary-foreground font-sans font-semibold text-sm py-6 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
