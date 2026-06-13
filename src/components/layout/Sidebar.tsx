"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";
import { 
  Radar, 
  Search, 
  Network, 
  History, 
  Lock, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut,
  LayoutDashboard,
  User
} from "lucide-react";

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [hasAttackPathBadge, setHasAttackPathBadge] = useState(false);
  const [hasTimelineBadge, setHasTimelineBadge] = useState(false);
  const [findingsCount, setFindingsCount] = useState(0);

  useEffect(() => {
    async function checkLatestScan() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      let latestData = null;
      if (firebaseScans && firebaseScans.length > 0) {
        latestData = firebaseScans[0];
      } else {
        const stored = sessionStorage.getItem("scanResults");
        if (stored) {
          try { latestData = JSON.parse(stored); } catch {}
        }
      }
      
      if (latestData && latestData.findings && latestData.findings.length > 0) {
        const scanId = String(latestData.id || latestData.timestamp);
        
        // Mark as viewed if we are currently on the page
        if (pathname?.includes('/investigations')) {
          sessionStorage.setItem('viewed_investigations', scanId);
        }
        if (pathname?.includes('/attack-paths')) {
          sessionStorage.setItem('viewed_attack_paths', scanId);
        }
        if (pathname?.includes('/timeline')) {
          sessionStorage.setItem('viewed_timeline', scanId);
        }

        // Check view status
        const viewedInv = sessionStorage.getItem('viewed_investigations') === scanId;
        const viewedPaths = sessionStorage.getItem('viewed_attack_paths') === scanId;
        const viewedTime = sessionStorage.getItem('viewed_timeline') === scanId;

        setFindingsCount(viewedInv ? 0 : latestData.findings.length);
        setHasAttackPathBadge(!viewedPaths);
        setHasTimelineBadge(!viewedTime);
      } else {
        setFindingsCount(0);
        setHasAttackPathBadge(false);
        setHasTimelineBadge(false);
      }
    }
    checkLatestScan();
  }, [user, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const navItemClass = (href: string) =>
    isActive(href)
      ? "flex items-center gap-4 bg-primary/10 text-primary border-l-2 border-primary px-6 py-2 transition-all translate-x-1 duration-200"
      : "flex items-center gap-4 text-muted-foreground px-6 py-2 hover:bg-accent hover:text-foreground transition-all";

  return (
    <aside className="flex flex-col h-screen left-0 w-64 bg-sidebar border-r border-sidebar-border py-6 z-10">
      {/* Header */}
      <div className="px-6 mb-8">
        <Link href="/overview" className="block mb-4">
          <h1 className="text-xl font-heading font-semibold text-primary">Shadow Map</h1>
        </Link>
        <Link href="/exposure-scanner">
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2 px-4 rounded flex items-center justify-center text-sm font-sans">
            New Scan
          </button>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul className="flex flex-col space-y-1">
          <li>
            <Link href="/overview" className={navItemClass("/overview")} onClick={onCloseMobile}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-sans font-semibold">Overview</span>
            </Link>
          </li>
          <li>
            <Link href="/investigations" className={navItemClass("/investigations")} onClick={onCloseMobile}>
              <Search className="w-5 h-5 shrink-0" />
              <div className="flex flex-1 items-center justify-between pr-2">
                <span className="text-sm font-sans">Investigations</span>
                {findingsCount > 0 && (
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0">
                    {findingsCount}
                  </span>
                )}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/exposure-scanner" className={navItemClass("/exposure-scanner")} onClick={onCloseMobile}>
              <Radar className="w-5 h-5" />
              <span className="text-sm font-sans">Exposure Scanner</span>
            </Link>
          </li>
          <li>
            <Link href="/real-time-scanner" className={navItemClass("/real-time-scanner")} onClick={onCloseMobile}>
              <Search className="w-5 h-5" />
              <span className="text-sm font-sans">Real-Time Scanner</span>
            </Link>
          </li>
          <li>
            <Link href="/attack-paths" className={navItemClass("/attack-paths")} onClick={onCloseMobile}>
              <Network className="w-5 h-5 shrink-0" />
              <div className="flex flex-1 items-center justify-between pr-4">
                <span className="text-sm font-sans">Attack Paths</span>
                {hasAttackPathBadge && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0"></span>}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/timeline" className={navItemClass("/timeline")} onClick={onCloseMobile}>
              <History className="w-5 h-5 shrink-0" />
              <div className="flex flex-1 items-center justify-between pr-4">
                <span className="text-sm font-sans">Timeline</span>
                {hasTimelineBadge && <span className="w-2 h-2 rounded-full bg-[#ffb784] animate-pulse shrink-0"></span>}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={navItemClass("/privacy")} onClick={onCloseMobile}>
              <Lock className="w-5 h-5" />
              <span className="text-sm font-sans">Privacy Center</span>
            </Link>
          </li>
          <li>
            <Link href="/reports" className={navItemClass("/reports")} onClick={onCloseMobile}>
              <FileText className="w-5 h-5" />
              <span className="text-sm font-sans">Reports</span>
            </Link>
          </li>
          <li>
            <Link href="/settings" className={navItemClass("/settings")} onClick={onCloseMobile}>
              <Settings className="w-5 h-5" />
              <span className="text-sm font-sans">Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer Links */}
      <div className="mt-auto px-6 pt-6 border-t border-sidebar-border">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 px-2 py-3 mb-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans text-foreground truncate">{user.displayName || "Operative"}</p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <ul className="flex flex-col space-y-1">
          <li>
            <Link href="/support" className="flex items-center gap-4 text-muted-foreground px-2 py-2 hover:bg-accent hover:text-foreground transition-all rounded" onClick={onCloseMobile}>
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-sans">Support</span>
            </Link>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 text-muted-foreground px-2 py-2 hover:bg-destructive/10 hover:text-destructive transition-all rounded w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-sans">Sign Out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
