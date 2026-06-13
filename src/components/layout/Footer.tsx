"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-background w-full bottom-0 border-t border-white/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-16 max-w-[1440px] mx-auto">
        <motion.div
          className="col-span-1 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="text-xl font-heading font-bold text-foreground mb-4">ShadowMap</div>
          <p className="text-sm font-sans text-muted-foreground max-w-sm">
            © 2026 ShadowMap Technologies. All rights reserved.
          </p>
        </motion.div>
        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h4 className="text-xs font-mono font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Legal</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="#" className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </motion.div>
        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h4 className="text-xs font-mono font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Resources</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="#" className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">
                Security
              </Link>
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.footer>
  );
}
