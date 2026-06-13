"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { saveScanResult } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync guest investigations from sessionStorage to Firebase upon login
  useEffect(() => {
    if (!user) return;
    
    const syncGuestData = async () => {
      try {
        const storedHistory = sessionStorage.getItem("scanHistory");
        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          if (Array.isArray(history) && history.length > 0) {
            console.log("Syncing guest investigations to Firebase...");
            for (const scan of history) {
              const { id, ...scanData } = scan; // Remove local ID to let Firebase generate one
              await saveScanResult(user.uid, scanData);
            }
            // Clear local storage to prevent duplicate syncs
            sessionStorage.removeItem("scanHistory");
            sessionStorage.removeItem("scanResults");
            console.log("Guest investigations synced successfully.");
          }
        }
      } catch (err) {
        console.error("Failed to sync guest investigations:", err);
      }
    };
    
    syncGuestData();
  }, [user]);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      if (message.includes("invalid-credential") || message.includes("wrong-password")) {
        setError("Invalid email or password.");
      } else if (message.includes("user-not-found")) {
        setError("No account found with this email.");
      } else if (message.includes("too-many-requests")) {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Authentication failed. Please check your credentials.");
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      if (message.includes("email-already-in-use")) {
        setError("This email is already registered.");
      } else if (message.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (message.includes("invalid-email")) {
        setError("Invalid email address.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      if (message.includes("popup-closed-by-user")) {
        // User closed the popup, not an error
        return;
      }
      setError("Google sign-in failed. Please try again.");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      setError("Failed to sign out.");
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      if (message.includes("user-not-found")) {
        setError("No account found with this email.");
      } else if (message.includes("invalid-email")) {
        setError("Invalid email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signIn, signUp, signInWithGoogle, logout, resetPassword, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
