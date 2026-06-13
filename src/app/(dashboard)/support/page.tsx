"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, MessageSquare, Book, LifeBuoy, Server, Activity, Database, Send, X, AlertTriangle, CheckCircle2, Loader2, ChevronDown, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { submitSupportTicket } from "@/lib/db";

export default function SupportPage() {
  const { user } = useAuth();
  
  // Health Status State
  const [healthData, setHealthData] = useState<any>(null);
  
  // Modals
  const [showChat, setShowChat] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello. I am the Shadow Map Support Analyst. How can I assist you with your operations today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Ping Health API every 5 seconds
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        }
      } catch (e) {
        // Silent catch
      }
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: newMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg, context: "User is on the Support Page." })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response || "I could not process that request." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection to support network lost. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await submitSupportTicket(user.uid, {
        subject: ticketSubject,
        message: ticketMessage,
        priority: ticketPriority,
      });
      setTicketSuccess(true);
      setTimeout(() => {
        setTicketSuccess(false);
        setShowTicket(false);
        setTicketSubject("");
        setTicketMessage("");
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { q: "Is my scanning data logged?", a: "By default, all exposure scans are ephemeral and encrypted in transit. They are only saved to your encrypted database if you are logged in. We do not sell or share OSINT intelligence with third parties." },
    { q: "How do I export a PDF report?", a: "Navigate to the Reports tab or open any specific Investigation. Click the 'Download' or 'Export' button to instantly generate a local PDF. Ensure the scan is fully complete first." },
    { q: "What does Deep Scan actually do?", a: "Deep Scan enables dark web scraping, extended timeout correlations, and AI-powered context aggregation. It queries breach databases and paste sites that take longer to resolve." },
    { q: "How do I add team members?", a: "Team Management is currently an Enterprise feature. If you need to upgrade your tier to add operatives to your workspace, please submit a Critical priority ticket." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col relative"
    >
      <div className="mb-10 text-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <LifeBuoy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Support Hub</h1>
        <p className="text-sm font-sans text-muted-foreground mt-2 max-w-md mx-auto">Get in touch with our security operations team, view system status, or browse our intelligence documentation.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6 w-full relative z-10">
        
        {/* Left Column - Actions */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => { setShowChat(true); setShowTicket(false); }}
              className={`glass-panel p-8 rounded-xl border transition-colors text-center group cursor-pointer ${showChat ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
            >
              <div className="w-12 h-12 rounded bg-primary/10 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Live Chat Support</h2>
              <p className="text-xs font-sans text-muted-foreground mb-6">Connect with an AI Security Analyst instantly for troubleshooting.</p>
              <Button variant="outline" className={`w-full transition-all ${showChat ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                Open Chat
              </Button>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => { setShowTicket(true); setShowChat(false); }}
              className={`glass-panel p-8 rounded-xl border transition-colors text-center group cursor-pointer ${showTicket ? 'border-secondary bg-accent' : 'border-border hover:border-secondary/50'}`}
            >
              <div className="w-12 h-12 rounded bg-secondary/10 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Submit a Ticket</h2>
              <p className="text-xs font-sans text-muted-foreground mb-6">Escalate complex issues or feature requests to human operators.</p>
              <Button variant="outline" className={`w-full transition-all ${showTicket ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-foreground group-hover:bg-secondary group-hover:text-secondary-foreground'}`}>
                Open Form
              </Button>
            </motion.div>
          </div>

          {/* Interactive Sections Area */}
          <AnimatePresence mode="wait">
            {showChat && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel border border-primary/30 rounded-xl overflow-hidden flex flex-col h-[400px]"
              >
                <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-heading font-semibold text-primary">Live Analyst Connection</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-sm font-sans ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground border border-border rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted border border-border rounded-xl rounded-tl-sm p-3 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Processing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-background border-t border-border shrink-0">
                  <form onSubmit={handleChatSubmit} className="flex gap-2 relative">
                    <Input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="bg-accent border-border flex-1 pr-10 focus-visible:ring-primary"
                      disabled={isChatLoading}
                    />
                    <Button type="submit" size="icon" disabled={!chatInput.trim() || isChatLoading} className="absolute right-1 top-1 bottom-1 h-auto bg-primary hover:bg-primary/90">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {showTicket && (
              <motion.div 
                key="ticket"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel border border-secondary/30 rounded-xl overflow-hidden p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-heading font-semibold text-foreground">Open a Support Ticket</h3>
                  <button onClick={() => setShowTicket(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {ticketSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                    <h4 className="text-lg font-heading font-semibold text-foreground">Ticket Submitted</h4>
                    <p className="text-sm font-sans text-muted-foreground mt-2">A human operative will review your request shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase text-muted-foreground">Subject</label>
                        <Input required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Brief description of the issue" className="bg-accent border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase text-muted-foreground">Priority</label>
                        <select 
                          value={ticketPriority} 
                          onChange={(e) => setTicketPriority(e.target.value)}
                          className="w-full bg-accent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
                        >
                          <option value="Low">Low (General Inquiry)</option>
                          <option value="Medium">Medium (Bug Report)</option>
                          <option value="Critical">Critical (System Outage/Security)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase text-muted-foreground">Details</label>
                      <textarea 
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Please provide any relevant details, URLs, or scan IDs..."
                        className="w-full bg-accent border border-border rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
                        <Paperclip className="w-4 h-4" /> Attach File
                      </Button>
                      <Button type="submit" disabled={isSubmitting || !user} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 min-w-[120px]">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
                      </Button>
                    </div>
                    {!user && <p className="text-xs text-destructive text-right mt-1">You must be logged in to submit a ticket.</p>}
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQs */}
          <div className="mt-4">
            <h3 className="text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-panel border border-border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-4 py-4 flex justify-between items-center hover:bg-accent transition-colors"
                  >
                    <span className="text-sm font-sans font-semibold text-foreground">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-muted/50 border-t border-border"
                      >
                        <p className="p-4 text-sm font-sans text-muted-foreground leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Status */}
        <div className="md:col-span-4">
          <div className="glass-panel p-6 rounded-xl border border-border sticky top-6">
            <h3 className="text-sm font-heading font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-4">
              <Server className="w-4 h-4" /> System Health
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Global Status</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${healthData ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-accent text-muted-foreground'}`}>
                  {healthData ? healthData.status : 'Connecting...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Ping</span>
                <span className="text-sm font-mono text-foreground">{healthData ? `${Math.round(healthData.latencyMs)}ms` : '--'}</span>
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Service Relays</span>
                
                {healthData?.services ? healthData.services.map((service: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-foreground">{service.name}</span>
                      <span className="text-green-500">{service.latency}ms</span>
                    </div>
                    <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(10, 100 - (service.latency / 2))}%` }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                )) : (
                  // Skeletons
                  [1,2,3].map(i => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-sans">
                        <div className="h-3 w-20 bg-accent rounded animate-pulse" />
                        <div className="h-3 w-8 bg-accent rounded animate-pulse" />
                      </div>
                      <div className="h-1 w-full bg-accent rounded-full animate-pulse" />
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-border">
              <a href="https://docs.shadowmap.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors group">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-sans font-semibold text-foreground">API Documentation</span>
                </div>
              </a>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
