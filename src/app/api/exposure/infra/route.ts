import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json({ error: "IP address is required" }, { status: 400 });
  }

  try {
    // Shodan InternetDB API (100% Free, No Authentication required)
    const response = await fetch(`https://internetdb.shodan.io/${ip}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ 
          ip, 
          ports: [], 
          cpes: [], 
          hostnames: [], 
          tags: [], 
          vulns: [] 
        });
      }
      throw new Error(`InternetDB API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Infrastructure Exposure API Error:", error);
    return NextResponse.json({ error: "Failed to fetch infrastructure data" }, { status: 500 });
  }
}
