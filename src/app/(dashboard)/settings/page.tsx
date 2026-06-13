"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Bell, Shield, User, Save, Loader2, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  
  // Mock form states
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Notification states
  const [toggles, setToggles] = useState([true, false, true]);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
    const savedToggles = localStorage.getItem("notificationToggles");
    if (savedToggles) {
      try { setToggles(JSON.parse(savedToggles)); } catch {}
    }
  }, [user]);
  
  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleNotification = (index: number) => {
    const newToggles = [...toggles];
    newToggles[index] = !newToggles[index];
    setToggles(newToggles);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateProfile(auth.currentUser!, { photoURL: base64String });
        // Force a re-render or wait for AuthContext to pick it up. We can just set a toast.
        setIsUploading(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating avatar:", error);
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "profile" && auth.currentUser && displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      } else if (activeTab === "notifications") {
        localStorage.setItem("notificationToggles", JSON.stringify(toggles));
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile Information", icon: User },
    { id: "appearance", label: "Appearance", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 max-w-6xl mx-auto w-full relative"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-secondary text-secondary-foreground px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-sans text-sm font-semibold"
          >
            <CheckCircle2 className="w-5 h-5" />
            Settings saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Platform Settings</h1>
        <p className="text-sm font-sans text-muted-foreground mt-1">Manage your account preferences, integrations, and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-sans font-semibold">{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-xl border border-border"
              >
                <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Profile Information</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                    />
                    <Button 
                      variant="outline" 
                      className="bg-accent border-border text-foreground hover:bg-muted text-xs mb-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {isUploading ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-xs font-mono text-muted-foreground">JPG, GIF or PNG. Max size of 2MB.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Display Name</label>
                    <Input 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="Operative"
                      className="bg-background border-border focus-visible:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <Input defaultValue={user?.email || ""} disabled className="bg-accent border-border text-muted-foreground opacity-70" />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </motion.div>
            )}



            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-xl border border-border"
              >
                <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Appearance</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between pb-6 border-b border-border">
                    <div>
                      <h3 className="text-sm font-sans font-semibold text-foreground">Theme Mode</h3>
                      <p className="text-xs font-sans text-muted-foreground mt-1 max-w-[80%]">Switch between the default dark hacker aesthetic and a lighter, professional interface.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={theme === 'light' ? 'default' : 'outline'} 
                        className={`text-xs ${theme !== 'light' && 'bg-accent border-border hover:bg-muted'}`}
                        onClick={() => setTheme('light')}
                      >
                        Light
                      </Button>
                      <Button 
                        variant={theme === 'dark' ? 'default' : 'outline'} 
                        className={`text-xs ${theme !== 'dark' && 'bg-accent border-border hover:bg-muted'}`}
                        onClick={() => setTheme('dark')}
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-xl border border-border"
              >
                <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Notification Preferences</h2>
                
                <div className="space-y-4 mb-8">
                  {[
                    { title: "Critical Vulnerability Alerts", desc: "Immediate email for critical infrastructure exposure." },
                    { title: "Weekly Exposure Summary", desc: "A digest of your overall digital footprint." },
                    { title: "New Login Detection", desc: "Alerts when your account is accessed from a new IP." }
                  ].map((item, i) => {
                    const isOn = toggles[i];
                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border hover:bg-background transition-colors">
                        <div>
                          <p className="text-sm font-sans font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs font-sans text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                        {/* Custom Toggle Switch */}
                        <div 
                          onClick={() => toggleNotification(i)}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${!isOn ? 'bg-muted' : 'bg-primary/30'}`}
                        >
                          <div className={`absolute top-1 bottom-1 w-4 rounded-full transition-all ${!isOn ? 'left-1 bg-muted-foreground' : 'left-7 bg-primary'}`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
