"use client";

import { useState, useEffect } from "react";
import { Target, Filter, AlertTriangle, Globe, Code, Phone, ZoomIn, ZoomOut, Maximize, ArrowLeft, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { getScanById } from "@/lib/db";

interface Finding {
  id: number;
  severity: string;
  title: string;
  description: string;
  source: string;
  category: string;
  timestamp: string;
  remediation: string;
}

interface ScanReport {
  target: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  findings: Finding[];
  exposedData: {
    emails: string[];
    domains: string[];
    socialProfiles: string[];
    breaches: string[];
    leakedCredentials: number;
    exposedDocuments: number;
  };
  attackPaths: {
    name: string;
    steps: string[];
    likelihood: string;
    impact: string;
  }[];
  recommendations: string[];
}

export default function InvestigationResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<{role: string; text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const id = params?.id as string;
      if (!id) return;
      
      // Backward compatibility check
      if (id === "latest") {
        const stored = sessionStorage.getItem("scanResults");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setReport(data);
            if (data.findings?.length > 0) {
              setSelectedFinding(data.findings[0]);
            }
          } catch { }
        }
        return;
      }
      
      // Fetch from Firebase
      const data = await getScanById(id);
      if (data) {
        setReport(data as any);
        if (data.findings?.length > 0) {
          setSelectedFinding(data.findings[0]);
        }
      } else {
        // Fallback to scanHistory if Firebase is unavailable
        const storedHistory = sessionStorage.getItem("scanHistory");
        if (storedHistory) {
          try {
            const historyData = JSON.parse(storedHistory);
            const found = historyData.find((scan: any) => scan.id === id);
            if (found) {
              setReport(found);
              if (found.findings?.length > 0) {
                setSelectedFinding(found.findings[0]);
              }
              return;
            }
          } catch { }
        }
        
        // Also check scanResults as a last resort
        const stored = sessionStorage.getItem("scanResults");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.id === id) {
              setReport(data);
              if (data.findings?.length > 0) {
                setSelectedFinding(data.findings[0]);
              }
            }
          } catch { }
        }
      }
    }
    loadData();
  }, [params?.id]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const message = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: report ? { target: report.target, riskScore: report.riskScore, findings: report.findings?.slice(0, 3) } : null,
        }),
      });

      if (!response.ok) {
        throw new Error("API Quota Exceeded");
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: data.response || data.error || "No response" }]);
    } catch {
      setChatMessages((prev) => [...prev, { 
        role: "ai", 
        text: "Based on the exposure data, I recommend isolating the affected infrastructure immediately. (Note: AI is currently running in offline mock mode due to API rate limits)." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "text-destructive border-destructive/30 bg-destructive/10";
      case "high": return "text-[#ffb784] border-[#ffb784]/30 bg-[#ffb784]/10";
      case "medium": return "text-secondary border-secondary/30 bg-secondary/10";
      case "low": return "text-primary border-primary/30 bg-primary/10";
      default: return "text-muted-foreground border-border bg-accent";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-destructive border-destructive";
    if (score >= 60) return "text-[#ffb784] border-[#ffb784]";
    if (score >= 40) return "text-secondary border-secondary";
    return "text-primary border-primary";
  };

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-sans text-muted-foreground">Loading investigation results...</p>
        <Link href="/exposure-scanner" className="text-xs font-mono text-primary hover:text-primary/80 mt-4">
          ← Return to Scanner
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col h-full min-h-0 w-full overflow-hidden bg-background relative"
    >
      {/* Top Header */}
      <header className="h-auto md:h-20 border-b border-border bg-[#0B101A] flex flex-col md:flex-row items-start md:items-center justify-between px-6 shrink-0 z-10 py-4">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/exposure-scanner")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-secondary" />
              <h1 className="text-2xl font-heading font-semibold text-foreground tracking-tight">{report.target}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                {report.riskLevel}
              </span>
              <span className="text-white/20">|</span>
              <span>{report.findings?.length || 0} Findings</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            AI Copilot
          </button>
          <div className="flex items-center gap-4 bg-background border border-border rounded-lg p-2 px-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-wider">Overall Risk</span>
              <span className={`font-mono text-xs ${getRiskColor(report.riskScore)}`}>{report.riskLevel}</span>
            </div>
            <div className={`w-12 h-12 rounded bg-[#070B14] border flex items-center justify-center shadow-lg ${getRiskColor(report.riskScore)}`}>
              <span className={`text-2xl font-heading font-bold ${getRiskColor(report.riskScore)}`}>{report.riskScore}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Side: Findings Feed */}
        <section className="w-full md:w-[400px] flex flex-col border-r border-border bg-background/50 shrink-0 relative z-10 h-1/2 md:h-full">
          <div className="p-4 border-b border-border flex items-center justify-between bg-background">
            <h3 className="text-[11px] font-sans font-semibold text-foreground tracking-widest uppercase">
              Discovered Findings ({report.findings?.length || 0})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {report.findings?.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => setSelectedFinding(finding)}
                  className={`group relative p-6 border-b border-border hover:bg-accent transition-all cursor-pointer ${
                    selectedFinding?.id === finding.id ? "bg-accent" : "bg-accent"
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${
                    selectedFinding?.id === finding.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity ${
                    finding.severity === "critical" ? "bg-destructive" : 
                    finding.severity === "high" ? "bg-[#ffb784]" : 
                    finding.severity === "medium" ? "bg-secondary" : "bg-primary"
                  }`}></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest gap-1 ${getSeverityColor(finding.severity)}`}>
                      <AlertTriangle className="w-3 h-3" /> {finding.severity}
                    </span>
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {new Date(finding.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-sans font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{finding.title}</h4>
                  <p className="text-xs font-sans text-muted-foreground mb-4 line-clamp-2">{finding.description}</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono bg-accent inline-flex px-2 py-1 rounded border border-border">
                    <Globe className="w-3 h-3" />
                    {finding.source}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Side: Finding Details */}
        <section className="flex-1 relative bg-background overflow-y-auto flex flex-col h-1/2 md:h-full custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedFinding ? (
              <motion.div 
                key={selectedFinding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <div className={`inline-flex items-center px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest gap-1.5 mb-4 ${getSeverityColor(selectedFinding.severity)}`}>
                <AlertTriangle className="w-4 h-4" /> {selectedFinding.severity} SEVERITY
              </div>
              
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">{selectedFinding.title}</h2>
              <p className="text-sm font-sans text-muted-foreground mb-8 leading-relaxed">{selectedFinding.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Source</div>
                  <div className="text-sm font-mono text-foreground">{selectedFinding.source}</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Category</div>
                  <div className="text-sm font-mono text-foreground capitalize">{selectedFinding.category?.replace("_", " ")}</div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                <h3 className="text-sm font-heading font-semibold text-primary mb-2">Recommended Remediation</h3>
                <p className="text-sm font-sans text-muted-foreground leading-relaxed">{selectedFinding.remediation}</p>
              </div>

              {/* Attack Paths */}
              {report.attackPaths && report.attackPaths.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Attack Paths Identified</h3>
                  {report.attackPaths.map((path, i) => (
                    <div key={i} className="bg-background border border-border rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-sans font-semibold text-foreground">{path.name}</h4>
                        <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
                          path.impact === "critical" ? "text-destructive bg-destructive/10" : 
                          path.impact === "high" ? "text-[#ffb784] bg-[#ffb784]/10" : "text-secondary bg-secondary/10"
                        }`}>{path.impact} impact</span>
                      </div>
                      <div className="relative border-l border-border ml-2 space-y-3">
                        {path.steps.map((step, j) => (
                          <div key={j} className="relative pl-6">
                            <div className={`absolute w-3 h-3 rounded-full bg-black border -left-[7px] top-1 ${
                              path.impact === "critical" ? "border-destructive" : 
                              path.impact === "high" ? "border-[#ffb784]" : "border-secondary"
                            }`}></div>
                            <p className="text-xs font-sans text-muted-foreground">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && report.recommendations.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-4">AI Recommendations</h3>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-accent rounded-lg border border-border">
                        <span className="text-xs font-mono text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-sm font-sans text-muted-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-full">
                <p className="text-sm font-sans text-muted-foreground">Select a finding to view details</p>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* AI Copilot Chat Panel */}
        {chatOpen && (
          <aside className="relative right-0 top-0 bottom-0 w-full md:w-[380px] shrink-0 bg-[#0B101A]/98 backdrop-blur-xl border-l border-border z-30 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-heading font-semibold text-foreground">AI Security Copilot</h3>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-primary/30 mx-auto mb-3" />
                  <p className="text-xs font-sans text-muted-foreground">Ask the AI about this investigation&apos;s findings, risks, or remediation steps.</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-4 rounded-lg text-sm font-sans shadow-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border border-primary/20"
                      : "bg-[#111827]/90 text-muted-foreground border border-border backdrop-blur-md"
                  }`}>
                    {msg.role === "user" ? (
                       <pre className="whitespace-pre-wrap font-sans text-sm font-medium">{msg.text}</pre>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold text-foreground mt-3 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold text-foreground mt-2 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            code: ({node, className, children, ...props}: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match && !String(children).includes('\n');
                              return isInline ? (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-border" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <div className="rounded-lg overflow-hidden my-3 border border-border bg-[#0B101A]">
                                  <div className="bg-accent px-3 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-border flex items-center">
                                    {match ? match[1] : 'code'}
                                  </div>
                                  <pre className="p-3 overflow-x-auto">
                                    <code className="text-xs font-mono text-primary/90" {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                </div>
                              );
                            }
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent border border-border p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about findings..."
                  className="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </motion.div>
  );
}
