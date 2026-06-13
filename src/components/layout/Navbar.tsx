"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const appleEase = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: appleEase }}
      className={`fixed top-0 w-full z-50 transition-all duration-700 ease-out ${
        scrolled
          ? "bg-background/70 backdrop-blur-2xl border-b border-white/8 shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className={`flex items-center w-full px-6 max-w-[1440px] mx-auto transition-all duration-500 ${scrolled ? "py-3" : "py-6"}`}>
        {/* Left: Logo */}
        <div className="flex-1 flex justify-start items-center">
          <motion.div
            className="text-2xl font-heading font-bold text-primary cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            ShadowMap
          </motion.div>
        </div>

        {/* Middle: Links */}
        <div className="hidden md:flex gap-2 items-center justify-center">
          {[
            { href: "#features", label: "Features" },
            { href: "#globe", label: "Threat Map" },
          ].map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: appleEase }}
            >
              <Link
                href={link.href}
                className="text-sm font-medium text-muted-foreground font-sans hover:text-foreground hover:bg-white/10 px-5 py-2.5 rounded-full transition-all duration-300"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right: Button */}
        <div className="flex-1 flex justify-end items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: appleEase }}
            className="hidden md:block"
          >
            <Link href="/overview">
              <Button className="bg-primary text-primary-foreground font-semibold px-6 py-6 rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95 transition-all duration-300">
                Start Investigation
              </Button>
            </Link>
          </motion.div>
          
          <button className="md:hidden text-muted-foreground ml-auto p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: appleEase }}
            className="md:hidden overflow-hidden border-t border-white/8 bg-background/95 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-4 p-6">
              <Link href="#features" className="text-muted-foreground font-sans hover:text-foreground transition-colors duration-500" onClick={() => setMobileOpen(false)}>Features</Link>
              <Link href="#globe" className="text-muted-foreground font-sans hover:text-foreground transition-colors duration-500" onClick={() => setMobileOpen(false)}>Threat Map</Link>
              <Link href="/overview" onClick={() => setMobileOpen(false)}>
                <Button className="bg-primary text-primary-foreground w-full rounded-xl">Start Investigation</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
