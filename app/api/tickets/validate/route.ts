import { NextResponse } from "next/server";
import { verifyTicket } from "@/lib/hmac";

// POST /api/tickets/validate { code, destination_id, valid_date, signature } -> { authentic }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const authentic = verifyTicket(String(b.code ?? ""), String(b.destination_id ?? ""), String(b.valid_date ?? ""), String(b.signature ?? ""));
  return NextResponse.json({ authentic });
}

