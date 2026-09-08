import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found", code: "NOT_FOUND" },
    { status: 404 },
  );
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  return rateLimited ?? notFoundResponse();
}

export function HEAD() {
  return new NextResponse(null, { status: 404 });
}

export {
  notFoundResponse as POST,
  notFoundResponse as PUT,
  notFoundResponse as PATCH,
  notFoundResponse as DELETE,
  notFoundResponse as OPTIONS,
};
