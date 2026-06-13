"use client";

import { useState, useEffect } from "react";
import { Search, Target, AlertTriangle, Filter, Calendar, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

export default function InvestigationsPage() {
  const [history, setHistory] = useState<any[] | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadScans() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      if (firebaseScans && firebaseScans.length > 0) {
        setHistory(firebaseScans);
      } else {
        // Fallback to sessionStorage
        const stored = sessionStorage.getItem("scanHistory");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setHistory(data.length > 0 ? data : null);
            return;
          } catch {}
        }
        
        const legacy = sessionStorage.getItem("scanResults");
        if (legacy) {
          try {
             const data = JSON.parse(legacy);
             data.timestamp = new Date().toISOString();
             data.id = "INV-" + Math.floor(1000 + Math.random() * 9000);
             setHistory([data]);
             sessionStorage.setItem("scanHistory", JSON.stringify([data]));
             return;
          } catch {}
        }
        
        setHistory(null);
      }
    }
    loadScans();
  }, [user]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Just now";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  if (history === null) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 w-full max-w-[1440px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">No Investigation History</h1>
        <p className="text-base font-sans text-muted-foreground max-w-lg mb-8">
          You haven&apos;t conducted any intelligence sweeps yet. Initialize an exposure scan to analyze a target.
        </p>
        <Link href="/exposure-scanner">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-lg text-base font-heading font-semibold uppercase tracking-wide">
            Initialize Scan
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 w-full max-w-[1440px] mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Investigations</h1>
          <p className="text-sm font-sans text-muted-foreground mt-1">Review historical intelligence sweeps and findings.</p>
        </div>
        <Link href="/exposure-scanner">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            New Investigation
          </Button>
        </Link>
      </div>

      <div className="glass-panel rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-background flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search targets, IPs, or emails..." 
              className="pl-9 bg-muted border-border w-full"
            />
          </div>
          <Button variant="outline" className="w-full md:w-auto border-border bg-transparent text-muted-foreground hover:text-foreground">
            <Filter className="w-4 h-4 mr-2" /> Filter Results
          </Button>
        </div>

        <div className="divide-y divide-border">
          {history.map((scan, index) => (
            <Link key={scan.id || index} href={scan.id ? `/investigations/${scan.id}` : "/investigations/latest"} onClick={() => sessionStorage.setItem("scanResults", JSON.stringify(scan))} className="p-4 md:p-6 hover:bg-accent transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-sans font-semibold text-foreground group-hover:text-primary transition-colors">{scan.target || "Unknown Target"}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1">
                    <span className="text-primary">{scan.id}</span>
                    <span>•</span>
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {formatDate(scan.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Status</span>
                  <span className="text-xs font-sans text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Complete
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Risk</span>
                  <span className={`text-xs font-sans font-semibold flex items-center gap-1 ${scan.riskLevel === 'Critical' ? 'text-destructive' : 'text-[#ffb784]'}`}>
                    {scan.riskLevel === 'Critical' && <ShieldAlert className="w-3 h-3" />}
                    {scan.riskLevel || "Unknown"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
