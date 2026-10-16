import { NextResponse } from "next/server";
import { searchTavily } from "@/lib/tavily";
import { analyzeTechnology } from "@/lib/nemotron";
import type { Finding } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const technologies: string[] = body?.technologies ?? [];

  if (!Array.isArray(technologies) || technologies.length === 0) {
    return NextResponse.json(
      { error: "Add at least one technology first." },
      { status: 400 }
    );
  }

  const findings: Finding[] = [];
  const errors: string[] = [];

  // Scan each technology in parallel
  await Promise.all(
    technologies.map(async (tech) => {
      try {
        const results = await searchTavily(
          `${tech} deprecation OR breaking change OR security advisory OR release notes`
        );
        const found = await analyzeTechnology(tech, technologies, results);
        findings.push(...found);
      } catch (e) {
        errors.push(`${tech}: ${e instanceof Error ? e.message : "failed"}`);
      }
    })
  );

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    technologies,
    findings,
    errors,
  });
}