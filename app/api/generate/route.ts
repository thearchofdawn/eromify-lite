import { NextResponse } from "next/server";
import { generateImage } from "@/src/lib/providers";
import { personas } from "@/src/lib/demo-data";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const persona = personas.find((p) => p.id === input.personaId);
    if (!persona) return NextResponse.json({ error: "Persona not found" }, { status: 400 });

    const enriched = {
      ...input,
      prompt: `${persona.visualProfile}. ${input.prompt}`,
      count: Math.min(Math.max(Number(input.count) || 1, 1), 8)
    };

    const result = await generateImage(enriched);
    return NextResponse.json({ ...result, persona });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
