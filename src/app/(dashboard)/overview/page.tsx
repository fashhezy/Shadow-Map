"use client";

import { useState, useEffect } from "react";
import { Target, AlertTriangle, Activity, Shield, ArrowRight, CheckCircle, Globe, Smartphone, Mail, Key, ArrowUp, Server } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

export default function OverviewPage() {
  const [history, setHistory] = useState<any[] | null>(null);
  const [riskScore, setRiskScore] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    async function loadScans() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      if (firebaseScans && firebaseScans.length > 0) {
        setHistory(firebaseScans);
        setRiskScore(firebaseScans[0].riskScore || 0);
      } else {
        // Fallback to sessionStorage
        const stored = sessionStorage.getItem("scanHistory");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setHistory(data.length > 0 ? data : null);
            if (data.length > 0) {
              setRiskScore(data[0].riskScore || 0);
            }
            return;
          } catch {}
        }
        
        const legacy = sessionStorage.getItem("scanResults");
        if (legacy) {
          try {
             const data = JSON.parse(legacy);
             setHistory([data]);
             setRiskScore(data.riskScore || 0);
             return;
          } catch {}
        }
        
        setHistory(null);
      }
    }
    loadScans();
  }, [user]);

  if (history === null) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 w-full max-w-[1440px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">No Active Intelligence</h1>
        <p className="text-base font-sans text-muted-foreground max-w-lg mb-8">
          Your dashboard is empty. Initialize an exposure scan to analyze digital footprints, discover vulnerabilities, and map attack vectors.
        </p>
        <Link href="/exposure-scanner">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-lg text-base font-heading font-semibold uppercase tracking-wide">
            Initialize First Scan
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
      {/* Top Header Area */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Global Overview</h1>
          <p className="text-sm font-sans text-muted-foreground mt-1">Real-time threat intelligence and exposure metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
          <div className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[11px] font-mono font-semibold text-secondary uppercase tracking-widest">Active Monitoring</span>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
        
        {/* Hero Score Card */}
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center col-span-1 md:col-span-4 min-h-[320px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-6 self-start w-full relative z-10">Latest Exposure</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            {/* Fake conic gradient for the score circle */}
            <div className="w-full h-full absolute inset-0 rounded-full" style={{ background: "conic-gradient(#7c3aed 72%, rgba(255,255,255,0.05) 0)" }}></div>
            <div className="absolute inset-[8px] bg-card rounded-full"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <span className="text-5xl font-heading font-bold text-primary leading-none">{riskScore}</span>
              <span className="text-[11px] font-sans font-semibold text-muted-foreground tracking-widest uppercase mt-2">Critical</span>
            </div>
          </div>
          
          <div className="w-full mt-6 flex justify-between items-center px-2 relative z-10 text-sm font-sans text-muted-foreground">
            <span>Change vs Last Week</span>
            <span className="text-destructive flex items-center font-medium">
              <ArrowUp className="w-4 h-4 mr-1" /> +4
            </span>
          </div>
        </div>

        {/* Risk Trend Chart */}
        <div className="glass-panel rounded-xl p-6 flex flex-col col-span-1 md:col-span-8 min-h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-heading font-semibold text-foreground">Risk Trend Analysis</h3>
            <div className="flex gap-2">
              <button className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded bg-accent">7D</button>
              <button className="text-[11px] font-sans font-semibold text-primary px-2 py-1 rounded bg-primary/20 border border-primary/30">30D</button>
              <button className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded bg-accent">90D</button>
            </div>
          </div>
          
          {/* Simulated Area Chart */}
          <div className="flex-1 relative w-full mt-2 flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-border pb-6 pl-2">
              <div className="w-full border-t border-border"></div>
              <div className="w-full border-t border-border"></div>
              <div className="w-full border-t border-border"></div>
              <div className="w-full border-t border-border"></div>
            </div>
            
            <div className="absolute bottom-6 left-2 right-0 top-0 overflow-hidden flex items-end">
              <div className="w-full h-full bg-gradient-to-t from-secondary/20 to-transparent" style={{ clipPath: "polygon(0 80%, 20% 70%, 40% 90%, 60% 50%, 80% 60%, 100% 30%, 100% 100%, 0 100%)" }}></div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline fill="none" points="0,80 20,70 40,90 60,50 80,60 100,30" stroke="#06B6D4" strokeWidth="2" style={{ filter: "drop-shadow(0px 0px 4px rgba(6, 182, 212, 0.5))" }} vectorEffect="non-scaling-stroke"></polyline>
              </svg>
            </div>
            
            <div className="absolute bottom-0 left-2 right-0 flex justify-between text-xs font-mono text-muted-foreground">
              <span>Oct 01</span>
              <span>Oct 08</span>
              <span>Oct 15</span>
              <span>Oct 22</span>
              <span>Oct 29</span>
            </div>
          </div>
        </div>

        {/* Recent Findings List */}
        <div className="glass-panel rounded-xl col-span-1 md:col-span-12 overflow-hidden mt-2">
          <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
            <h3 className="text-2xl font-heading font-semibold text-foreground">Recent Scans</h3>
            <Link href="/investigations" className="text-sm font-sans text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {history?.slice(0, 3).map((scan, i) => (
              <Link key={scan.id || i} href="/investigations/latest" onClick={() => sessionStorage.setItem("scanResults", JSON.stringify(scan))} className="p-4 md:p-6 hover:bg-accent transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${scan.riskLevel === 'Critical' ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/10 border border-primary/20'}`}>
                    <Target className={`w-5 h-5 ${scan.riskLevel === 'Critical' ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h4 className="text-base font-sans font-semibold text-foreground">{scan.target || "Unknown Target"}</h4>
                    <p className="text-xs font-mono text-muted-foreground mt-1">Found {scan.findings?.length || 0} exposure vectors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${scan.riskLevel === 'Critical' ? 'bg-destructive/20 text-destructive' : 'bg-[#ffb784]/20 text-[#ffb784]'}`}>
                    {scan.riskLevel || "High"} Risk
                  </span>
                  <span className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors">Details →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
