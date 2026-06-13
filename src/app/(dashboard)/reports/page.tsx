"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";
import { jsPDF } from "jspdf";

export default function ReportsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function loadScans() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      if (firebaseScans && firebaseScans.length > 0) {
        setHasData(true);
        setHistory(firebaseScans);
      } else {
        const stored = sessionStorage.getItem("scanHistory");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setHasData(data.length > 0);
            setHistory(data.length > 0 ? data : []);
            return;
          } catch {}
        }
        
        const legacy = sessionStorage.getItem("scanResults");
        if (legacy) {
          try {
             const data = JSON.parse(legacy);
             setHasData(true);
             setHistory([data]);
             return;
          } catch {}
        }
        
        setHasData(false);
        setHistory([]);
      }
    }
    loadScans();
  }, [user]);

  const handleDownloadPDF = (scan: any) => {
    const doc = new jsPDF();
    
    // Header & Title
    doc.setFontSize(22);
    doc.setTextColor(90, 34, 139);
    doc.text("Intelligence Exposure Report", 20, 20);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(90, 34, 139);
    doc.line(20, 25, 190, 25);
    
    // Metadata block
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Target: ${scan.target}`, 20, 35);
    doc.text(`Date Scanned: ${new Date(scan.timestamp).toLocaleString()}`, 20, 42);
    doc.text(`Risk Score: ${scan.riskScore}/100 (${scan.riskLevel})`, 20, 49);
    doc.text(`Total Findings: ${scan.findings?.length || 0}`, 20, 56);
    
    // Summary block
    doc.setFontSize(14);
    doc.setTextColor(10, 10, 10);
    doc.text("Summary", 20, 70);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitSummary = doc.splitTextToSize(scan.summary || "No summary available.", 170);
    doc.text(splitSummary, 20, 77);
    
    let yPos = 77 + (splitSummary.length * 5) + 10;
    
    // Findings Section
    doc.setFontSize(16);
    doc.setTextColor(211, 47, 47);
    doc.text("Discovered Findings", 20, yPos);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 12;
    
    if (scan.findings && scan.findings.length > 0) {
      scan.findings.forEach((finding: any) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`> ${finding.title} [${finding.severity?.toUpperCase()}]`, 20, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const desc = doc.splitTextToSize(finding.description, 160);
        doc.text(desc, 25, yPos);
        yPos += (desc.length * 5) + 6;
      });
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("No critical findings discovered during this scan.", 20, yPos);
    }
    
    doc.save(`ShadowMap_Report_${scan.id || 'export'}.pdf`);
  };

  if (hasData === null) return null;

  if (!hasData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 w-full max-w-[1440px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">No Intelligence Reports</h1>
        <p className="text-base font-sans text-muted-foreground max-w-lg mb-8">
          You haven&apos;t generated any executive summaries or technical reports. Run a scan to create a report.
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
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 max-w-6xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Intelligence Reports</h1>
          <p className="text-sm font-sans text-muted-foreground mt-1">Download and share generated investigation summaries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-background text-muted-foreground hover:text-foreground">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <FileText className="w-4 h-4 mr-2" /> Generate New
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="p-4 text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-widest">Report Title</th>
                <th className="p-4 text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-widest">Date Generated</th>
                <th className="p-4 text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-widest">Type</th>
                <th className="p-4 text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-widest">Size</th>
                <th className="p-4 text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((scan, i) => (
                <motion.tr 
                  key={scan.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="border-b border-border hover:bg-accent transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-sans font-semibold text-foreground group-hover:text-primary transition-colors">
                        Intelligence Report: {scan.target}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(scan.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest border ${
                      scan.riskLevel === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {scan.riskLevel}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    {scan.findings?.length || 0} Findings
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      onClick={() => handleDownloadPDF(scan)}
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
