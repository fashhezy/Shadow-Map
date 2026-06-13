"use client";

import { useState, useEffect } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getUserScans } from "@/lib/db";

// Custom node styling
const nodeStyle = {
  background: "#0B101A",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "16px",
  color: "#fff",
  width: 280,
  fontSize: "12px",
  fontFamily: "var(--font-sans)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  lineHeight: "1.5",
};

export default function AttackPathsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      let firebaseScans = null;
      if (user) {
        firebaseScans = await getUserScans(user.uid);
      }
      
      let dataToUse = null;
      
      if (firebaseScans && firebaseScans.length > 0) {
        dataToUse = firebaseScans[0]; // Get the latest scan
      } else {
        // Fallback to sessionStorage
        const stored = sessionStorage.getItem("scanResults");
        if (stored) {
          try {
            dataToUse = JSON.parse(stored);
          } catch {}
        }
      }
      
      if (dataToUse && dataToUse.attackPaths && dataToUse.attackPaths.length > 0) {
        setHasData(true);
        const data = dataToUse;
          
          const initialNodes: any[] = [];
          const initialEdges: any[] = [];
          
          // Root Node (The Target)
          initialNodes.push({
            id: "root",
            data: { label: `Target: ${data.target}` },
            position: { x: 50, y: Math.max((data.attackPaths.length * 200) / 2 - 50, 50) },
            style: { ...nodeStyle, border: "1px solid rgba(33, 212, 243, 0.5)", background: "rgba(33, 212, 243, 0.1)", fontWeight: "bold" },
          });

          // Generate paths
          data.attackPaths.forEach((path: any, i: number) => {
            const pathY = i * 250 + 50;
            
            // Path Head Node
            const pathNodeId = `path-${i}`;
            
            // Color based on impact
            let borderColor = "rgba(255, 255, 255, 0.1)";
            let bgColor = "#0B101A";
            if (path.impact?.toLowerCase() === "critical") { borderColor = "rgba(239, 68, 68, 0.5)"; bgColor = "rgba(239, 68, 68, 0.1)"; }
            else if (path.impact?.toLowerCase() === "high") { borderColor = "rgba(255, 183, 132, 0.5)"; bgColor = "rgba(255, 183, 132, 0.1)"; }
            else if (path.impact?.toLowerCase() === "medium") { borderColor = "rgba(33, 212, 243, 0.5)"; bgColor = "rgba(33, 212, 243, 0.1)"; }

            initialNodes.push({
              id: pathNodeId,
              data: { label: `[${path.impact?.toUpperCase()}] ${path.name}` },
              position: { x: 450, y: pathY },
              style: { ...nodeStyle, border: borderColor, background: bgColor, fontWeight: "bold" },
            });

            initialEdges.push({
              id: `edge-root-${pathNodeId}`,
              source: "root",
              target: pathNodeId,
              animated: true,
              style: { stroke: "#fff", strokeWidth: 2, opacity: 0.3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#fff" },
            });

            // Steps
            let prevId = pathNodeId;
            path.steps.forEach((step: string, j: number) => {
              const stepId = `path-${i}-step-${j}`;
              initialNodes.push({
                id: stepId,
                data: { label: step },
                position: { x: 850 + (j * 320), y: pathY },
                style: nodeStyle,
              });

              initialEdges.push({
                id: `edge-${prevId}-${stepId}`,
                source: prevId,
                target: stepId,
                animated: true,
                style: { stroke: "#06B6D4", strokeWidth: 1.5, opacity: 0.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#06B6D4" },
              });
              
              prevId = stepId;
            });
          });

          setNodes(initialNodes);
          setEdges(initialEdges);
      } else {
        setHasData(false);
      }
    }
    loadData();
  }, [user]);

  if (hasData === null) return null;

  if (!hasData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 w-full max-w-[1440px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">No Attack Paths Identified</h1>
        <p className="text-base font-sans text-muted-foreground max-w-lg mb-8">
          We haven&apos;t mapped any potential attack vectors yet. Run an exposure scan to analyze your target&apos;s vulnerabilities.
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 w-full h-[calc(100vh-80px)] flex flex-col mx-auto max-w-[1600px]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Attack Path Mapping</h1>
          <p className="text-sm font-sans text-muted-foreground mt-1">Interactive visualization of potential exploitation routes identified by AI.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl border border-border overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          className="bg-background"
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#ffffff" gap={16} size={1} style={{ opacity: 0.05 }} />
          <Controls />
        </ReactFlow>
      </div>
    </motion.div>
  );
}
