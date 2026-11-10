import { NextResponse } from "next/server";
import { signTicket } from "@/lib/hmac";

// POST /api/tickets/sign  { tickets: [{code, destination_id, valid_date}] } -> { signatures: string[] }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const list = Array.isArray(body?.tickets) ? body.tickets : [];
  if (list.length === 0 || list.length > 20000) return NextResponse.json({ error: "Daftar tiket tidak valid" }, { status: 400 });
  const signatures = list.map((t: { code: string; destination_id: string; valid_date: string }) => signTicket(String(t.code), String(t.destination_id), String(t.valid_date)));
  return NextResponse.json({ signatures });
}

