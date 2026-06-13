"use client";

import { useState, useEffect } from "react";
import { Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

export default function TimelinePage() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function loadScans() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      if (firebaseScans && firebaseScans.length > 0) {
        const latest = firebaseScans[0];
        setHasData(latest.findings && latest.findings.length > 0);
        setFindings(latest.findings || []);
      } else {
        // Fallback to sessionStorage
        const stored = sessionStorage.getItem("scanResults");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setHasData(data.findings && data.findings.length > 0);
            setFindings(data.findings || []);
            return;
          } catch {}
        }
        setHasData(false);
        setFindings([]);
      }
    }
    loadScans();
  }, [user]);

  if (hasData === null) return null;

  if (!hasData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 w-full max-w-[1440px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">No Timeline Events</h1>
        <p className="text-base font-sans text-muted-foreground max-w-lg mb-8">
          There are no exposure events or findings to plot on the timeline. Run a scan to populate your history.
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Exposure Timeline</h1>
          <p className="text-sm font-sans text-muted-foreground mt-1">Chronological history of discovered vulnerabilities and breaches.</p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-xl border border-border relative">
        <div className="absolute top-8 bottom-8 left-12 w-[2px] bg-muted z-0 hidden md:block"></div>
        <div className="space-y-8 relative z-10">
          {findings.map((finding, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col md:flex-row gap-6 relative"
            >
              <div className="hidden md:flex flex-col items-center mt-2 w-8 shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 bg-background z-10 ${
                  finding.severity === "critical" ? "border-destructive" :
                  finding.severity === "high" ? "border-[#ffb784]" : "border-secondary"
                }`}></div>
              </div>
              
              <div className="flex-1 bg-background border border-border rounded-lg p-6 hover:bg-muted transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest gap-1.5 w-fit ${
                    finding.severity === "critical" ? "text-destructive bg-destructive/10" : 
                    finding.severity === "high" ? "text-[#ffb784] bg-[#ffb784]/10" : "text-secondary bg-secondary/10"
                  }`}>
                    {finding.severity}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(finding.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{finding.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4">{finding.description}</p>
                
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-muted-foreground">Source: <span className="text-foreground">{finding.source}</span></span>
                  <span className="text-muted-foreground">Category: <span className="text-foreground capitalize">{finding.category?.replace("_", " ")}</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
