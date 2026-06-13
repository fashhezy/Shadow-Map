"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroShader } from "@/components/features/HeroShader";
import { AttackGlobe } from "@/components/features/AttackGlobe";
import { Button } from "@/components/ui/button";
import {
  PlayCircle, Radar, Network, History, Lock, BrainCircuit,
  Globe,
} from "lucide-react";
import Link from "next/link";
import {
  motion, useScroll, useTransform, useInView, useSpring,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/* ─── Apple-style easing ─────────────────────────────────────────── */
const appleEase = [0.16, 1, 0.3, 1] as const;
const slowSpring = { stiffness: 60, damping: 20, mass: 1 };

/* ─── Scroll-reveal wrapper (Apple-style) ────────────────────────── */
function Reveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(8px)" }
      }
      transition={{ duration: 1, ease: appleEase, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Feature data ───────────────────────────────────────────────── */
const features = [
  {
    icon: Radar, title: "Exposure Intelligence",
    description: "Continuous monitoring of dark web forums, public code repositories, and misconfigured infrastructure to identify exposed credentials and proprietary data before exploitation.",
    span: "md:col-span-2", iconColor: "text-primary", textSize: "text-base",
  },
  {
    icon: Network, title: "Attack Path Analysis",
    description: "Visualize potential kill chains based on external vulnerabilities and leaked organizational charts.",
    span: "", iconColor: "text-secondary", textSize: "text-sm",
  },
  {
    icon: History, title: "Digital Footprint Timeline",
    description: "Track changes in your external attack surface historically, correlating events with major deployments or acquisitions.",
    span: "", iconColor: "text-primary", textSize: "text-sm",
  },
  {
    icon: Lock, title: "Privacy Guardian",
    description: "Automated takedown requests and continuous monitoring for executive PII exposure across data broker networks.",
    span: "", iconColor: "text-secondary", textSize: "text-sm",
  },
  {
    icon: BrainCircuit, title: "AI Security Copilot",
    description: "Context-aware AI recommendations to remediate complex external misconfigurations and draft security policies.",
    span: "", iconColor: "text-primary", textSize: "text-sm",
  },
];

export default function Home() {
  /* ─── Scroll-linked hero parallax ──────────────────────────────── */
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroProgress, [0, 0.5, 1], [1, 0.6, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.96]);
  const heroSpringY = useSpring(heroY, slowSpring);
  const heroSpringOpacity = useSpring(heroOpacity, { stiffness: 80, damping: 25 });
  const heroSpringScale = useSpring(heroScale, slowSpring);

  /* ─── Globe scroll reveal ──────────────────────────────────────── */
  const globeRef = useRef(null);
  const { scrollYProgress: globeProgress } = useScroll({
    target: globeRef,
    offset: ["start end", "center center"],
  });
  const globeScale = useSpring(useTransform(globeProgress, [0, 1], [0.88, 1]), slowSpring);
  const globeOpacity = useSpring(useTransform(globeProgress, [0, 0.6], [0, 1]), { stiffness: 80, damping: 25 });

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground relative">
      {/* ─── Global Background Shader ────────────────────────────── */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <HeroShader />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/50" />
      </div>

      <Navbar />

      <main className="flex-grow pt-24 overflow-x-hidden relative z-10">
        {/* ─── Hero Section ──────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-[100vh] flex items-center justify-center"
        >
          <motion.div
            className="relative z-10 max-w-[1440px] mx-auto px-6 text-center flex flex-col items-center gap-8"
            style={{
              y: heroSpringY,
              opacity: heroSpringOpacity,
              scale: heroSpringScale,
            }}
          >
            {/* Headline — word by word reveal */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground max-w-4xl mx-auto leading-tight">
              {"Your Digital Shadow Is".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.3em]"
                  initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.8,
                    ease: appleEase,
                    delay: 0.4 + i * 0.08,
                  }}
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {"Larger Than You Think.".split(" ").map((word, i) => (
                <motion.span
                  key={`b-${i}`}
                  className="inline-block mr-[0.3em] bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.8,
                    ease: appleEase,
                    delay: 0.4 + (4 + i) * 0.08,
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: appleEase, delay: 1.2 }}
              className="text-lg md:text-xl font-sans text-muted-foreground max-w-2xl mx-auto"
            >
              ShadowMap discovers what attackers can learn about you from
              publicly available information and transforms it into actionable
              exposure intelligence.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: appleEase, delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground px-8 py-6 rounded-xl text-base font-mono hover:shadow-lg hover:shadow-primary/25 transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]">
                  Start Investigation
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="px-8 py-6 rounded-xl text-base font-mono flex items-center gap-2 border border-white/10 hover:bg-white/5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-500"
              >
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Globe Section ─────────────────────────────────────── */}
        <section ref={globeRef} className="py-32 px-6 relative" id="globe">
          <div className="relative z-10 max-w-[1440px] mx-auto">
            <Reveal className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full glass-panel text-xs font-mono text-secondary uppercase tracking-widest border border-secondary/30 bg-secondary/10">
                <Globe className="w-3.5 h-3.5" />
                Global Threat Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-foreground mb-5">
                Global Threat Monitor
              </h2>
              <p className="text-lg md:text-xl font-sans text-muted-foreground max-w-2xl mx-auto">
                Watch cyber attacks unfold across the globe in real-time.
              </p>
            </Reveal>

            {/* Globe container with scroll-driven scale */}
            <motion.div
              className="relative mx-auto rounded-2xl overflow-hidden border border-white/5"
              style={{
                maxWidth: "950px",
                height: "620px",
                scale: globeScale,
                opacity: globeOpacity,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background/80 backdrop-blur-md" />
              <AttackGlobe />
            </motion.div>
          </div>
        </section>

        {/* ─── Features ──────────────────────────────────────────── */}
        <section className="py-32 px-6 max-w-[1440px] mx-auto relative z-10" id="features">
          <Reveal className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-foreground mb-5">
              Exposure Intelligence Core
            </h2>
            <p className="text-lg md:text-xl font-sans text-muted-foreground max-w-2xl mx-auto">
              Analyze, visualize, and neutralize external threats across your
              entire digital footprint.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={idx * 0.1} y={30} className={feature.span}>
                  <div className="feature-card glass-panel p-10 rounded-2xl relative overflow-hidden group h-full">
                    {/* Top glow */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
                      transition={{ duration: 0.6, ease: appleEase }}
                    >
                      <Icon className={`w-10 h-10 ${feature.iconColor} mb-5`} />
                    </motion.div>
                    <h3 className="text-2xl font-heading font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className={`${feature.textSize} font-sans text-muted-foreground leading-relaxed`}>
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
