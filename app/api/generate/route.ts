import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateImage } from "@/src/lib/providers";
import { personas as demoPersonas } from "@/src/lib/demo-data";
import { createClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

async function prepareReferenceImage(supabase: any, userId: string, storagePath: string | null) {
  const inputDir = process.env.COMFYUI_INPUT_DIR;
  if (!inputDir || !storagePath) return undefined;

  const { data, error } = await supabase.storage.from("references").download(storagePath);
  if (error || !data) throw new Error(error?.message || "Unable to download persona reference");

  const ext = path.extname(storagePath) || ".jpg";
  const fileName = "eromify-" + crypto.randomUUID() + ext;
  await mkdir(inputDir, { recursive: true });
  await writeFile(path.join(inputDir, fileName), Buffer.from(await data.arrayBuffer()));
  return fileName;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    let persona: any = demoPersonas.find(p => p.id === input.personaId);
    let userId: string | null = null;
    let supabase: any = null;
    let referenceImageName: string | undefined;
    let referenceImageUrl: string | undefined;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      supabase = await createClient();
      const { data: claims } = await supabase.auth.getClaims();
      userId = claims?.claims?.sub ?? null;
      if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

      const { data, error } = await supabase.from("personas").select("*").eq("id", input.personaId).eq("user_id", userId).single();
      if (error || !data) return NextResponse.json({ error: "Persona not found" }, { status: 400 });

      persona = {
        id: data.id,
        name: data.name,
        description: data.description,
        visualProfile: data.visual_profile,
        referenceImagePath: data.reference_image_path
      };

      if ((process.env.IMAGE_PROVIDER || "gemini").toLowerCase() === "comfy") {
        referenceImageName = await prepareReferenceImage(supabase, userId, persona.referenceImagePath);
      } else if (persona.referenceImagePath) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("references")
          .createSignedUrl(persona.referenceImagePath, 300);
        if (signedError) throw new Error(signedError.message);
        referenceImageUrl = signed?.signedUrl;
      }
    }

    if (!persona) return NextResponse.json({ error: "Persona not found" }, { status: 400 });

    const enriched = {
      personaId: persona.id,
      prompt: `${persona.visualProfile}. ${String(input.prompt || "").trim()}`,
      aspectRatio: input.aspectRatio,
      count: Math.min(Math.max(Number(input.count) || 1, 1), 8),
      referenceImageName,
      referenceImageUrl
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
