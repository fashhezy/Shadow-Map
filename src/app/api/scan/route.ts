import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { target } = body;
    
    if (!target) {
      return NextResponse.json({ error: "Target is required" }, { status: 400 });
    }

    target = target.split(",")[0].trim(); // Take the first target if multiple

    // Determine target type
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
    const isDomain = !isIp && !isEmail && target.includes('.');

    // Base report structure matching existing frontend expectations
    const report: any = {
      target,
      riskScore: 5, // Base score
      riskLevel: "Low",
      summary: `Real-time OSINT scan initiated for ${target}.`,
      findings: [],
      exposedData: {
        emails: [],
        domains: [],
        socialProfiles: [],
        breaches: [],
        leakedCredentials: 0,
        exposedDocuments: 0
      },
      attackPaths: [],
      recommendations: []
    };

    let targetIp = isIp ? target : null;

    // ─── DOMAIN RECONNAISSANCE ────────────────────────────────────────────────
    if (isDomain) {
      report.exposedData.domains.push(target);
      
      // 1. Resolve IP using Google DoH
      try {
        const dnsRes = await fetch(`https://dns.google/resolve?name=${target}&type=A`);
        const dnsData = await dnsRes.json();
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          targetIp = dnsData.Answer[0].data;
          report.findings.push({
            id: Date.now(),
            severity: "low",
            title: "DNS Resolution",
            description: `Resolved domain ${target} to public IP address ${targetIp}`,
            source: "Google DNS",
            category: "infrastructure",
            timestamp: new Date().toISOString(),
            remediation: "N/A - Standard behavior"
          });
        }
      } catch (e) {
        console.error("DNS Error", e);
      }

      // 2. Fetch Subdomains via crt.sh
      try {
        const crtRes = await fetch(`https://crt.sh/?q=${target}&output=json`);
        if (crtRes.ok) {
          const crtData = await crtRes.json();
          const subdomains = new Set<string>();
          crtData.slice(0, 50).forEach((entry: any) => {
             subdomains.add(entry.name_value.toLowerCase());
          });
          
          if (subdomains.size > 0) {
            report.exposedData.domains = Array.from(subdomains);
            report.riskScore += 10;
            report.findings.push({
              id: Date.now() + 1,
              severity: "medium",
              title: "Subdomain Enumeration",
              description: `Discovered ${subdomains.size} exposed subdomains in Certificate Transparency logs.`,
              source: "crt.sh",
              category: "exposure",
              timestamp: new Date().toISOString(),
              remediation: "Ensure all subdomains are actively maintained, and decommission unused or forgotten infrastructure to prevent subdomain takeover."
            });
            report.recommendations.push("Review exposed subdomains for forgotten infrastructure.");
          }
        }
      } catch (e) {
        console.error("crt.sh Error", e);
      }
    }

    // ─── INFRASTRUCTURE SCANNING (SHODAN) ───────────────────────────────────
    if (targetIp) {
      try {
        const shodanRes = await fetch(`https://internetdb.shodan.io/${targetIp}`);
        if (shodanRes.ok) {
          const shodanData = await shodanRes.json();
          
          if (shodanData.ports && shodanData.ports.length > 0) {
             const riskyPorts = shodanData.ports.some((p: number) => [22, 3389, 21, 23, 1433, 3306].includes(p));
             report.riskScore += riskyPorts ? 30 : 15;
             
             report.findings.push({
                id: Date.now() + 2,
                severity: riskyPorts ? "high" : "medium",
                title: "Exposed Services (Ports)",
                description: `Found ${shodanData.ports.length} open ports exposed to the public internet: ${shodanData.ports.join(", ")}.`,
                source: "Shodan InternetDB",
                category: "infrastructure",
                timestamp: new Date().toISOString(),
                remediation: "Close unnecessary ports using a strict firewall policy. Do not expose administrative interfaces (e.g., SSH, RDP, Databases) directly to the internet."
             });
             
             report.attackPaths.push({
               name: "Service Exploitation via Exposed Port",
               steps: [
                 "Attacker discovers IP address via external internet scanning",
                 `Attacker enumerates open ports: ${shodanData.ports.join(", ")}`,
                 "Attacker identifies running services and versions",
                 "Attacker exploits known vulnerabilities or brute-forces weak credentials on exposed services to gain initial foothold"
               ],
               likelihood: riskyPorts ? "high" : "medium",
               impact: "high"
             });
             report.recommendations.push(`Restrict public access to exposed ports on ${targetIp}. Implement a Zero Trust or VPN architecture for administrative access.`);
          }

          if (shodanData.vulns && shodanData.vulns.length > 0) {
             report.riskScore += 50;
             report.findings.push({
                id: Date.now() + 3,
                severity: "critical",
                title: "Known Vulnerabilities (CVEs)",
                description: `Identified ${shodanData.vulns.length} known CVEs associated with the exposed infrastructure. Including: ${shodanData.vulns.slice(0, 5).join(", ")}.`,
                source: "Shodan InternetDB",
                category: "infrastructure",
                timestamp: new Date().toISOString(),
                remediation: "Immediately patch the affected systems to mitigate known exploitation vectors."
             });

             report.attackPaths.push({
               name: "Direct CVE Exploitation",
               steps: [
                 `Attacker identifies exposed service with known vulnerability (e.g., ${shodanData.vulns[0]})`,
                 "Attacker utilizes publicly available exploit code (PoC)",
                 "Attacker achieves remote code execution (RCE) on the host system",
                 "Attacker establishes persistence and pivots internally"
               ],
               likelihood: "high",
               impact: "critical"
             });
             report.recommendations.push("Prioritize patching of identified CVEs immediately. Implement a Web Application Firewall (WAF) or IPS to block common exploit attempts.");
          }

          if (shodanData.hostnames && shodanData.hostnames.length > 0) {
            shodanData.hostnames.forEach((h: string) => {
              if (!report.exposedData.domains.includes(h)) {
                report.exposedData.domains.push(h);
              }
            });
          }
        }
      } catch (e) {
        console.error("Shodan Error", e);
      }
    }

    // ─── EMAIL FALLBACK ─────────────────────────────────────────────────────
    if (isEmail) {
       report.findings.push({
          id: Date.now() + 4,
          severity: "low",
          title: "Email Surface Analysis",
          description: "Notice: 100% free tier APIs do not support deep email breach scanning. Please utilize the Password Exposure checker or upgrade to PRO to query Have I Been Pwned for full email breach history.",
          source: "System",
          category: "exposure",
          timestamp: new Date().toISOString(),
          remediation: "Use the Password Exposure scanner to manually verify specific passwords associated with this email."
       });
       report.exposedData.emails.push(target);
       report.recommendations.push("Enable Multi-Factor Authentication (MFA) on all email accounts.");
    }

    // ─── FINAL AGGREGATION ──────────────────────────────────────────────────
    if (report.riskScore >= 70) report.riskLevel = "Critical";
    else if (report.riskScore >= 40) report.riskLevel = "High";
    else if (report.riskScore >= 20) report.riskLevel = "Medium";
    
    report.summary = `Real-time OSINT scan completed. Identified ${report.findings.length} verifiable findings and mapped ${report.attackPaths.length} attack vectors for target ${target}.`;

    return NextResponse.json(report);
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: "Failed to process scan request" },
      { status: 500 }
    );
  }
}
