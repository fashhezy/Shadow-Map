import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context } = body;

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openRouterKey && (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "No AI API key configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are the ShadowMap AI Security Copilot — an expert cybersecurity analyst specializing in OSINT, digital exposure analysis, attack path modeling, and privacy remediation.

You are embedded in a Digital Exposure Intelligence Platform. Your role is to:
1. Analyze potential attack vectors from publicly available data
2. Explain security findings in clear, actionable terms
3. Recommend specific remediation steps
4. Help users understand their digital footprint and exposure
5. Provide privacy-focused guidance for data removal and protection

Context from the current investigation (if available):
${context ? JSON.stringify(context) : "No active investigation context."}

IMPORTANT RULES:
- Be concise but thorough
- Use cybersecurity terminology appropriately  
- Provide specific, actionable recommendations
- When discussing risks, explain the real-world impact
- Format responses with clear structure using markdown
- Never generate fake credentials or personally identifiable information
- Always recommend ethical and legal approaches to security`;

    let response;
    let success = false;
    let usedOpenRouter = false;

    if (openRouterKey) {
      const freeModels = [
        "nex-agi/nex-n2-pro:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      
      for (const modelId of freeModels) {
        try {
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "ShadowMap OSINT",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelId, 
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
              ],
            })
          });
          
          if (response.ok) {
            success = true;
            usedOpenRouter = true;
            break; // Stop trying if we got a successful response
          }
        } catch (e) {
          console.error(`Model ${modelId} failed:`, e);
        }
      }
    }
    
    // Fallback to native Gemini if OpenRouter failed or was not configured
    if (!success && geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY") {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am the ShadowMap AI Security Copilot, ready to assist. How can I help you?" }] },
                { role: "user", parts: [{ text: message }] },
              ],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
          }
        );
        if (response.ok) {
           success = true;
           usedOpenRouter = false;
        }
      } catch (e) {
        console.error("Gemini fallback failed", e);
      }
    }

    if (!response || !response.ok) {
      // Graceful fallback if Gemini API is rate limited
      console.warn("Gemini API rate limited or failed, using local fallback model.");
      
      const lowercaseMsg = message.toLowerCase();
      let fallbackResponse = "I'm currently operating in offline mode due to API rate limits. ";
      
      if (lowercaseMsg.includes("ip") || lowercaseMsg.includes("port")) {
        fallbackResponse += "When reviewing exposed infrastructure, always prioritize closing administrative ports (like 22, 3389) and ensuring your database ports are firewalled.";
      } else if (lowercaseMsg.includes("domain") || lowercaseMsg.includes("dns")) {
        fallbackResponse += "For domains, I recommend regularly auditing your DNS records for dangling subdomains, which can lead to subdomain takeover attacks.";
      } else if (lowercaseMsg.includes("password") || lowercaseMsg.includes("breach")) {
        fallbackResponse += "If you discover breached credentials, immediately reset the password and enable Multi-Factor Authentication (MFA) across all your accounts.";
      } else if (lowercaseMsg.includes("hello") || lowercaseMsg.includes("hi")) {
        fallbackResponse = "Hello Operative. I'm operating in offline-mode right now, but I can still offer fundamental cybersecurity advice. What are you investigating?";
      } else {
        fallbackResponse += "Based on standard OSINT practices, I recommend reviewing the 'Exposure Scanner' tab to verify if any critical CVEs have been detected on your assets.";
      }
      
      // Artificial delay to simulate "thinking"
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ response: fallbackResponse });
    }

    const data = await response.json();
    
    let text = "";
    if (usedOpenRouter) {
      text = data.choices?.[0]?.message?.content;
    } else {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    return NextResponse.json({ response: text || "I couldn't generate a response. Please try again." });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { response: "I'm currently operating in offline mode due to connection issues. I advise maintaining a high security posture and reviewing the open exposures." },
      { status: 200 } // Return 200 so the frontend still shows the chat message
    );
  }
}
