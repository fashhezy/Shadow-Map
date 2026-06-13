"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Mail, 
  AtSign, 
  Smartphone, 
  Globe, 
  BadgeIcon, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Loader2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

export default function ExposureScannerPage() {
  const router = useRouter();
  const [targetEmail, setTargetEmail] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [targetName, setTargetName] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
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

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the target string from filled fields
    const targets: string[] = [];
    const scanTypes: string[] = [];
    
    if (targetEmail) { targets.push(targetEmail); scanTypes.push("email breach analysis"); }
    if (targetUsername) { targets.push(targetUsername); scanTypes.push("social media profiling"); }
    if (targetPhone) { targets.push(targetPhone); scanTypes.push("phone number exposure"); }
    if (targetDomain) { targets.push(targetDomain); scanTypes.push("domain infrastructure analysis"); }
    if (targetName) { targets.push(targetName); scanTypes.push("identity correlation"); }
    if (deepScan) { scanTypes.push("deep forensic analysis", "dark web scanning"); }

    if (targets.length === 0) return;

    const target = targets.join(", ");

    // Store scan params in sessionStorage for the scanning page to pick up
    sessionStorage.setItem("scanTarget", target);
    sessionStorage.setItem("scanTypes", JSON.stringify(scanTypes));

    router.push("/exposure-scanner/scanning");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-full"
    >
      {/* Central Scanner Container */}
      <div className="w-full glass-panel rounded-xl p-6 md:p-10 mb-10 relative border-t border-border">
        
        {/* Status Indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-[11px] font-sans font-semibold text-secondary tracking-widest uppercase">
            AI POWERED
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">Exposure Scanner</h1>
          <p className="text-base font-sans text-muted-foreground">Initialize AI-powered deep intelligence sweep across indexed data surfaces.</p>
        </div>

        <form onSubmit={handleScan}>
          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-sans font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Target Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="target@domain.com" 
                  className="bg-background border-border pl-12 pr-4 py-6 text-base font-mono focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-sans font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Username (Handle)</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="text"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  placeholder="@username" 
                  className="bg-background border-border pl-12 pr-4 py-6 text-base font-mono focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-sans font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000" 
                  className="bg-background border-border pl-12 pr-4 py-6 text-base font-mono focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-sans font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Target Domain</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="text"
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  placeholder="target-domain.com" 
                  className="bg-background border-border pl-12 pr-4 py-6 text-base font-mono focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[11px] font-sans font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Full Name (Exact Match)</label>
              <div className="relative">
                <BadgeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="John Doe" 
                  className="bg-background border-border pl-12 pr-4 py-6 text-base font-mono focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-border pt-6 mt-4 gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="deep_scan" 
                checked={deepScan}
                onCheckedChange={(checked) => setDeepScan(checked as boolean)}
                className="border-border data-[state=checked]:bg-primary" 
              />
              <label htmlFor="deep_scan" className="text-sm font-sans text-muted-foreground cursor-pointer select-none">
                Enable deep forensic analysis (AI-enhanced)
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isScanning || (!targetEmail && !targetUsername && !targetPhone && !targetDomain && !targetName)}
              className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-lg text-base font-heading font-semibold uppercase tracking-wide flex items-center gap-2 disabled:opacity-50"
            >
              {isScanning && <Loader2 className="w-5 h-5 animate-spin" />}
              {isScanning ? "Scanning..." : "Initialize Scan"}
            </Button>
          </div>
        </form>
      </div>

      {/* Recent Scans Bento */}
      {history.length > 0 && (
        <div className="w-full">
          <h3 className="text-[11px] font-sans font-semibold text-muted-foreground mb-4 tracking-widest pl-1 uppercase">Recent Scans</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.slice(0, 3).map((scan, i) => (
              <Link key={scan.id || i} href={scan.id ? `/investigations/${scan.id}` : "/investigations/latest"} onClick={() => sessionStorage.setItem("scanResults", JSON.stringify(scan))} className={`glass-panel rounded p-4 flex flex-col gap-2 hover:bg-accent cursor-pointer transition-colors border-l-2 border-l-transparent hover:border-l-primary border-t border-t-border group`}>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-sans font-bold px-2 py-1 rounded uppercase tracking-wider ${
                    scan.riskLevel === 'Critical' ? 'text-destructive bg-destructive/10' : 'text-primary bg-primary/10'
                  }`}>
                    {scan.target?.includes("@") ? "Email" : scan.target?.includes(".") ? "Domain" : "Identity"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground opacity-70">
                    <Calendar className="w-3 h-3 inline-block mr-1" />
                    {new Date(scan.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                  </span>
                </div>
                <div className="text-base font-mono text-foreground truncate mt-1 group-hover:text-primary transition-colors">{scan.target}</div>
                <div className={`flex items-center gap-1 mt-auto pt-2 ${
                    scan.riskLevel === 'Critical' ? 'text-destructive' : 'text-[#ffb784]'
                  }`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-mono">{scan.findings?.length || 0} Findings</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
