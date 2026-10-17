import { NextResponse } from "next/server";
import { challengeFinding } from "@/lib/challenge";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.finding || !Array.isArray(body?.stack)) {
    return NextResponse.json(
      { error: "Missing finding or stack." },
      { status: 400 }
    );
  }

  try {
    const result = await challengeFinding(body.finding, body.stack);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Challenge failed" },
      { status: 500 }
    );
  }
}