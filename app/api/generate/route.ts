import { NextResponse } from "next/server";
import { generateImage } from "@/src/lib/providers";
import { personas as demoPersonas } from "@/src/lib/demo-data";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    let persona: any = demoPersonas.find(p => p.id === input.personaId);
    let userId: string | null = null;
    let supabase: any = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      supabase = await createClient();
      const { data: claims } = await supabase.auth.getClaims();
      userId = claims?.claims?.sub ?? null;
      if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

      const { data, error } = await supabase.from("personas").select("*").eq("id", input.personaId).single();
      if (error || !data) return NextResponse.json({ error: "Persona not found" }, { status: 400 });
      persona = {
        id: data.id,
        name: data.name,
        description: data.description,
        visualProfile: data.visual_profile,
        referenceImagePath: data.reference_image_path
      };
    }

    if (!persona) return NextResponse.json({ error: "Persona not found" }, { status: 400 });

    const enriched = {
      personaId: persona.id,
      prompt: `${persona.visualProfile}. ${String(input.prompt || "").trim()}`,
      aspectRatio: input.aspectRatio,
      count: Math.min(Math.max(Number(input.count) || 1, 1), 8)
    };

    const result = await generateImage(enriched);

    if (supabase && userId) {
      await supabase.from("generation_jobs").insert({
        user_id: userId,
        persona_id: persona.id,
        prompt: enriched.prompt,
        aspect_ratio: enriched.aspectRatio,
        count: enriched.count,
        provider: result.provider,
        provider_job_id: result.jobId,
        status: result.status
      });
    }

    return NextResponse.json({ ...result, persona });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
