import { NextResponse } from "next/server";

export async function GET() {
  // Simulate checking various systems
  const start = Date.now();
  
  // Simulate a slight delay to represent actual DB/Node pings
  await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));

  const end = Date.now();
  const latency = end - start;

  return NextResponse.json({
    status: "operational",
    latencyMs: latency,
    timestamp: new Date().toISOString(),
    services: [
      { name: "Global API", status: "operational", latency: Math.floor(latency * 0.4) },
      { name: "OSINT Nodes", status: "operational", latency: Math.floor(latency * 0.5) },
      { name: "Encrypted DB", status: "operational", latency: Math.floor(latency * 0.8) }
    ]
  });
}
