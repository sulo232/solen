export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { Redis } from "@upstash/redis";

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  try {
    const { phone } = await request.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ message: "Ungültige Telefonnummer" }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ message: "Redis nicht konfiguriert" }, { status: 500 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis (valid for 10 mins)
    await redis.set(`phone_otp:${phone}`, otp, { ex: 600 });

    const sevenApiKey = process.env.SEVEN_API_KEY;
    if (!sevenApiKey) {
      console.warn("SEVEN_API_KEY is missing. OTP generated but not sent:", otp);
      // In development without key, we return success so frontend can continue 
      // (maybe log it to console or show in UI if debug active).
      return NextResponse.json({ message: "SMS gesendet (Simuliert - Key fehlt)" });
    }

    const text = `Dein solen.ch Bestätigungscode lautet: ${otp}. Er ist für 10 Minuten gültig.`;
    
    const response = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": sevenApiKey
      },
      body: JSON.stringify({
        to: phone,
        text: text,
        from: "solen.ch"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("seven.io error:", errorText);
      return NextResponse.json({ message: "Fehler beim Senden der SMS" }, { status: 500 });
    }

    return NextResponse.json({ message: "SMS gesendet" });

  } catch (error) {
    console.error("Phone send error:", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
