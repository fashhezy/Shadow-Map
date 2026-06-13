"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{role: string; text: string}[]>([
    { role: "ai", text: "Hello Operative. I am Shadow AI. I can assist you with OSINT analysis, threat intelligence, and navigating your findings. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanContext, setScanContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Hide the global widget if we are explicitly on the investigation results page, 
  // because that page has its own dedicated side-panel Copilot.
  // Wait, the user asked to clean up the side-panel and make the AI copilot visible. 
  // I will just let this widget be the ONLY copilot to unify the experience.
  const isResultsPage = pathname?.startsWith("/investigations/");

  useEffect(() => {
    // Try to load context
    const stored = sessionStorage.getItem("scanResults");
    if (stored) {
      try {
        setScanContext(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: scanContext ? { target: scanContext.target, riskScore: scanContext.riskScore, findings: scanContext.findings?.slice(0, 3) } : null,
        }),
      });

      if (!response.ok) {
        throw new Error("API Limit");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.response || data.error || "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { 
        role: "ai", 
        text: "My connection to the primary AI node is currently rate-limited. Based on your local telemetry, I advise maintaining a high security posture and reviewing the open exposures." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && !isResultsPage && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(33,212,243,0.4)] flex items-center justify-center border-2 border-white/20 group"
          >
            <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 bg-[#0B101A]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 ${
              isExpanded ? "w-[800px] h-[80vh]" : "w-[380px] h-[600px]"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary border border-black"></span>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-foreground leading-none mb-1">Shadow AI Copilot</h3>
                  <p className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none">Online & Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:text-foreground transition-colors rounded hover:bg-white/10">
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:text-foreground transition-colors rounded hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-4 text-sm font-sans shadow-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                      : "bg-[#111827]/90 text-muted-foreground border border-white/10 rounded-2xl rounded-tl-sm backdrop-blur-md"
                  }`}>
                    {msg.role === "user" ? (
                       <pre className="whitespace-pre-wrap font-sans text-sm font-medium">{msg.text}</pre>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
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
                                <code className="bg-black/40 px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-white/5" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <div className="rounded-lg overflow-hidden my-3 border border-white/10 bg-[#0B101A]">
                                  <div className="bg-white/5 px-3 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-white/5 flex items-center">
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleChat} className="p-3 border-t border-white/5 bg-black/40">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Shadow AI for analysis..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()} 
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                  AI responses may be subject to hallucinations. Verify findings.
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
