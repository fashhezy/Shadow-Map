"use client";

import { useState } from "react";
import { Radar, Search, ShieldAlert, ShieldCheck, Server, KeyRound, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RealTimeScannerPage() {
  const [activeTab, setActiveTab] = useState<"infra" | "password">("infra");

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto min-h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 flex items-center gap-3">
          Real-Time Scanner
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Scan your infrastructure and credentials against real-world threat databases instantly. 
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab("infra")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === "infra" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Server className="w-4 h-4" />
          Infrastructure Scan 
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === "password" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Password Exposure 
        </button>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === "infra" ? <InfraScanner /> : <PasswordScanner />}
      </div>
    </div>
  );
}

// ─── Infrastructure Scanner Component ─────────────────────────────────────────

function InfraScanner() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/exposure/infra?ip=${encodeURIComponent(ip)}`);
      if (!res.ok) throw new Error("Failed to fetch infrastructure data");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during the scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-semibold mb-2">Scan Infrastructure (IP)</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Query the InternetDB to see if an IP address has open ports, exposed services, or known vulnerabilities. 
        </p>

        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g., 8.8.8.8"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button type="submit" disabled={loading || !ip} className="bg-primary text-primary-foreground py-3 h-auto rounded-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Scan IP"}
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="glass-panel p-8 rounded-2xl border border-border space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold font-mono text-foreground mb-1">{result.ip}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.hostnames?.map((h: string) => (
                  <span key={h} className="text-xs px-2 py-1 bg-accent rounded-md text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{h}</span>
                ))}
              </div>
            </div>
            
            {result.ports?.length > 0 ? (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
                <span className="font-semibold">Exposed Services Detected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold">No Exposed Services</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Open Ports</h4>
              {result.ports?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.ports.map((port: number) => (
                    <div key={port} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-mono flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Port {port}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No open ports found on this IP.</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Vulnerabilities & Tags</h4>
              <div className="flex flex-wrap gap-2">
                {result.vulns?.map((vuln: string) => (
                  <span key={vuln} className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-xs font-mono">
                    {vuln}
                  </span>
                ))}
                {result.tags?.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded text-xs font-mono">
                    {tag}
                  </span>
                ))}
                {(!result.vulns?.length && !result.tags?.length) && (
                  <p className="text-sm text-muted-foreground">No known vulnerabilities or tags.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Password Scanner Component ─────────────────────────────────────────────

function PasswordScanner() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pwned: boolean; count: number } | null>(null);

  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setResult(null);

    try {
      // 1. Hash the password using SHA-1 (Client-side only, completely secure)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-1", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

      // 2. K-Anonymity model: Send only first 5 chars to HIBP API
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) throw new Error("HIBP API failed");
      const text = await res.text();

      // 3. Check if our suffix is in the response
      const lines = text.split("\\n");
      let pwnedCount = 0;
      for (const line of lines) {
        const [lineSuffix, count] = line.split(":");
        if (lineSuffix === suffix) {
          pwnedCount = parseInt(count.trim(), 10);
          break;
        }
      }

      setResult({ pwned: pwnedCount > 0, count: pwnedCount });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-semibold mb-2">Check Password Exposure</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Securely check if a password has appeared in previous data breaches using k-anonymity. The password never leaves your browser.
        </p>

        <form onSubmit={checkPassword} className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Enter a password to test"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button type="submit" disabled={loading || !password} className="bg-primary text-primary-foreground py-3 h-auto rounded-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Security"}
          </Button>
        </form>
      </div>

      {result && (
        <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 ${
          result.pwned ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"
        }`}>
          {result.pwned ? (
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-green-500 shrink-0" />
          )}
          
          <div>
            <h3 className={`text-xl font-bold mb-1 ${result.pwned ? "text-red-400" : "text-green-400"}`}>
              {result.pwned ? "Oh no — pwned!" : "Good news — no pwnage found!"}
            </h3>
            {result.pwned ? (
              <p className="text-muted-foreground">
                This password has been seen <span className="font-bold text-foreground">{result.count.toLocaleString()}</span> times in data breaches. You should absolutely not use it for any sensitive accounts.
              </p>
            ) : (
              <p className="text-muted-foreground">
                This password wasn't found in any known data breaches. This doesn't necessarily mean it's a good password, just that it hasn't been compromised in a public leak yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
