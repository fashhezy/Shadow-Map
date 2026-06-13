"use client";

import { Database, UserSearch, Check, Gavel, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

export default function PrivacyGuardianPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [optOutStatus, setOptOutStatus] = useState<Record<string, "none" | "processing" | "completed">>(() => {
    try { return JSON.parse(sessionStorage.getItem("optOuts") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    async function loadScans() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      if (firebaseScans && firebaseScans.length > 0) {
        setHistory(firebaseScans);
      } else {
        const stored = sessionStorage.getItem("scanHistory");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setHistory(data.length > 0 ? data : []);
            return;
          } catch {}
        }
        
        const legacy = sessionStorage.getItem("scanResults");
        if (legacy) {
          try {
             const data = JSON.parse(legacy);
             setHistory([data]);
             return;
          } catch {}
        }
        
        setHistory([]);
      }
    }
    loadScans();
  }, [user]);

  const requestOptOut = (brokerId: string) => {
    const newStatus = { ...optOutStatus, [brokerId]: "processing" as const };
    setOptOutStatus(newStatus);
    sessionStorage.setItem("optOuts", JSON.stringify(newStatus));
    
    // Simulate processing time
    setTimeout(() => {
      const finalStatus = { ...newStatus, [brokerId]: "completed" as const };
      setOptOutStatus(finalStatus);
      sessionStorage.setItem("optOuts", JSON.stringify(finalStatus));
    }, 3000 + Math.random() * 3000);
  };
  return (
    <div className="flex-1 overflow-y-auto relative p-6 md:p-10 w-full h-full bg-[#070b14] custom-scrollbar">
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.05)_0%,transparent_50%)]"></div>

      <div className="relative z-10 w-full">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-4xl font-heading font-semibold text-foreground mb-2">Privacy Guardian</h2>
            <p className="text-sm font-sans text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-[pulse-glow_2s_infinite]"></span>
              Continuous monitoring active. Last scan: 2 mins ago.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-transparent border border-border text-foreground font-mono text-xs py-2 px-4 rounded hover:bg-accent transition-colors">
              Export Audit Log
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          
          {/* Hero / Privacy Score Gauge */}
          <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden bg-background border border-border">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            
            <h3 className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest self-start absolute top-6 left-6">Global Privacy Index</h3>
            
            <div className="relative w-48 h-48 mt-8 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="8"></circle>
                {/* Progress Circle */}
                <circle className="animate-[fillGauge_1.5s_ease-out_forwards]" cx="50" cy="50" fill="none" r="45" stroke="#7C3AED" strokeLinecap="round" strokeWidth="8" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))', strokeDasharray: 283, strokeDashoffset: 90 }}></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-heading font-bold text-foreground">68</span>
                <span className="text-xs font-mono text-muted-foreground">/ 100</span>
              </div>
            </div>

            <div className="flex w-full justify-between mt-4 border-t border-border pt-4">
              <div className="text-center">
                <div className="text-base font-mono font-semibold text-secondary">24</div>
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Protected PII</div>
              </div>
              <div className="w-px bg-muted"></div>
              <div className="text-center">
                <div className="text-base font-mono font-semibold text-destructive">12</div>
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Exposed Nodes</div>
              </div>
            </div>
          </div>

          {/* Takedown Request Manager */}
          <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-6 flex flex-col bg-background border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-heading font-semibold text-foreground">Active Takedowns</h3>
              <a className="text-xs font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer">
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            
            <div className="space-y-4 flex-1">
              {/* Takedown Card 1 */}
              <div className="bg-background border border-border rounded-lg p-4 hover:bg-accent transition-colors border-l-2 border-l-transparent hover:border-l-primary group">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-accent flex items-center justify-center border border-border">
                      <Database className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-base font-mono font-semibold text-foreground">Acxiom Data Broker</h4>
                      <p className="text-sm font-sans text-muted-foreground">CCPA Deletion Request</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-1 rounded w-fit uppercase">Compliance Verified</span>
                </div>
                
                <div className="w-full bg-[#2c2833] rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%', boxShadow: '0 0 10px rgba(124,58,237,0.5)' }}></div>
                </div>
                
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>Sent: Oct 12</span>
                  <span>Completed: Nov 02</span>
                </div>
              </div>

              {/* Takedown Card 2 */}
              <div className="bg-background border border-border rounded-lg p-4 hover:bg-accent transition-colors border-l-2 border-l-transparent hover:border-l-secondary group relative overflow-hidden">
                {/* Active scan glow line */}
                <div className="absolute bottom-0 left-0 h-px bg-secondary/50 w-full transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.length > 0 ? history.slice(0, 4).map((scan, i) => (
                  <div key={scan.id || i} className="p-4 bg-background border border-border rounded-lg flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-sm font-sans text-foreground">{scan.target}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">Scanned {new Date(scan.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 p-6 border border-dashed border-border rounded-lg text-center">
                    <p className="text-muted-foreground text-sm">No recent search history found to scrub.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Actionable Cleanup Checklist */}
          <div className="col-span-12 lg:col-span-7 glass-panel rounded-xl p-6 bg-background border border-border">
            <h3 className="text-2xl font-heading font-semibold text-foreground mb-6">Remediation Checklist</h3>
            <div className="space-y-2">
              
              {[
                { id: "experian", name: "Experian", icon: Database, risk: "High", records: "Financial, Address History" },
                { id: "acxiom", name: "Acxiom", icon: UserSearch, risk: "Medium", records: "Demographics, Purchasing" },
                { id: "whitepages", name: "Whitepages", icon: Gavel, risk: "High", records: "Phone, Relatives, Criminal" }
              ].map((broker) => {
                const Icon = broker.icon;
                const status = optOutStatus[broker.id] || "none";
                
                return (
                  <div key={broker.id} className="p-4 bg-background rounded-lg border border-border hover:border-border transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="text-base font-heading font-semibold text-foreground group-hover:text-secondary transition-colors">{broker.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                          <span className={`${broker.risk === 'High' ? 'text-destructive' : 'text-[#ffb784]'}`}>Risk: {broker.risk}</span>
                          <span className="text-muted-foreground">&bull;</span>
                          <span className="text-muted-foreground">{broker.records}</span>
                        </div>
                      </div>
                    </div>
                    
                    {status === "none" && (
                      <button 
                        onClick={() => requestOptOut(broker.id)}
                        className="text-xs font-sans font-semibold bg-accent hover:bg-secondary/20 hover:text-secondary text-foreground px-4 py-2 rounded transition-colors w-full md:w-auto"
                      >
                        Send Opt-Out Request
                      </button>
                    )}
                    {status === "processing" && (
                      <button disabled className="text-xs font-sans font-semibold bg-secondary/10 text-secondary px-4 py-2 rounded transition-colors w-full md:w-auto flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing
                      </button>
                    )}
                    {status === "completed" && (
                      <button disabled className="text-xs font-sans font-semibold bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded transition-colors w-full md:w-auto flex items-center justify-center gap-2">
                        <Check className="w-3 h-3" /> Opt-Out Verified
                      </button>
                    )}
                  </div>
                );
              })}


            </div>
          </div>

          {/* Privacy Trend Sparkline & Mini Stats */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            {/* Trend Card */}
            <div className="glass-panel rounded-xl p-6 flex-1 flex flex-col bg-background border border-border">
              <h3 className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Score Trajectory (30 Days)</h3>
              <div className="flex-1 relative w-full h-full min-h-[120px]">
                {/* Simple SVG Sparkline */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  {/* Grid lines */}
                  <line stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="10" y2="10"></line>
                  <line stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="20" y2="20"></line>
                  <line stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="30" y2="30"></line>
                  {/* Gradient Fill under line */}
                  <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.3)"></stop>
                    <stop offset="100%" stopColor="rgba(124,58,237,0)"></stop>
                  </linearGradient>
                  <polygon fill="url(#trendGrad)" points="0,40 0,35 20,38 40,30 60,32 80,20 100,10 100,40"></polygon>
                  {/* The Line */}
                  <polyline fill="none" points="0,35 20,38 40,30 60,32 80,20 100,10" stroke="#7C3AED" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(124,58,237,0.4))' }}></polyline>
                  {/* Current Point */}
                  <circle cx="100" cy="10" fill="#fff" r="2" stroke="#7C3AED" strokeWidth="1"></circle>
                </svg>
              </div>
              <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
                <span>Score: 42</span>
                <span className="text-secondary flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +26 Pts</span>
              </div>
            </div>

            {/* Legal/Jurisdiction Notice */}
            <div className="bg-background rounded-xl p-4 border border-border border-l-2 border-l-muted-foreground">
              <div className="flex items-start gap-3">
                <Gavel className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="text-base font-mono font-semibold text-foreground mb-1">Jurisdiction Active: CCPA/CPRA</h4>
                  <p className="text-sm font-sans text-muted-foreground">Your current location (California) grants specific statutory rights. Takedown notices are being structured using relevant legal frameworks.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fillGauge {
          to { stroke-dashoffset: 90; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(6, 182, 212, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
      `}</style>
    </div>
  );
}
